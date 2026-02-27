import React, { useState, useEffect } from 'react';
import { Brain, FileText, Plus, Save, Sparkles, Loader2, ChevronLeft, UserCircle, X, Search, Activity, Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../src/context';
import { patientService, mealPlanService, aiService } from '../../src/services';
import { Patient, MealPlan } from '../../src/types';
import { supabase } from '../../src/lib/supabase';

interface MealPlansProps {
  user: any;
}

const DEFAULT_TEMPLATE = `# MODELO PADRÃO - REEDUCAÇÃO ALIMENTAR

**Café da Manhã**
- 1 porção de fruta (ex: mamão, maçã ou banana)
- 2 colheres de sopa de aveia em flocos
- 1 xícara de café ou chá sem açúcar

**Lanche da Manhã**
- 3 unidades de castanhas ou 1 iogurte natural

**Almoço**
- Salada verde à vontade
- 3 colheres de sopa de arroz integral
- 1 concha de feijão
- 150g de proteína grelhada (frango, peixe ou carne magra)

**Lanche da Tarde**
- 1 fatia de pão integral com queijo branco

**Jantar**
- Sopa de legumes ou a mesma composição do almoço (metade da porção de carboidrato)

**Ceia**
- Chá de ervas calmantes`;

const NutriMealPlans: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'selection' | 'ia' | 'editor' | 'list'>('selection');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [title, setTitle] = useState('Plano Alimentar');
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [patientPlans, setPatientPlans] = useState<MealPlan[]>([]);
  const [iaConfig, setIaConfig] = useState({ objective: 'Emagrecimento', observations: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const pId = searchParams.get('patientId');
    const autoMode = searchParams.get('mode');
    if (pId) {
      setSelectedPatientId(pId);
      fetchPatientPlans(pId);
      if (autoMode === 'list') setMode('list');
    }
  }, [searchParams]);

  const fetchPatientPlans = async (id: string) => {
    try {
      setLoading(true);
      const res = await mealPlanService.getPatientMealPlans(id);
      setPatientPlans(res);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [patientsRes, plansRes] = await Promise.all([
        patientService.getPatients({ pageSize: 100 }),
        mealPlanService.getTemplates()
      ]);
      setPatients(patientsRes.data);

      // Only set mode to selection if no patientId in URL (avoid race condition override)
      if (!searchParams.get('patientId')) {
        setMode('selection');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartIA = () => setMode('ia');
  const handleStartTemplate = () => {
    setContent(DEFAULT_TEMPLATE);
    setTitle('Plano Alimentar - Modelo Padrão');
    setMode('editor');
  };
  const handleStartBlank = () => {
    setContent('');
    setTitle('Plano Alimentar');
    setMode('editor');
  };

  const generateWithIA = async () => {
    if (!selectedPatientId) {
      alert('Selecione o paciente primeiro para que a IA considere o contexto dele.');
      return;
    }
    setLoading(true);
    try {
      const response = await aiService.generateMealPlan({
        patientId: selectedPatientId,
        objective: iaConfig.objective,
        observations: iaConfig.observations
      });
      setContent(response);
      setTitle(`Plano Alimentar - ${iaConfig.objective}`);
      setMode('editor');
    } catch (error: any) {
      alert(error.message || 'Erro ao gerar plano com IA');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPatientId) {
      alert('Selecione um paciente para vincular o plano.');
      return;
    }

    setLoading(true);
    try {
      await mealPlanService.createMealPlan({
        tenantId: user.tenantId,
        patientId: selectedPatientId,
        title: title,
        content: content,
        generatedBy: mode === 'ia' ? 'ai' : (content === DEFAULT_TEMPLATE ? 'template' : 'manual'),
        status: 'active',
        createdBy: user.id
      });

      alert('Plano salvo e enviado com sucesso!');
      setShowSaveModal(false);

      // If we have a selected patient, go back to their list, otherwise selection
      if (selectedPatientId) {
        setMode('list');
        fetchPatientPlans(selectedPatientId);
      } else {
        setMode('selection');
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar plano');
    } finally {
      setLoading(false);
    }
  };

  if (loading && mode === 'selection') {
    return <div className="flex items-center justify-center p-20 animate-pulse"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;
  }

  if (mode === 'selection') {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Planos Alimentares</h1>
            <p className="text-slate-500 font-medium text-lg mt-1">Crie estratégias nutricionais inteligentes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <div className="group bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 hover:shadow-emerald-200/40 transition-all hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[22px] flex items-center justify-center mb-8 shadow-inner"><Brain size={32} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Gerar com IA</h3>
            <p className="text-slate-500 font-medium mb-8">Nossa IA analisa o perfil do paciente e sugere a melhor estratégia clínica.</p>
            <button onClick={handleStartIA} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all">Iniciar IA</button>
          </div>

          <div className="group bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 hover:shadow-blue-200/40 transition-all hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[22px] flex items-center justify-center mb-8 shadow-inner"><FileText size={32} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Modelo Padrão</h3>
            <p className="text-slate-500 font-medium mb-8">Utilize sua estrutura base otimizada para reeducação alimentar clássica.</p>
            <button onClick={handleStartTemplate} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">Usar Modelo</button>
          </div>

          <div className="group bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 hover:shadow-slate-300/40 transition-all hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-[22px] flex items-center justify-center mb-8 shadow-inner"><Plus size={32} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Em Branco</h3>
            <p className="text-slate-500 font-medium mb-8">Liberdade total para montar prescrições complexas e personalizadas.</p>
            <button onClick={handleStartBlank} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all">Criar Novo</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'list') {
    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    return (
      <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('selection')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-black uppercase tracking-widest text-xs transition-all"><ChevronLeft size={20} /> Voltar</button>
          <button onClick={() => setMode('selection')} className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest"><Plus size={18} /> Novo Plano</button>
        </div>

        <div className="bg-slate-900 p-10 rounded-[50px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative">
            <p className="text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Histórico Clínico</p>
            <h2 className="text-3xl font-black text-white tracking-tight">Planos de {selectedPatient?.name || 'Paciente'}</h2>
            <p className="text-white/40 font-medium mt-1">Total de {patientPlans.length} planos arquivados.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Buscando Arquivos...</p>
          </div>
        ) : patientPlans.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6"><FileText size={40} /></div>
            <h3 className="text-xl font-black text-slate-900">Nenhum plano salvo</h3>
            <p className="text-slate-400 font-bold mt-2">Você ainda não criou nenhum plano alimentar para este paciente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {patientPlans.map((plan) => (
              <div key={plan.id} className="group bg-white p-8 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/40 hover:shadow-emerald-200/30 transition-all flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-[22px] flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Calendar size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{plan.title}</h4>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Criado em {new Date(plan.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const newStatus = !(plan as any).is_released;
                      try {
                        await (supabase
                          .from('meal_plans') as any)
                          .update({ is_released: newStatus })
                          .eq('id', plan.id);
                        setPatientPlans(patientPlans.map(p => p.id === plan.id ? { ...p, is_released: newStatus } : p));
                      } catch (e) {
                        alert("Erro ao alterar o status do plano.");
                      }
                    }}
                    className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${(plan as any).is_released ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    {(plan as any).is_released ? 'Liberado ao Paciente' : 'Oculto'}
                  </button>
                  <button
                    onClick={() => {
                      setTitle(plan.title);
                      setContent(plan.content);
                      setMode('editor');
                    }}
                    className="px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Visualizar / Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'ia') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-top-10 duration-500">
        <button onClick={() => setMode('selection')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-black uppercase tracking-widest text-xs transition-all"><ChevronLeft size={20} /> Voltar</button>
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-emerald-200/30 border border-emerald-50">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Sparkles size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">IA Nutri Especialista</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Paciente Alvo</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500"
              >
                <option value="">Selecione para contexto IA...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Objetivo Clínico</label>
              <div className="grid grid-cols-2 gap-3">
                {['Emagrecimento', 'Ganho de Massa', 'Saúde Geral', 'Performance'].map(obj => (
                  <button
                    key={obj}
                    onClick={() => setIaConfig({ ...iaConfig, objective: obj })}
                    className={`p-4 rounded-2xl font-bold text-sm transition-all border ${iaConfig.objective === obj ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                  >
                    {obj}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Observações Extras</label>
              <textarea
                value={iaConfig.observations}
                onChange={(e) => setIaConfig({ ...iaConfig, observations: e.target.value })}
                placeholder="Alergias, preferências culinárias, restrições financeiras..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium outline-emerald-500 min-h-[120px]"
              />
            </div>
            <button
              onClick={generateWithIA}
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all text-sm uppercase tracking-widest mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Brain size={20} />}
              {loading ? 'Processando Algoritmos...' : 'Gerar Plano Personalizado'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <button onClick={() => setMode('selection')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-black uppercase tracking-widest text-xs transition-all"><ChevronLeft size={20} /> Descartar</button>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Editor Ativo</span>
          <button onClick={() => setShowSaveModal(true)} className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-[24px] font-black shadow-2xl hover:bg-slate-800 active:scale-95 transition-all text-sm uppercase tracking-widest"><Save size={20} className="text-emerald-400" /> Salvar Plano</button>
        </div>
      </div>

      <div className="bg-white rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/60 min-h-[700px] flex flex-col overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm"><FileText size={20} className="text-slate-400" /></div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-black text-2xl text-slate-800 placeholder:text-slate-300 tracking-tight"
            placeholder="Título do Plano Alimentar"
          />
        </div>
        <textarea
          className="flex-1 p-12 md:p-16 outline-none text-slate-800 leading-relaxed font-medium text-lg resize-none placeholder:text-slate-200 transition-all focus:bg-slate-50/20"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Estruture o plano alimentar aqui convidativo e claro para o paciente..."
        />

        <div className="p-10 border-t border-slate-50 bg-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[22px] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
              {user.profile?.avatar ? <img src={user.profile.avatar} className="w-full h-full object-cover" /> : <UserCircle size={44} className="text-slate-300" />}
            </div>
            <div>
              <p className="font-black text-slate-900 text-xl leading-tight">{user.profile?.name || user.email}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-black mt-1">CRN: {user.profile?.crn || 'NÃO INFORMADO'}</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="flex items-center md:justify-end gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">
              <Activity size={12} /> NutriSaaS Intelligence
            </div>
            <p className="text-[10px] text-slate-300 font-bold uppercase leading-tight max-w-[300px]">
              Documento gerado para uso exclusivo do paciente. Recomendações personalizadas e intransferíveis.
            </p>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-2xl text-slate-900 tracking-tight">Finalizar Prescrição</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-2 hover:bg-white rounded-xl transition-all"><X /></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Vincular ao Paciente</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 appearance-none shadow-inner"
                  >
                    <option value="">Selecione um paciente...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100/50 flex gap-4">
                <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm shrink-0 h-fit"><Sparkles size={20} /></div>
                <div>
                  <p className="text-emerald-900 font-black text-sm mb-1 uppercase tracking-tight">Pronto para envio!</p>
                  <p className="text-emerald-700 text-xs font-bold leading-relaxed">Assim que você confirmar, o plano aparecerá instantaneamente no aplicativo do paciente selecionado.</p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm hover:bg-emerald-700 active:scale-95"
              >
                {loading && <Loader2 className="animate-spin" />}
                Confirmar e Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutriMealPlans;
