
import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Loader2, RefreshCw, Save, Download, ChefHat, Check, AlertCircle, MessageSquare } from 'lucide-react';
import { aiService, aiUsageService, patientService } from '../../src/services';
import { saveAs } from 'file-saver';
import { useAuth } from '../../src/context';
import { Recipe, AIUsageSummary, Patient } from '../../src/types';

const PatientRecipes: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [quota, setQuota] = useState<AIUsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [observations, setObservations] = useState('');

  const loadData = async () => {
    if (!user) return;
    try {
      const patientData = await patientService.getPatientByUserId(user.id);
      setPatient(patientData);

      if (patientData && patientData.tenantId) {
        const summary = await aiUsageService.getPatientUsageSummary(user.id, patientData.tenantId);
        setQuota(summary);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const generateRecipe = async () => {
    if (!user || !patient) {
      setError('Registro clínico não encontrado. Contate seu nutricionista.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newRecipe = await aiService.generateRecipe(patient.id, observations.trim());
      setRecipe(newRecipe);
      await loadData(); // Refresh quota after generation
    } catch (err: any) {
      setError(err.message || 'Falha ao gerar receita.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTxt = () => {
    if (!recipe) return;
    const content = `Receita: ${recipe.title}

INFORMAÇÕES NUTRICIONAIS:
Energia: ${recipe.calories} kcal
Proteínas: ${recipe.protein}g
Carboidratos: ${recipe.carbs}g
Gorduras: ${recipe.fats}g

INGREDIENTES:
${recipe.ingredients.map(i => '- ' + i).join('\n')}

MODO DE PREPARO:
${recipe.instructions}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `Receita-${recipe.title.replace(/\s+/g, '-')}.txt`);
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-16 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[28px] shadow-inner mb-2 border border-emerald-100">
          <ChefHat size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Chef IA NutriSaaS</h1>
        <p className="text-slate-500 max-w-md mx-auto font-medium">Sem ideias para o jantar? Peça uma sugestão baseada no seu perfil nutricional.</p>

        {quota && (
          <div className={`inline-block border rounded-full px-6 py-2 text-xs font-black uppercase tracking-[0.1em] shadow-sm ${quota.dailyUsage >= quota.dailyQuota ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-slate-400 border-slate-100'
            }`}>
            {quota.dailyUsage} de {quota.dailyQuota} hoje | {quota.monthlyUsage} de {quota.monthlyQuota} no mês
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-3xl flex items-center gap-4 text-red-700 animate-in slide-in-from-top-4 shadow-sm">
          <AlertCircle size={28} />
          <p className="font-bold">{error}</p>
        </div>
      )}

      {!recipe ? (
        <div className="bg-white rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 p-10 md:p-16 text-center space-y-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.04] transition-colors"></div>
          <div className="flex justify-center gap-4 relative">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce cursor-pointer" onClick={() => setRecipe(null)}>
              <Sparkles size={32} />
            </div>
          </div>
          <p className="text-slate-600 max-w-sm mx-auto font-medium text-lg relative leading-relaxed">
            Nossa inteligência artificial analisa seu plano alimentar para sugerir a melhor refeição para o seu momento.
          </p>

          <div className="max-w-md mx-auto relative z-10 text-left">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4 flex items-center gap-2">
              <MessageSquare size={14} /> Observações Especiais
            </label>
            <textarea
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-6 focus:outline-none focus:border-emerald-500 transition-all resize-none shadow-inner text-sm font-medium text-slate-700 placeholder:text-slate-400"
              rows={3}
              placeholder="Ex: Quero um jantar low carb, sem lactose e que não tenha frango."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          <button
            onClick={generateRecipe}
            disabled={loading || (quota ? quota.dailyUsage >= quota.dailyQuota : false)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black py-5 px-10 rounded-[24px] transition-all shadow-2xl hover:shadow-slate-300 flex items-center gap-3 mx-auto disabled:opacity-30 active:scale-95 relative z-10 w-full md:w-auto justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Brain size={24} className="text-emerald-400" />}
            {loading ? 'Consultando Chef IA...' : 'Gerar Receita Inteligente'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-300/40 overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="p-8 md:p-12 space-y-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-100 text-emerald-700 font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-full border border-emerald-200">Sugestão de Hoje</span>
                  <span className="bg-blue-100 text-blue-700 font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-full border border-blue-200">IA Premium</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{recipe.title}</h2>
                <div className="flex gap-4 mt-4 text-xs font-bold text-slate-400">
                  <span>{recipe.calories} kcal</span>
                  <span>•</span>
                  <span>{recipe.protein}g Prot</span>
                  <span>•</span>
                  <span>{recipe.carbs}g Carb</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRecipe(null)} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100 shadow-sm" title="Tentar outra">
                  <RefreshCw size={24} />
                </button>
                <button onClick={downloadTxt} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100 shadow-sm" title="Baixar">
                  <Download size={24} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-50">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  Ingredientes
                </h3>
                <ul className="space-y-4">
                  {recipe.ingredients.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-700 font-medium">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                        <Check size={14} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                  Modo de Preparo
                </h3>
                <p className="text-slate-600 leading-relaxed text-lg font-medium">
                  {recipe.instructions}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/5 p-6 flex justify-center border-t border-slate-100">
            <button
              onClick={() => setRecipe(null)}
              className="text-slate-400 hover:text-slate-900 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              Voltar e tentar outra depois
            </button>
          </div>
        </div>
      )}

      {/* Dica do Dia */}
      {!recipe && (
        <div className="bg-blue-600 p-8 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-6 shadow-2xl shadow-blue-200">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
            <Brain size={32} />
          </div>
          <div>
            <h4 className="font-black text-xl mb-1">Dica da NutriSaaS IA</h4>
            <p className="opacity-80 font-medium text-blue-50">Sabia que variar os ingredientes ajuda a obter uma gama completa de minerais? Peça receitas diferentes todos os dias!</p>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

export default PatientRecipes;
