
import React, { useState, useEffect } from 'react';
import { ClipboardList, Sparkles, Loader2, Save, User, Activity, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { patientService, aiService } from '../../src/services';
import { Patient } from '../../src/types';

const NutriAnamnese: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const [formData, setFormData] = useState({
    objective: '',
    clinicalHistory: '',
    allergies: '',
    lifestyle: '', // Now used for generic lifestyle notes
    digestion: '',
    bowelHabit: '',
    sleepQuality: 'Bom',
    stressLevel: 'Médio',
    physicalActivity: '',
    appetite: 'Normal',
    medications: '',
    hydration: '',
    obs: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getPatients({ pageSize: 100 });
      setPatients(response.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      fetchLastAnamnesis(selectedPatientId);
    } else {
      resetForm();
    }
  }, [selectedPatientId]);

  const fetchLastAnamnesis = async (id: string) => {
    try {
      setLoading(true);
      const history = await patientService.getPatientHistory(id);
      const lastAnamnesis = history.find(h => h.type === 'anamnesis');

      if (lastAnamnesis && lastAnamnesis.description) {
        const desc = lastAnamnesis.description;
        const getValue = (label: string) => {
          const regex = new RegExp(`${label}: (.*)`, 'i');
          const match = desc.match(regex);
          return match ? match[1].trim() : '';
        };

        setFormData({
          objective: getValue('OBJETIVO'),
          clinicalHistory: getValue('HISTÓRICO CLÍNICO'),
          allergies: getValue('ALERGIAS/INTOLERÂNCIAS'),
          lifestyle: '',
          digestion: getValue('DIGESTÃO'),
          bowelHabit: getValue('HÁBITO INTESTINAL'),
          sleepQuality: getValue('SONO') || 'Bom',
          stressLevel: getValue('ESTRESSE') || 'Médio',
          physicalActivity: getValue('ATIVIDADE FÍSICA'),
          appetite: 'Normal',
          medications: getValue('MEDICAMENTOS'),
          hydration: getValue('HIDRATAÇÃO'),
          obs: getValue('OBSERVAÇÕES')
        });
      }
    } catch (error) {
      console.error('Erro ao buscar última anamnese:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      objective: '',
      clinicalHistory: '',
      allergies: '',
      lifestyle: '',
      digestion: '',
      bowelHabit: '',
      sleepQuality: 'Bom',
      stressLevel: 'Médio',
      physicalActivity: '',
      appetite: 'Normal',
      medications: '',
      hydration: '',
      obs: ''
    });
    setAnalysis('');
  };

  const handleAIAnalysis = async () => {
    if (!selectedPatientId) {
      alert('Selecione um paciente para análise.');
      return;
    }
    setAnalyzing(true);
    try {
      const patient = patients.find(p => p.id === selectedPatientId);
      const result = await aiService.analyzeAnamnesis({
        ...patient,
        ...formData
      });
      setAnalysis(result);
    } catch (error: any) {
      alert(error.message || 'Falha na análise IA');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPatientId) {
      alert('Selecione um paciente.');
      return;
    }
    setLoading(true);
    try {
      const summary = `
OBJETIVO: ${formData.objective}
HISTÓRICO CLÍNICO: ${formData.clinicalHistory}
ALERGIAS/INTOLERÂNCIAS: ${formData.allergies}
ATIVIDADE FÍSICA: ${formData.physicalActivity}
DIGESTÃO: ${formData.digestion}
HÁBITO INTESTINAL: ${formData.bowelHabit}
SONO: ${formData.sleepQuality}
ESTRESSE: ${formData.stressLevel}
MEDICAMENTOS: ${formData.medications}
HIDRATAÇÃO: ${formData.hydration}
OBSERVAÇÕES: ${formData.obs}

ANÁLISE IA:
${analysis || 'Nenhuma análise realizada.'}
      `;

      await patientService.addHistoryEntry(selectedPatientId, {
        type: 'anamnesis',
        title: 'Anamnese Nutricional Detalhada',
        description: summary
      });

      alert('Anamnese salva no histórico do paciente!');
      setFormData({
        objective: '',
        clinicalHistory: '',
        allergies: '',
        lifestyle: '',
        digestion: '',
        bowelHabit: '',
        sleepQuality: 'Bom',
        stressLevel: 'Médio',
        physicalActivity: '',
        appetite: 'Normal',
        medications: '',
        hydration: '',
        obs: ''
      });
      setAnalysis('');
      setSelectedPatientId('');
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Anamnese Clínica</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Coleta de dados e análise profunda do paciente.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="p-4 bg-white border border-slate-100 rounded-2xl font-bold outline-emerald-500 shadow-xl shadow-slate-200/50"
          >
            <option value="">Selecione o Paciente...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl"><ClipboardList size={24} /></div>
            <h2 className="text-2xl font-black text-slate-900">Formulário de Entrada</h2>
          </div>

          <div className="grid gap-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Objetivo Principal</label>
              <input
                type="text"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                placeholder="Ex: Emagrecimento, Hipertrofia..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Histórico Clínico</label>
              <textarea
                value={formData.clinicalHistory}
                onChange={(e) => setFormData({ ...formData, clinicalHistory: e.target.value })}
                placeholder="Patologias, cirurgias, medicamentos em uso..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium outline-emerald-500 min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Alergias e Intolerâncias</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Glúten, Lactose, Amendoim..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Atividade Física</label>
                <input
                  type="text"
                  value={formData.physicalActivity}
                  onChange={(e) => setFormData({ ...formData, physicalActivity: e.target.value })}
                  placeholder="Frequência e tipo..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Hidratação (L/dia)</label>
                <input
                  type="text"
                  value={formData.hydration}
                  onChange={(e) => setFormData({ ...formData, hydration: e.target.value })}
                  placeholder="Ex: 2L"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Digestão</label>
                <select
                  value={formData.digestion}
                  onChange={(e) => setFormData({ ...formData, digestion: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
                >
                  <option value="">Selecione...</option>
                  <option value="Boa">Boa</option>
                  <option value="Lenta">Lenta/Pesada</option>
                  <option value="Gastrite/Refluxo">Gastrite/Refluxo</option>
                  <option value="Gases/Estufamento">Gases/Estufamento</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Hábito Intestinal</label>
                <select
                  value={formData.bowelHabit}
                  onChange={(e) => setFormData({ ...formData, bowelHabit: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
                >
                  <option value="">Selecione...</option>
                  <option value="Regular">Diário/Regular</option>
                  <option value="Constipado">Constipado</option>
                  <option value="Diarréico">Diarréico</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Qualidade do Sono</label>
                <select
                  value={formData.sleepQuality}
                  onChange={(e) => setFormData({ ...formData, sleepQuality: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
                >
                  <option value="Excelente">Excelente</option>
                  <option value="Bom">Bom</option>
                  <option value="Regular">Regular</option>
                  <option value="Ruim">Ruim</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Nível de Estresse</label>
                <select
                  value={formData.stressLevel}
                  onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
                >
                  <option value="Baixo">Baixo</option>
                  <option value="Médio">Médio</option>
                  <option value="Alto">Alto</option>
                  <option value="Extremo">Extremo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Medicamentos / Suplementos</label>
              <input
                type="text"
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                placeholder="Medicamentos de uso contínuo..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              onClick={handleAIAnalysis}
              disabled={analyzing || !selectedPatientId}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              Analisar com IA
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !selectedPatientId}
              className="flex-1 py-4 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              Salvar Ficha
            </button>
          </div>
        </div>

        <div className="space-y-10 flex flex-col">
          <div className="bg-emerald-900 p-10 rounded-[40px] text-white flex-1 relative overflow-hidden shadow-2xl shadow-emerald-900/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="text-emerald-400" />
              <h3 className="text-2xl font-black tracking-tight">Análise Inteligente NutriSaaS</h3>
            </div>

            {analysis ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap font-medium leading-relaxed opacity-90">
                    {analysis}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-emerald-300 text-xs font-black uppercase tracking-widest">
                  <Activity size={16} /> Insights de Bioquímica e Comportamento
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
                <Activity size={64} className="animate-pulse" />
                <p className="font-bold text-lg max-w-[250px]">Preencha os dados e clique em Analisar para obter insights clínicos da nossa IA.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 shrink-0"><AlertCircle size={32} /></div>
            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Próximo Passo</h4>
              <p className="text-slate-500 text-xs font-bold leading-relaxed">Após a anamnese, você pode prosseguir para a aba de Evolução para registrar as primeiras medições físicas.</p>
            </div>
            <ChevronRight className="ml-auto text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutriAnamnese;
