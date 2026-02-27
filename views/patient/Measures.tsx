import React, { useState, useEffect } from 'react';
import { Scale, Ruler, Zap, Activity, Calendar, Loader2, ArrowUpRight, TrendingDown, Target } from 'lucide-react';
import { useAuth } from '../../src/context';
import { patientService } from '../../src/services';
import { supabase } from '../../src/lib/supabase';
import { PatientMeasurement, Patient } from '../../src/types';

const PatientMeasures: React.FC = () => {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<PatientMeasurement[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const patientData = await patientService.getPatientByUserId(user.id);
        if (patientData) {
          setPatient(patientData);
        }

        // Busca todas as medições via RPC que bypassa RLS
        const { data: measData, error } = await (supabase as any).rpc('get_my_measurements');

        if (!error && measData && measData.length > 0) {
          const mapped: PatientMeasurement[] = measData.map((m: any) => ({
            id: m.id,
            patientId: m.patient_id,
            tenantId: m.tenant_id,
            weight: Number(m.weight),
            bodyFat: m.body_fat ? Number(m.body_fat) : undefined,
            muscleMass: m.muscle_mass ? Number(m.muscle_mass) : undefined,
            waist: m.waist ? Number(m.waist) : undefined,
            hip: m.hip ? Number(m.hip) : undefined,
            notes: m.notes || undefined,
            measuredAt: m.measured_at,
            createdAt: m.created_at,
          }));
          setMeasurements(mapped);
        } else if (patientData?.weight) {
          // Fallback: usa peso inicial do cadastro
          setMeasurements([{
            id: 'initial',
            patientId: patientData.id,
            tenantId: patientData.tenantId,
            weight: patientData.weight,
            measuredAt: patientData.createdAt || new Date().toISOString(),
            createdAt: patientData.createdAt || new Date().toISOString()
          }]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const latest = measurements[measurements.length - 1];
  const initial = measurements[0];
  const weightDiff = latest && initial ? latest.weight - initial.weight : 0;

  if (loading) {
    return <div className="flex items-center justify-center p-20 animate-pulse"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Minha Evolução</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Transformação física documentada pelo seu nutricionista.</p>
        </div>
        {latest && (
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-50 shadow-xl shadow-slate-200/50">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Activity size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Última atualização</p>
              <p className="font-black text-slate-900">{new Date(latest.measuredAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex flex-col justify-between relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`}></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Scale size={24} /></div>
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Peso Atual</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900 tracking-tight">{latest?.weight || '--'} <span className="text-lg text-slate-300">kg</span></p>
            <div className="flex items-center gap-2 mt-2">
              {weightDiff <= 0 ? <TrendingDown size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} className="text-amber-500" />}
              <span className={`text-xs font-black ${weightDiff <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {Math.abs(weightDiff).toFixed(1)}kg {weightDiff <= 0 ? 'eliminados' : 'ganhos'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex flex-col justify-between relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`}></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><Zap size={24} /></div>
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Gordura Corporal</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900 tracking-tight">{latest?.bodyFat || '--'} <span className="text-lg text-slate-300">%</span></p>
            <p className="text-xs font-bold text-slate-400 mt-2">Medição por bioimpedância</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex flex-col justify-between relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`}></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Target size={24} /></div>
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Objetivo</h3>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight uppercase">{patient?.objective || 'Não definido'}</p>
            <p className="text-xs font-bold text-slate-400 mt-2">Foco da Prescrição Atual</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/60 min-h-[500px] flex flex-col">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-slate-900 rounded-2xl shadow-inner text-white">
            <Ruler size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Histórico de Medições</h2>
            <p className="text-slate-400 font-bold text-sm">Acompanhe seus resultados e avaliações feitas pelo profissional.</p>
          </div>
        </div>

        {measurements.length > 0 ? (
          <div className="flex-1 overflow-x-auto rounded-[32px] border border-slate-100 bg-slate-50/30 w-full animate-in fade-in duration-700">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-slate-100/80 bg-slate-50/80">
                  <th className="py-5 px-6 font-black text-slate-400 uppercase tracking-widest text-xs first:rounded-tl-[32px] whitespace-nowrap">Data da Análise</th>
                  <th className="py-5 px-6 font-black text-slate-400 uppercase tracking-widest text-xs">Peso (kg)</th>
                  <th className="py-5 px-6 font-black text-slate-400 uppercase tracking-widest text-xs">Gordura (%)</th>
                  <th className="py-5 px-6 font-black text-slate-400 uppercase tracking-widest text-xs">Massa Magra (kg)</th>
                  <th className="py-5 px-6 font-black text-slate-400 uppercase tracking-widest text-xs">Cintura (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[...measurements].reverse().map((m, idx) => (
                  <tr key={m.id || idx} className="border-b border-slate-50 hover:bg-white transition-colors group">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Calendar size={14} />
                        </div>
                        <span className="font-bold text-slate-900">{new Date(m.measuredAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{m.weight}</td>
                    <td className="py-5 px-6 font-bold text-slate-500">{m.bodyFat || '--'}</td>
                    <td className="py-5 px-6 font-bold text-slate-500">{m.muscleMass || '--'}</td>
                    <td className="py-5 px-6 font-bold text-slate-500">{m.waist || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-40 py-20 px-10">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 ring-8 ring-slate-50/50">
              <Activity size={56} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sem medições registradas</h3>
              <p className="font-bold text-slate-500 max-w-sm mt-2">Aguarde o nutricionista preencher seus dados durante a avaliação.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMeasures;
