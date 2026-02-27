
import React, { useState, useEffect } from 'react';
import { Users, Utensils, Brain, Activity, PlusCircle, RefreshCw } from 'lucide-react';
import DashboardCard from '../../components/DashboardCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../src/context';
import { nutritionistService } from '../../src/services/nutritionistService';
import { patientService } from '../../src/services/patientService';
import { aiUsageService } from '../../src/services/aiUsageService';
import { AIUsageSummary } from '../../src/types';

const NutriDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [usage, setUsage] = useState<AIUsageSummary | null>(null);
  const [patientsCount, setPatientsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.tenantId) return;
      try {
        const [u, p] = await Promise.all([
          aiUsageService.getUsageSummary(user.tenantId),
          patientService.getPatients({ pageSize: 1 })
        ]);
        setUsage(u);
        setPatientsCount(p.total);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 animate-pulse">
        <RefreshCw className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Olá, {user?.profile?.name || 'Nutricionista'}!
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Sua clínica está pronta para mais um dia de sucesso.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-slate-100 shadow-sm px-6 py-3 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cota IA Diária</span>
            <span className="text-lg font-black text-emerald-600">
              {usage?.dailyUsage || 0} / {usage?.dailyQuota || 30}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Pacientes Ativos"
          value={patientsCount.toString()}
          icon={<Users size={24} />}
          trend="Total de Fichas"
        />
        <DashboardCard
          title="Uso de IA (Mês)"
          value={usage?.monthlyUsage.toString() || "0"}
          icon={<Brain size={24} />}
          trend="Monitoramento Mensal"
        />
      </div>

      <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-slate-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>

        <h2 className="text-xl font-black text-white mb-8 relative">Atalhos Pro</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <button
            onClick={() => navigate('/pacientes')}
            className="flex items-center gap-4 p-6 bg-white/5 hover:bg-white/10 text-white rounded-[32px] transition-all border border-white/10 group/btn"
          >
            <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20 group-hover/btn:rotate-12 transition-transform">
              <PlusCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-base">Nova Ficha</p>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Cadastro de Paciente</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/planos')}
            className="flex items-center gap-4 p-6 bg-white/5 hover:bg-white/10 text-white rounded-[32px] transition-all border border-white/10 group/btn"
          >
            <div className="bg-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/20 group-hover/btn:rotate-12 transition-transform">
              <Brain size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-base">Gerar com IA</p>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Plano Inteligente</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/receituarios')}
            className="flex items-center gap-4 p-6 bg-white/5 hover:bg-white/10 text-white rounded-[32px] transition-all border border-white/10 group/btn"
          >
            <div className="bg-indigo-500 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover/btn:rotate-12 transition-transform">
              <Activity size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-base">Novo Receituário</p>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Prescrição Nutricional</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NutriDashboard;
