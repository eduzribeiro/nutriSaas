import React, { useState, useEffect } from 'react';
import { Printer, User, FileText, Apple, Activity, Search, Loader2, UserCircle, Download } from 'lucide-react';
import { useAuth } from '../../src/context';
import { patientService, mealPlanService } from '../../src/services';
import { Patient, MealPlan } from '../../src/types';

interface DocumentItem {
    id: string;
    type: 'prescription' | 'meal_plan' | 'anamnesis';
    title: string;
    date: Date;
    content: string;
    description?: string;
}

const PrintCenter: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [documents, setDocuments] = useState<DocumentItem[]>([]);

    // Filtro de data
    const [filterDate, setFilterDate] = useState<string>('');

    // Estado para impressão em tela cheia
    const [printDoc, setPrintDoc] = useState<DocumentItem | null>(null);

    useEffect(() => {
        const fetchPatients = async () => {
            const response = await patientService.getPatients({ pageSize: 100 });
            setPatients(response.data);
        };
        fetchPatients();
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            loadDocuments();
        } else {
            setDocuments([]);
        }
    }, [selectedPatientId]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const [prescriptions, mealPlans] = await Promise.all([
                patientService.getPrescriptions(selectedPatientId),
                mealPlanService.getPatientMealPlans(selectedPatientId)
            ]);

            const docs: DocumentItem[] = [];

            // Add Prescriptions
            prescriptions.forEach(p => {
                docs.push({
                    id: p.id,
                    type: 'prescription',
                    title: p.title || 'Receituário',
                    date: new Date(p.created_at),
                    content: p.content,
                    description: 'Prescrição / Suplementação'
                });
            });

            // Add Meal Plans
            mealPlans.forEach(m => {
                docs.push({
                    id: m.id,
                    type: 'meal_plan',
                    title: m.title || 'Plano Alimentar',
                    date: new Date(m.createdAt),
                    content: m.content || '',
                    description: `Recomendação Padrão`
                });
            });

            // Ordena por data (mais recente primeiro)
            docs.sort((a, b) => b.date.getTime() - a.date.getTime());

            setDocuments(docs);
        } catch (error) {
            console.error('Erro ao carregar documentos', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (doc: DocumentItem) => {
        setPrintDoc(doc);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Reseta o doc de impressão após imprimir se o browser voltar
    useEffect(() => {
        const afterPrint = () => setPrintDoc(null);
        window.addEventListener('afterprint', afterPrint);
        return () => window.removeEventListener('afterprint', afterPrint);
    }, []);

    const filteredDocuments = documents.filter(doc => {
        if (!filterDate) return true;
        const d = doc.date.toISOString().slice(0, 10);
        return d === filterDate;
    });

    if (printDoc) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                {/* Estilos nativos de impressão para formatação e paginação perfeitas */}
                <style>{`
                  @media print {
                    @page {
                      size: A4 portrait;
                      margin-top: 15mm;
                      margin-bottom: 10mm;
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
                <div id="print-center-doc" className="bg-white w-full max-w-4xl mx-auto flex flex-col min-h-screen select-none md:select-auto">
                    <table className="w-full print-content-table block print:table">
                        <tbody className="block print:table-row-group">
                            <tr className="block print:table-row">
                                <td className="block print:table-cell">
                                    <div className="p-12 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                                                {printDoc.type === 'prescription' ? 'PRESCRIÇÃO' : 'PLANO ALIMENTAR ESTRUTURADO'}
                                            </h1>
                                            <p className="text-xl font-bold text-emerald-600 mt-2">
                                                Paciente: {patients.find(p => p.id === selectedPatientId)?.name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner inline-flex mb-2">
                                                {printDoc.type === 'prescription' ? <FileText size={32} /> : <Apple size={32} />}
                                            </div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                                {printDoc.date.toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-12 flex-1 print:p-8">
                                        <h2 className="text-2xl font-black text-slate-800 mb-8 border-l-4 border-emerald-500 pl-4">{printDoc.title}</h2>
                                        <div className="prose prose-slate max-w-none">
                                            <div className="whitespace-pre-wrap text-slate-800 font-semibold text-lg leading-relaxed">
                                                {printDoc.content}
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

                    <div className="p-10 border-t border-slate-50 bg-white flex flex-col md:flex-row items-center justify-between gap-8 mt-20 break-inside-avoid shadow-inner print:fixed print:bottom-0 print:left-0 print:w-full print:border-t-2 print:border-gray-200 print:h-[30mm] print:z-50 print:mt-0 print:flex-row print:pb-0">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[22px] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
                                {user?.profile?.avatar ? <img src={user.profile.avatar} className="w-full h-full object-cover" /> : <UserCircle size={44} className="text-slate-300" />}
                            </div>
                            <div>
                                <p className="font-black text-slate-900 text-xl leading-tight">{user?.profile?.name || user?.email}</p>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-black mt-1">CRN: {user?.profile?.crn || 'NÃO INFORMADO'}</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <div className="flex items-center md:justify-end gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">
                                <Activity size={12} className="text-emerald-600" /> NutriSaaS Intelligence
                            </div>
                            <p className="text-[10px] text-slate-300 font-bold uppercase leading-tight max-w-[300px]">
                                Documento gerado para uso exclusivo do paciente. Recomendações personalizadas e intransferíveis.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto print:hidden">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Central de Impressão</h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Gere cópias físicas e PDFs de todos os documentos do paciente.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 space-y-8">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Selecione o Paciente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 shadow-inner appearance-none cursor-pointer text-slate-800"
                                >
                                    <option value="">Buscar paciente...</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {selectedPatientId && (
                            <div className="pt-6 border-t border-slate-50 space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Filtrar por Data</label>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={e => setFilterDate(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-emerald-500"
                                />
                                {filterDate && (
                                    <button onClick={() => setFilterDate('')} className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest w-full text-right mt-2">Limpar Filtro</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    {!selectedPatientId ? (
                        <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[50px] border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-white rounded-[28px] shadow-xl flex items-center justify-center text-slate-300 mx-auto">
                                <Search size={40} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">Nenhum histórico selecionado</p>
                                <p className="text-slate-500 font-bold mt-2">Escolha um paciente ao lado para visualizar os documentos.</p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[50px] border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-white rounded-[28px] shadow-xl flex items-center justify-center text-slate-300 mx-auto">
                                <FileText size={40} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-900 tracking-tight">Nenhum documento encontrado</p>
                                <p className="text-slate-500 font-medium mt-1">Este paciente não possui registros na data selecionada.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredDocuments.map(doc => (
                                <div key={`${doc.type}-${doc.id}`} className="bg-white p-8 rounded-[32px] border border-slate-50 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-2xl transition-all group">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${doc.type === 'prescription' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {doc.type === 'prescription' ? <FileText size={28} /> : <Apple size={28} />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1">{doc.title}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm font-bold text-slate-500">
                                                <span className="uppercase tracking-widest text-[10px] text-slate-400">{doc.date.toLocaleDateString('pt-BR')}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>{doc.description}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePrint(doc)}
                                        className="w-full md:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-lg shadow-slate-300 flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-xs active:scale-95 group-hover:-translate-y-1"
                                    >
                                        <Printer size={18} className="text-emerald-400" />
                                        Imprimir Cópia
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrintCenter;
