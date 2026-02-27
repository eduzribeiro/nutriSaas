
import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Brain, TrendingUp, Activity as ActivityIcon, ShieldCheck, Zap, ArrowUpRight, Loader2, Calendar } from 'lucide-react';
import DashboardCard from '../../components/DashboardCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { adminService, PlatformStats, Activity } from '../../src/services/adminService';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, a] = await Promise.all([
          adminService.getPlatformStats(),
          adminService.getRecentActivity()
        ]);
        setStats(s);
        setActivities(a);
      } catch (error) {
        console.error('Error loading admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center animate-pulse">
        <Loader2 className="animate-spin text-slate-900" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Painel de Controle Platform</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Visão holística da saúde do ecossistema NutriSaaS.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border border-slate-50 shadow-xl shadow-slate-200/50">
          <div className="p-3 bg-slate-900 text-emerald-400 rounded-2xl"><Zap size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status da API Gemini</p>
            <p className="font-black text-slate-900 mt-1 flex items-center gap-2">Online e Saudável <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><UserCheck size={28} /></div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Nutricionistas</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900">{stats?.totalNutritionists || 0}</span>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><Users size={28} /></div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Pacientes</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900">{stats?.totalPatients || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-14 h-14 bg-white/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><Brain size={28} /></div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Consumo de IA (Interno)</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{stats?.totalAIUsage || 0}</span>
            <span className="text-xs font-bold text-slate-500 mb-1">registros totais</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-4 leading-relaxed font-bold">
            * Este consumo reflete apenas o uso de chamadas de dentro desta plataforma.
          </p>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-14 h-14 bg-slate-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><ShieldCheck size={28} /></div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Segurança</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900">100%</span>
            <span className="text-xs font-bold text-emerald-600 mb-1">SLA Ativo</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-8 flex flex-col">
          <div className="bg-white p-10 rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl"><ActivityIcon size={24} /></div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center">Eventos Reais</h2>
            </div>

            <div className="space-y-6">
              {activities.length > 0 ? (
                activities.map((item, i) => (
                  <div key={i} className="flex gap-4 group cursor-default">
                    <div className="flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors" />
                      <div className="w-[1px] h-full bg-slate-100" />
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-bold text-slate-700 leading-tight mb-1 group-hover:text-slate-900 transition-colors">{item.text}</p>
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10} /> {item.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-30 italic font-medium text-slate-400">
                  Aguardando telemetria...
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-600 p-8 rounded-[40px] text-white flex items-center gap-6 shadow-2xl shadow-emerald-200">
            <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md shrink-0"><ShieldCheck size={32} /></div>
            <div>
              <h4 className="font-black text-xl mb-1">Auditoria Ativa</h4>
              <p className="opacity-80 font-medium text-sm">Todas as transações do banco de dados estão sendo monitoradas e logadas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
