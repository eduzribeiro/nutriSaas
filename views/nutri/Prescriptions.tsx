import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, X, Save, Loader2, User, Printer, ArrowLeft, UserCircle, Activity } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { patientService } from '../../src/services';
import { Patient } from '../../src/types';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context';

const NutriPrescriptions: React.FC = () => {
    const { user } = useAuth();
    const [mode, setMode] = useState<'list' | 'editor'>('list');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [searchParams] = useSearchParams();
    const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');

    const [newEntry, setNewEntry] = useState({
        title: 'Receituário Nutricional',
        content: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            fetchPrescriptions(selectedPatientId);
        } else {
            setPrescriptions([]);
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

    const fetchPrescriptions = async (patientId: string) => {
        try {
            setLoading(true);
            const hostoryRes = await patientService.getPrescriptions(patientId);
            setPrescriptions(hostoryRes);
        } catch (error) {
            console.error('Erro ao buscar receituários:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedPatientId || !newEntry.content) {
            alert('Selecione um paciente e preencha o conteúdo do receituário.');
            return;
        }

        setSaving(true);
        try {
            await patientService.addPrescription(selectedPatientId, newEntry.title, newEntry.content);
            alert('Receituário salvo com sucesso!');
            await fetchPrescriptions(selectedPatientId);
            setMode('list');
            setNewEntry({ title: 'Receituário Nutricional', content: '' });
        } catch (error: any) {
            alert(error.message || 'Erro ao salvar receituário');
        } finally {
            setSaving(false);
        }
    };

    if (mode === 'editor') {
        return (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 max-w-4xl mx-auto">
                <div className="flex justify-between items-center print:hidden">
                    <button onClick={() => setMode('list')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-black uppercase tracking-widest text-xs transition-all"><ArrowLeft size={20} /> Voltar</button>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl hover:bg-emerald-700 transition-all text-sm uppercase tracking-widest"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} className="text-white" />}
                            Salvar Receituário
                        </button>
                    </div>
                </div>

                <div className="bg-white p-12 rounded-[50px] shadow-2xl shadow-slate-200/60 border border-slate-50 space-y-10 print:shadow-none print:border-none print:p-0">
                    <div className="flex items-center gap-4 print:hidden">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><FileText size={24} /></div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Novo Receituário</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Paciente</label>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <User size={20} className="text-slate-400" />
                                <span className="font-bold text-slate-900">
                                    {patients.find(p => p.id === selectedPatientId)?.name || 'Selecione abaixo'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 print:hidden">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Título / Motivo</label>
                        <input
                            type="text"
                            value={newEntry.title}
                            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] font-black text-lg outline-emerald-500"
                            placeholder="Ex: Suplementação de Whey e Creatina"
                        />
                    </div>

                    <div className="space-y-3 print:block print:space-y-8">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 print:hidden">Receituário</label>
                        <div className="hidden print:block text-center border-b pb-8 mb-8 mt-10">
                            <h1 className="text-3xl font-black text-slate-900">PRESCRIÇÃO NUTRICIONAL</h1>
                            <p className="text-lg font-medium text-slate-600 mt-2">Paciente: {patients.find(p => p.id === selectedPatientId)?.name}</p>
                            <p className="text-md text-slate-500">{new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <textarea
                            value={newEntry.content}
                            onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                            className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] font-medium text-lg outline-emerald-500 min-h-[450px] shadow-inner print:bg-white print:border-none print:shadow-none print:p-0 print:min-h-0"
                            placeholder="Escreva o receituário ou recomendação com dosagens e posologia..."
                        />
                        <div className="p-10 border-t border-slate-50 bg-slate-50/50 print:bg-white flex flex-col items-start gap-8 mt-20 break-inside-avoid">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[22px] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
                                    {user?.profile?.avatar ? <img src={user.profile.avatar} className="w-full h-full object-cover" /> : <UserCircle size={44} className="text-slate-300" />}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-xl leading-tight">{user?.profile?.name || user?.email}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-black mt-1">CRN: {user?.profile?.crn || 'NÃO INFORMADO'}</p>
                                </div>
                            </div>
                            <div className="text-left w-full border-t border-slate-100 pt-6">
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">
                                    <Activity size={12} /> NutriSaaS Intelligence
                                </div>
                                <p className="text-[10px] text-slate-300 font-bold uppercase leading-tight max-w-[400px]">
                                    Documento autenticado e gerado via plataforma inteligente. Uso intransferível.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Receituários</h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Prescrições, manipulações e suplementos.</p>
                </div>
                <button
                    onClick={() => {
                        if (!selectedPatientId) {
                            alert('Por favor, selecione um paciente primeiro para inserir um novo receituário.');
                            return;
                        }
                        setMode('editor');
                    }}
                    className="flex items-center gap-3 px-8 py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                >
                    <Plus size={20} /> Novo Receituário
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
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total de Receituários</p>
                                    <p className="text-2xl font-black text-slate-900">{prescriptions.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 opacity-20"><Loader2 className="animate-spin" size={48} /></div>
                        ) : prescriptions.length > 0 ? (
                            prescriptions.map((h) => (
                                <div key={h.id} className="group bg-white p-8 md:p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 hover:shadow-slate-300/40 transition-all relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-[20px] mb-4 flex items-center justify-center text-emerald-500 shadow-inner shrink-0">
                                            <FileText size={32} />
                                        </div>
                                        <div className="space-y-4 flex-1">
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{h.title}</h3>
                                            <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                                                {new Date(h.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                            <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-3xl mt-4">
                                                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {h.content}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 mt-4">
                                                <button
                                                    onClick={async () => {
                                                        const newStatus = !(h as any).is_released;
                                                        try {
                                                            await (supabase
                                                                .from('prescriptions') as any)
                                                                .update({ is_released: newStatus })
                                                                .eq('id', h.id);
                                                            setPrescriptions(prescriptions.map((p: any) => p.id === h.id ? { ...p, is_released: newStatus } : p));
                                                        } catch (e) {
                                                            alert("Erro ao alterar o status.");
                                                        }
                                                    }}
                                                    className={`px-5 py-3 rounded-[16px] font-black text-[10px] uppercase tracking-widest transition-all ${(h as any).is_released ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                                                >
                                                    {(h as any).is_released ? 'Liberado ao Paciente' : 'Oculto'}
                                                </button>
                                                <button onClick={() => {
                                                    setNewEntry({ title: h.title, content: h.content });
                                                    setMode('editor');
                                                }} className="text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 px-5 py-3 bg-emerald-50 rounded-[16px] hover:bg-emerald-100 transition-colors">
                                                    <FileText size={16} /> Visualizar Cópia
                                                </button>
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
                                    <p className="text-xl font-black text-slate-900 tracking-tight">Nenhum receituário encontrado</p>
                                    <p className="text-slate-400 font-bold mt-1">Crie prescrições através do botão Novo Receituário.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NutriPrescriptions;
