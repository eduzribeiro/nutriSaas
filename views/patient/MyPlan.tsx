
import React, { useEffect, useState } from 'react';
import { Download, Apple, UserCircle, RefreshCw, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../src/context';
import { mealPlanService, authService, patientService } from '../../src/services';
import { MealPlan } from '../../src/types';
import { supabase } from '../../src/lib/supabase';

const PatientPlan: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [nutri, setNutri] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const patientData = await patientService.getPatientByUserId(user.id);
        if (!patientData) {
          setLoading(false);
          return;
        }

        const allPlans = await mealPlanService.getPatientMealPlans(patientData.id);
        const releasedPlans = allPlans.filter(p => (p as any).is_released);
        // Sort by date descending
        setPlans(releasedPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        let nutriId = null;

        // 1. Tenta pegar via profile
        const { data: uProfile } = await supabase
          .from('profiles')
          .select('linked_nutri_id')
          .eq('id', user.id)
          .single();

        if (uProfile && (uProfile as any).linked_nutri_id) {
          nutriId = (uProfile as any).linked_nutri_id;
        }

        // 2. Fallback pro tenant
        if (!nutriId && patientData.tenantId) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('nutritionist_id')
            .eq('id', patientData.tenantId)
            .single();

          nutriId = (tenantData as any)?.nutritionist_id;
        }

        if (nutriId) {
          const { data: nutriProfile } = await (supabase as any)
            .rpc('get_public_nutritionist', { nutri_id: nutriId })
            .single();
          setNutri(nutriProfile);
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCw className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  // Visualização de Plano Específico
  if (selectedPlan) {
    const handlePrint = () => {
      window.print();
    };

    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in slide-in-from-right-10 duration-500">
        {/* Estilos nativos de impressão para garantir formatação e paginação perfeitas */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin-top: 15mm;
              margin-bottom: 10mm; /* A margem pequena natural */
            }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              background-color: transparent !important;
            }
            table.print-content-table { width: 100%; }
            tfoot.print-spacer-tfoot { display: table-footer-group; }
          }
        `}</style>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-black uppercase tracking-widest text-xs transition-all">
            <ArrowLeft size={20} /> Voltar para lista
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-[20px] font-black shadow-2xl hover:bg-slate-800 active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            <Download size={20} />
            Gerar PDF
          </button>
        </div>
        <div id="print-plan-doc" className="bg-white rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[600px] flex flex-col relative print:border-none print:shadow-none print:bg-white printable-area select-none md:select-auto">

          <table className="w-full print-content-table block print:table">
            <tbody className="block print:table-row-group">
              <tr className="block print:table-row">
                <td className="block print:table-cell">
                  <div className="bg-emerald-600 p-12 text-white relative overflow-hidden print:p-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="flex items-center gap-4 mb-4 relative">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Apple size={32} />
                      </div>
                      <h2 className="text-4xl font-black tracking-tight">{selectedPlan.title || 'Plano Alimentar Estruturado'}</h2>
                    </div>
                    <p className="text-emerald-50 max-w-lg text-lg font-medium relative opacity-90">
                      Plano elaborado dia {new Date(selectedPlan.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="p-12 space-y-12 flex-1 print:p-8">
                    <div className="prose prose-slate max-w-none">
                      <div className="whitespace-pre-wrap text-slate-900 leading-relaxed font-bold text-lg">
                        {selectedPlan.content}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot className="hidden print:table-footer-group print-spacer-tfoot">
              <tr>
                <td>
                  <div className="h-[35mm]"></div>
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="p-12 border-t bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-8 print:fixed print:bottom-0 print:left-0 print:w-full print:bg-white print:p-6 print:pb-0 print:h-[30mm] print:border-t-2 print:border-gray-200 print:z-50 print:flex-row">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-white">
                  {nutri?.avatar ? (
                    <img src={nutri.avatar} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <UserCircle size={40} className="text-slate-300" />
                  )}
                </div>
              </div>
              <div>
                <p className="font-black text-slate-900 text-xl leading-tight">{nutri?.name || 'Seu Nutricionista'}</p>
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">
                  {nutri?.crn ? `CRN: ${nutri.crn}` : 'Profissional NutriSaaS'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end text-right">
              <div className="flex items-center gap-2 text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                <div className="h-[1px] w-8 bg-slate-200"></div>
                Ecossistema NutriSaaS
              </div>
              <p className="text-[10px] text-slate-300 font-bold uppercase text-center md:text-right leading-tight max-w-[200px]">
                Documento autenticado e gerado via plataforma inteligente.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Meus Planos</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Consulte todos os seus planos alimentares prescritos.</p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
            <Apple size={48} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900">Nenhum plano disponível</h2>
            <p className="text-slate-500 mt-2 font-medium">Seu nutricionista ainda não liberou o plano alimentar em seu perfil.</p>
          </div>
          <div className="pt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:shadow-emerald-200 transition-all flex items-center gap-3 mx-auto active:scale-95"
            >
              <RefreshCw size={20} /> Atualizar Página
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-white p-8 rounded-[32px] border border-slate-50 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all group flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center shrink-0">
                  <Apple size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{p.title || 'Plano Nutricional'}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm font-bold text-slate-500">
                    <Calendar size={16} className="text-slate-300" />
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlan(p)}
                className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white hover:bg-emerald-600 rounded-2xl font-black shadow-lg flex items-center justify-center transition-all uppercase tracking-widest text-xs active:scale-95"
              >
                Visualizar Plano
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default PatientPlan;
