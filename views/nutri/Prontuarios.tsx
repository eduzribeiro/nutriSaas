
import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, ChevronRight, X, Save, Loader2, User, Calendar, Activity, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { patientService } from '../../src/services';
import { Patient, PatientHistory } from '../../src/types';

const NutriProntuarios: React.FC = () => {
  const [mode, setMode] = useState<'list' | 'editor'>('list');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [searchParams] = useSearchParams();
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [searchTerm, setSearchTerm] = useState('');

  const [newEntry, setNewEntry] = useState({
    title: 'Resumo de Consulta',
    type: 'consultation' as const,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchHistory(selectedPatientId);
    } else {
      setHistory([]);
    }
  }, [selectedPatientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await patientService.getPatients({ pageSize: 100 });
      setPatients(response.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (patientId: string) => {
    try {
      setLoading(true);
      const hostoryRes = await patientService.getPatientHistory(patientId);
      setHistory(hostoryRes);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPatientId || !newEntry.description) {
      alert('Selecione um paciente e preencha a descrição.');
      return;
    }

    setSaving(true);
    try {
      await patientService.addHistoryEntry(selectedPatientId, {
        type: newEntry.type,
        title: newEntry.title,
        description: newEntry.description
      });
      alert('Registro salvo com sucesso!');
      await fetchHistory(selectedPatientId);
      setMode('list');
      setNewEntry({ title: 'Resumo de Consulta', type: 'consultation', description: '' });
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar registro');
    } finally {
      setSaving(false);
    }
  };

  const filteredHistory = history.filter(h =>
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (mode === 'editor') {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <button onClick={() => setMode('list')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-black uppercase tracking-widest text-xs transition-all"><ArrowLeft size={20} /> Voltar para Prontuários</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black shadow-2xl hover:bg-slate-800 transition-all text-sm uppercase tracking-widest"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} className="text-emerald-400" />}
            Salvar Registro
          </button>
        </div>

        <div className="bg-white p-12 rounded-[50px] shadow-2xl shadow-slate-200/60 border border-slate-50 space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Plus size={24} /></div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Novo Registro Clínico</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Paciente</label>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <User size={20} className="text-slate-400" />
                <span className="font-bold text-slate-900">
                  {patients.find(p => p.id === selectedPatientId)?.name || 'Selecione abaixo'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Registro</label>
              <select
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as any })}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 appearance-none shadow-inner"
              >
                <option value="consultation">Consulta de Rotina</option>
                <option value="note">Acompanhamento / Notas</option>
                <option value="anamnesis">Anamnese</option>
                <option value="measurement">Dados Antropométricos</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Título do Evento</label>
            <input
              type="text"
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] font-black text-lg outline-emerald-500"
              placeholder="Ex: Primeira Evolução Pós-Dieta..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Relato Detalhado / Observações</label>
            <textarea
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] font-medium text-lg outline-emerald-500 min-h-[350px] shadow-inner"
              placeholder="Escreva aqui tudo o que foi discutido ou observado..."
            />
          </div>

          <div className="flex items-center gap-4 p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <Activity size={20} className="text-emerald-500" />
            <p className="text-xs font-bold text-slate-400 leading-relaxed">Este registro será criptografado e ficará disponível para consulta vitalícia no prontuário do paciente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Prontuários</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Histórico integrado e clínico dos atendimentos.</p>
        </div>
        <button
          onClick={() => {
            if (!selectedPatientId) {
              alert('Por favor, selecione um paciente primeiro para inserir um novo registro.');
              return;
            }
            setMode('editor');
          }}
          className="flex items-center gap-3 px-8 py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50 disabled:grayscale disabled:scale-100"
        >
          <Plus size={20} /> Novo Registro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Filtrar por Paciente</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 shadow-inner appearance-none"
              >
                <option value="">Selecione um paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <Activity size={16} className="text-emerald-500" /> Estatísticas do Paciente
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total Registros</p>
                  <p className="text-2xl font-black text-slate-900">{history.length}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Última Consulta</p>
                  <p className="text-xs font-black text-slate-900">{history[0] ? new Date(history[0].createdAt).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {!selectedPatientId && (
            <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100/50 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-white rounded-3xl text-emerald-600 shadow-sm"><User size={32} /></div>
              <h4 className="font-black text-emerald-900 uppercase text-sm tracking-tight">Ação Necessária</h4>
              <p className="text-emerald-700 text-xs font-bold leading-relaxed px-4">Selecione um paciente à esquerda para visualizar seu prontuário detalhado e interações anteriores.</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><Search size={22} /></div>
            <input
              type="text"
              placeholder="Pesquisar em relatos, exames e datas..."
              className="flex-1 outline-none font-bold text-slate-800 placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20 opacity-20"><Loader2 className="animate-spin" size={48} /></div>
            ) : filteredHistory.length > 0 ? (
              filteredHistory.map((h) => (
                <div key={h.id} className="group bg-white p-8 md:p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 hover:shadow-slate-300/40 transition-all hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${h.type === 'consultation' ? 'bg-blue-100 text-blue-600' :
                      h.type === 'anamnesis' ? 'bg-purple-100 text-purple-600' :
                        h.type === 'measurement' ? 'bg-emerald-100 text-emerald-600' :
                          h.type === 'note' ? 'bg-orange-100 text-orange-600' :
                            'bg-slate-100 text-slate-500'
                      }`}>
                      {h.type === 'consultation' ? 'Consulta' :
                        h.type === 'anamnesis' ? 'Anamnese' :
                          h.type === 'measurement' ? 'Dados Antropométricos' :
                            h.type === 'note' ? 'Nota' : h.type}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-16 h-16 bg-slate-50 rounded-[20px] mb-4 flex items-center justify-center text-slate-300 shadow-inner group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shrink-0">
                      <FileText size={32} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">{h.title}</h3>
                      <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={14} className="text-emerald-500" /> {new Date(h.createdAt).toLocaleDateString('pt-BR')}
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <ClipboardCheck size={14} className="text-emerald-500" /> Registro Profissional
                      </div>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-500 font-medium leading-relaxed whitespace-pre-wrap line-clamp-4 group-hover:line-clamp-none transition-all duration-700">
                          {h.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center space-y-6 bg-slate-50/50 rounded-[50px] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-[28px] shadow-xl flex items-center justify-center text-slate-200 mx-auto">
                  <FileText size={40} />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 tracking-tight">Nenhum registro encontrado</p>
                  <p className="text-slate-400 font-bold mt-1">O histórico clínico do paciente selecionado está vazio.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutriProntuarios;
