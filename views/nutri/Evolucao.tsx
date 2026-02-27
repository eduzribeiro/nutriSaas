
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Plus, Search, Calendar, Scale, Ruler, TrendingUp, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { patientService } from '../../src/services';
import { Patient, PatientMeasurement } from '../../src/types';

const NutriEvolucao: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [measurements, setMeasurements] = useState<PatientMeasurement[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [view, setView] = useState<'charts' | 'table'>('charts');
    const [showForm, setShowForm] = useState(false);
    const [chartMetric, setChartMetric] = useState<'weight' | 'bodyFat' | 'muscleMass' | 'waist' | 'hip'>('weight');

    const [formData, setFormData] = useState({
        weight: '',
        bodyFat: '',
        muscleMass: '',
        waist: '',
        hip: '',
        notes: '',
        measuredAt: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            fetchMeasurements(selectedPatientId);
        } else {
            setMeasurements([]);
        }
    }, [selectedPatientId]);

    const fetchPatients = async () => {
        try {
            const response = await patientService.getPatients({ pageSize: 100 });
            setPatients(response.data);
            if (response.data.length > 0 && !selectedPatientId) {
                // Not selecting automatically to avoid noise
            }
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
        }
    };

    const fetchMeasurements = async (patientId: string) => {
        setLoading(true);
        try {
            const data = await patientService.getMeasurements(patientId);
            // Sort by date for charts
            const sortedData = [...data].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
            setMeasurements(sortedData);
        } catch (error) {
            console.error('Erro ao buscar medições:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMeasurement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) return;

        setSubmitting(true);
        try {
            await patientService.addMeasurement(selectedPatientId, {
                weight: Number(formData.weight),
                bodyFat: formData.bodyFat ? Number(formData.bodyFat) : undefined,
                muscleMass: formData.muscleMass ? Number(formData.muscleMass) : undefined,
                waist: formData.waist ? Number(formData.waist) : undefined,
                hip: formData.hip ? Number(formData.hip) : undefined,
                notes: formData.notes,
                measuredAt: formData.measuredAt
            });

            // Update patient's last weight/consultation if needed (service might handle it)

            await fetchMeasurements(selectedPatientId);
            setShowForm(false);
            setFormData({
                weight: '',
                bodyFat: '',
                muscleMass: '',
                waist: '',
                hip: '',
                notes: '',
                measuredAt: new Date().toISOString().split('T')[0]
            });
            alert('Medição registrada com sucesso!');
        } catch (error: any) {
            alert(error.message || 'Erro ao registrar medição');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate variations
    const lastMeasurement = measurements[measurements.length - 1];
    const previousMeasurement = measurements[measurements.length - 2];

    const getVariation = (current: number | undefined, previous: number | undefined) => {
        if (current === undefined || previous === undefined) return null;
        const diff = current - previous;
        const color = diff > 0 ? 'text-rose-500' : diff < 0 ? 'text-emerald-500' : 'text-slate-400';
        return { diff: diff.toFixed(1), color };
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Evolução & Medidas</h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Acompanhamento e progresso físico dos pacientes.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="p-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 outline-emerald-600 shadow-xl shadow-slate-100"
                    >
                        <option value="">Selecione um paciente...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button
                        onClick={() => {
                            if (!selectedPatientId) { alert('Selecione um paciente primeiro.'); return; }
                            setShowForm(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                    >
                        <Plus size={20} /> Nova Medida
                    </button>
                </div>
            </div>

            {!selectedPatientId ? (
                <div className="py-32 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-100 flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200">
                        <Activity size={48} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Aguardando Seleção</h2>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2">Selecione um paciente acima para visualizar os dados de evolução e progresso físico.</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={48} />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Carregando Medidas...</p>
                </div>
            ) : measurements.length === 0 ? (
                <div className="py-32 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-100 flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center text-emerald-200">
                        <TrendingUp size={48} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nenhum Registro</h2>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2">Inicie o acompanhamento deste paciente clicando no botão "Nova Medida".</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sumário de Destaque */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4 relative">Situação Atual</h3>

                            <div className="space-y-6 relative">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-white text-4xl font-black tracking-tighter">{lastMeasurement.weight} <span className="text-lg font-bold text-white/40">kg</span></p>
                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Peso Corporal</p>
                                    </div>
                                    {getVariation(lastMeasurement.weight, previousMeasurement?.weight) && (
                                        <span className={`text-xs font-black px-3 py-1 rounded-full bg-white/5 ${getVariation(lastMeasurement.weight, previousMeasurement?.weight)?.color}`}>
                                            {Number(getVariation(lastMeasurement.weight, previousMeasurement?.weight)?.diff) > 0 ? '+' : ''}
                                            {getVariation(lastMeasurement.weight, previousMeasurement?.weight)?.diff} kg
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                        <p className="text-white/40 text-[10px] font-black uppercase mb-1">Gordura %</p>
                                        <p className="text-white text-xl font-black">{lastMeasurement.bodyFat || '--'}%</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                        <p className="text-white/40 text-[10px] font-black uppercase mb-1">Massa Musc.</p>
                                        <p className="text-white text-xl font-black">{lastMeasurement.muscleMass || '--'}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/40 space-y-6">
                            <h3 className="text-slate-900 text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Activity size={18} className="text-emerald-500" /> Histórico Recente
                            </h3>
                            <div className="space-y-4">
                                {[...measurements].reverse().slice(0, 5).map((m, idx) => (
                                    <div key={m.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800">{new Date(m.measuredAt).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{m.weight}kg</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Gráficos / Tabela */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/50">
                            <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                                <div className="flex flex-col">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {view === 'charts' ? 'Análise de Progressão' : 'Histórico Consolidado'}
                                    </h3>
                                    {view === 'charts' && (
                                        <select
                                            value={chartMetric}
                                            onChange={(e) => setChartMetric(e.target.value as any)}
                                            className="mt-2 text-xs font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border-none outline-none cursor-pointer"
                                        >
                                            <option value="weight">Peso Corporal (kg)</option>
                                            <option value="bodyFat">Gordura Corporal (%)</option>
                                            <option value="muscleMass">Massa Muscular (%)</option>
                                            <option value="waist">Cintura (cm)</option>
                                            <option value="hip">Quadril (cm)</option>
                                        </select>
                                    )}
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                                    <button onClick={() => setView('charts')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view === 'charts' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>Gráfico</button>
                                    <button onClick={() => setView('table')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view === 'table' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>Tabela</button>
                                </div>
                            </div>

                            {view === 'charts' ? (
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={measurements}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="measuredAt"
                                                tickFormatter={(str) => new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                hide
                                                domain={['dataMin - 2', 'dataMax + 2']}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px' }}
                                                itemStyle={{ fontWeight: 900, color: '#059669' }}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '10px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={chartMetric}
                                                name={chartMetric === 'weight' ? 'Peso (kg)' :
                                                    chartMetric === 'bodyFat' ? 'Gordura (%)' :
                                                        chartMetric === 'muscleMass' ? 'Massa Muscular (%)' :
                                                            chartMetric === 'waist' ? 'Cintura (cm)' : 'Quadril (cm)'}
                                                stroke="#059669"
                                                strokeWidth={6}
                                                dot={{ r: 6, fill: '#fff', strokeWidth: 4, stroke: '#059669' }}
                                                activeDot={{ r: 10, fill: '#059669', strokeWidth: 4, stroke: '#fff' }}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-separate border-spacing-y-4">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <th className="px-6 py-4">Data</th>
                                                <th className="px-6 py-4">Peso</th>
                                                <th className="px-6 py-4">Gordura %</th>
                                                <th className="px-6 py-4">Músculo %</th>
                                                <th className="px-6 py-4">Cintura</th>
                                                <th className="px-6 py-4">Quadril</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...measurements].reverse().map((m) => (
                                                <tr key={m.id} className="bg-slate-50/50 rounded-2xl overflow-hidden hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-5 font-bold text-slate-600 rounded-l-2xl">{new Date(m.measuredAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-5 font-black text-slate-900">{m.weight}kg</td>
                                                    <td className="px-6 py-5 font-bold text-slate-600">{m.bodyFat || '-'}%</td>
                                                    <td className="px-6 py-5 font-bold text-slate-600">{m.muscleMass || '-'}%</td>
                                                    <td className="px-6 py-5 font-bold text-slate-600">{m.waist || '-'}cm</td>
                                                    <td className="px-6 py-5 font-bold text-slate-600 rounded-r-2xl">{m.hip || '-'}cm</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Mais Gráficos (Body Fat % Massa Muscular) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/40">
                                <h4 className="text-slate-900 text-sm font-black tracking-tight mb-6">Gordura Corporal %</h4>
                                <div className="h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={measurements}>
                                            <Line type="monotone" dataKey="bodyFat" stroke="#f43f5e" strokeWidth={4} dot={false} />
                                            <XAxis hide dataKey="measuredAt" />
                                            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                            <Tooltip />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/40">
                                <h4 className="text-slate-900 text-sm font-black tracking-tight mb-6">Massa Muscular %</h4>
                                <div className="h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={measurements}>
                                            <Line type="monotone" dataKey="muscleMass" stroke="#3b82f6" strokeWidth={4} dot={false} />
                                            <XAxis hide dataKey="measuredAt" />
                                            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                            <Tooltip />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Formulário */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Scale size={32} />
                                <h3 className="text-2xl font-black">Nova Medição</h3>
                            </div>
                            <button onClick={() => setShowForm(false)} className="hover:rotate-90 transition-transform">
                                <Activity size={32} />
                            </button>
                        </div>
                        <form onSubmit={handleAddMeasurement} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Data da Medição</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.measuredAt}
                                        onChange={(e) => setFormData({ ...formData, measuredAt: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-emerald-600 text-lg"
                                        placeholder="70.5"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Gordura %</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.bodyFat}
                                        onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                                        placeholder="15.0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Massa Musc. %</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.muscleMass}
                                        onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                                        placeholder="40.0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Cintura (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.waist}
                                        onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                                        placeholder="80.0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Quadril (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.hip}
                                        onChange={(e) => setFormData({ ...formData, hip: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                                        placeholder="95.0"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Observações</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium min-h-[100px]"
                                        placeholder="Notas sobre a medição..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-10">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 p-5 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-3 bg-slate-900 text-white font-black py-5 px-10 rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : <Activity size={20} className="text-emerald-400" />}
                                    Registrar Medição
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutriEvolucao;
