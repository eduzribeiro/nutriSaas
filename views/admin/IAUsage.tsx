
import React, { useState, useEffect } from 'react';
import { Search, Info, Brain, Activity, TrendingUp, User, LayoutDashboard, Zap, AlertTriangle, Loader2, Filter, ArrowUpRight } from 'lucide-react';
import { adminService, IAUsageRecord } from '../../src/services/adminService';

const AdminIAUsage: React.FC = () => {
  const [usageData, setUsageData] = useState<IAUsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const data = await adminService.getIAUsage();
        setUsageData(data);
      } catch (error) {
        console.error('Error loading IA usage:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUsage();
  }, []);

  const filteredUsage = usageData.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalDaily = usageData.reduce((acc, curr) => acc + curr.daily, 0);
  const totalMonthly = usageData.reduce((acc, curr) => acc + curr.monthly, 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Telemetria de IA</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Auditagem de consumo e custos operacionais por tenant.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-xl shadow-slate-200/40 flex flex-col items-center min-w-[140px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Hoje</span>
            <span className="text-2xl font-black text-slate-900">{totalDaily}</span>
          </div>
          <div className="bg-slate-900 p-6 rounded-[32px] shadow-2xl shadow-slate-900/40 flex flex-col items-center min-w-[140px] text-white">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Total Mês</span>
            <span className="text-2xl font-black text-emerald-400">{totalMonthly}</span>
          </div>
        </div>
      </div>

      <div className="bg-emerald-900 p-10 rounded-[40px] shadow-2xl shadow-emerald-900/40 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="p-5 bg-white/10 text-emerald-400 rounded-3xl backdrop-blur-md shrink-0 border border-white/10 shadow-inner">
          <Zap size={40} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-black text-white tracking-tight mb-2">Monitor de Carga Gemini Gratis</h3>
          <p className="text-emerald-300 font-medium opacity-80 max-w-2xl leading-relaxed">
            Acompanhamento em tempo real para evitar estouro da cota de 1.500 requisições diárias do plano gratuito.
            Mantenha o consumo pulverizado entre os nutricionistas para garantir a gratuidade do SaaS.
          </p>
        </div>
        <div className="bg-white/10 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Capacidade Utilizada</p>
          <p className="text-3xl font-black text-white">{((totalDaily / 1500) * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/60 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center gap-6 bg-slate-50/20">
          <div className="relative flex-1 group">
            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por nutricionista ou paciente..."
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[28px] outline-none shadow-sm focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-bold text-slate-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-5 bg-white border border-slate-100 rounded-[24px] text-slate-400 hover:text-slate-900 transition-all shadow-sm">
            <Filter size={24} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-32 text-center space-y-4">
              <Loader2 className="animate-spin text-slate-900 mx-auto" size={48} />
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Calculando métricas globais...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário / Tenant</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hoja (Reqs)</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mês (Reqs)</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Eficiência de Cota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsage.length > 0 ? filteredUsage.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-black text-lg group-hover:bg-white group-hover:text-emerald-600 transition-all shadow-inner">
                          {u.name.charAt(0)}
                        </div>
                        <div className="font-black text-slate-800">{u.name}</div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${u.type === 'Nutri' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                        }`}>
                        {u.type === 'Nutri' ? 'Nutricionista' : 'Paciente'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center font-black text-slate-600">
                      {u.daily}
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className={`font-black ${u.monthly > 50 ? 'text-amber-500' : 'text-slate-900'} text-lg`}>
                        {u.monthly}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="w-full max-w-[150px] bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${u.monthly > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((u.monthly / 100) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          {Math.min((u.monthly / 100) * 100, 100).toFixed(0)}% da cota base
                        </span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <LayoutDashboard size={40} />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">Vazio por enquanto</h4>
                      <p className="text-slate-400 font-bold mt-1">Nenhum evento de IA disparado nas últimas 24 horas.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex gap-6 items-center">
          <div className="p-4 bg-amber-50 text-amber-500 rounded-3xl"><AlertTriangle size={32} /></div>
          <div>
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Alertas de Excesso</h4>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">Notificar automaticamente quando um tenant atingir 90% da cota.</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex gap-6 items-center md:col-span-2">
          <div className="p-4 bg-blue-50 text-blue-500 rounded-3xl"><TrendingUp size={32} /></div>
          <div className="flex-1">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Previsão de Custo Virtual</h4>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">A economia atual com o uso do plano gratuito da Gemini é de aproximadamente <strong>US$ 124.00/mês</strong> baseada no volume atual.</p>
          </div>
          <ArrowUpRight size={24} className="text-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default AdminIAUsage;
