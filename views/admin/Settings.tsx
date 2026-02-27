
import React, { useState, useEffect } from 'react';
import { Shield, Globe, Save, RefreshCw, Loader2, Database, Key, Settings as SettingsIcon, Bell, Monitor, Zap, CheckCircle } from 'lucide-react';
import { adminService, GeneralSettings, IAQuotas } from '../../src/services/adminService';

const AdminSettings: React.FC = () => {
   const [general, setGeneral] = useState<GeneralSettings>({
      platform_name: 'NutriSaaS - Gestão Inteligente',
      support_email: 'suporte@nutrisaas.com',
      allow_new_registrations: true
   });

   const [quotas, setQuotas] = useState<IAQuotas>({
      nutri_daily_limit: 10,
      patient_monthly_limit: 20
   });

   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [success, setSuccess] = useState(false);
   const [errorMsg, setErrorMsg] = useState<string | null>(null);

   useEffect(() => {
      const loadSettings = async () => {
         try {
            const [gen, q] = await Promise.all([
               adminService.getSettings<GeneralSettings>('general_settings'),
               adminService.getSettings<IAQuotas>('ia_quotas')
            ]);
            if (gen) setGeneral(gen);
            if (q) setQuotas(q);
         } catch (error) {
            console.error('Error loading settings:', error);
         } finally {
            setLoading(false);
         }
      };
      loadSettings();
   }, []);

   const handleSave = async () => {
      setSaving(true);
      setErrorMsg(null);
      setSuccess(false);
      try {
         await Promise.all([
            adminService.updateSettings('general_settings', general),
            adminService.updateSettings('ia_quotas', quotas)
         ]);
         setSuccess(true);
         setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
         setErrorMsg('Falha ao salvar parâmetros globais.');
      } finally {
         setSaving(false);
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center p-32 animate-pulse">
            <Loader2 className="animate-spin text-slate-900" size={48} />
         </div>
      );
   }

   return (
      <div className="space-y-12 max-w-5xl mx-auto pb-20 animate-in fade-in duration-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">Parametrização do SaaS</h1>
               <p className="text-slate-500 font-medium text-lg mt-1">Configurações globais de negócio e limites de infraestrutura.</p>
            </div>
            {success && (
               <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm animate-in slide-in-from-right-4">
                  <CheckCircle size={18} /> Cache Atualizado
               </div>
            )}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-8">
               <div className="bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/[0.02] rounded-full -mr-16 -mt-16"></div>
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                     <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl shadow-inner"><SettingsIcon size={24} /></div>
                     <h3 className="font-black text-xl text-slate-900 tracking-tight">Navegação</h3>
                  </div>
                  <nav className="space-y-2">
                     {[
                        { icon: <Globe size={18} />, label: 'Geral', active: true }
                     ].map((item, i) => (
                        <button key={i} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${item.active ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
                           {item.icon}
                           {item.label}
                        </button>
                     ))}
                  </nav>
               </div>

               <div className="bg-emerald-900 p-8 rounded-[40px] text-white flex flex-col items-center text-center space-y-4 shadow-2xl shadow-emerald-900/40">
                  <div className="p-4 bg-white/10 rounded-3xl"><Database size={32} className="text-emerald-400" /></div>
                  <p className="text-xs font-bold leading-relaxed opacity-80">
                     Alterações nesta tela impactam diretamente o comportamento do banco de dados e as políticas de RLS em tempo real.
                  </p>
               </div>
            </div>

            <div className="lg:col-span-2 space-y-10">
               <section className="bg-white p-12 rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/60 space-y-10">
                  <div className="space-y-8">
                     <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Configurações Gerais</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nome Fantasia da Plataforma</label>
                           <input
                              value={general.platform_name}
                              onChange={(e) => setGeneral({ ...general, platform_name: e.target.value })}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 shadow-inner"
                           />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de Suporte ao Cliente</label>
                           <input
                              value={general.support_email}
                              type="email"
                              onChange={(e) => setGeneral({ ...general, support_email: e.target.value })}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 shadow-inner"
                           />
                        </div>
                     </div>

                     <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100 group cursor-pointer" onClick={() => setGeneral({ ...general, allow_new_registrations: !general.allow_new_registrations })}>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${general.allow_new_registrations ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                           <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${general.allow_new_registrations ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <label className="text-sm font-black text-slate-600 cursor-pointer select-none">Habilitar novos cadastros de nutricionistas (Self-Service)</label>
                     </div>
                  </div>

                  <div className="pt-10 border-t border-slate-50 space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cotas e Limites IA</h3>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Shield size={20} /></div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Limite Diário Nutri (Padrão)</label>
                           <input
                              type="number"
                              value={quotas.nutri_daily_limit}
                              onChange={(e) => setQuotas({ ...quotas, nutri_daily_limit: parseInt(e.target.value) })}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-emerald-600 outline-none shadow-inner"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Limite Mensal Paciente (Padrão)</label>
                           <input
                              type="number"
                              value={quotas.patient_monthly_limit}
                              onChange={(e) => setQuotas({ ...quotas, patient_monthly_limit: parseInt(e.target.value) })}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-600 outline-none shadow-inner"
                           />
                        </div>
                     </div>

                     <div className="bg-amber-50/50 p-6 rounded-3xl border border-dashed border-amber-200">
                        <p className="text-[10px] text-amber-700 font-black leading-relaxed tracking-tight uppercase">
                           Atenção: Estes limites visam proteger seu custo com a API Gemini Free Tier. Recomendamos manter o somatório diário abaixo de 1.500 requisições globais.
                        </p>
                     </div>
                  </div>

                  <div className="pt-10">
                     <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-slate-900 text-white font-black py-6 rounded-[30px] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-70 text-sm uppercase tracking-[0.2em]"
                     >
                        {saving ? (
                           <RefreshCw className="animate-spin" size={24} />
                        ) : (
                           <>
                              <Save size={20} className="text-emerald-400" />
                              Salvar Alterações Críticas
                           </>
                        )}
                     </button>
                  </div>
               </section>
            </div>
         </div>
      </div>
   );
};

export default AdminSettings;
