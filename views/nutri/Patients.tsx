
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, MoreVertical, Utensils, History, Edit2, Trash2, X, Calendar, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../src/services/patientService';
import { Patient } from '../../src/types';

const NutriPatients: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await patientService.getPatients({ search });
      setPatients(response.data);
    } catch (err: any) {
      setError('Erro ao carregar pacientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este paciente? Toda a história será excluída.')) {
      try {
        await patientService.deletePatient(id);
        setPatients(patients.filter(p => p.id !== id));
      } catch (err: any) {
        alert('Erro ao excluir paciente.');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.target as HTMLFormElement;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      objective: (form.elements.namedItem('objective') as HTMLSelectElement).value,
      weight: Number((form.elements.namedItem('weight') as HTMLInputElement).value),
      height: Number((form.elements.namedItem('height') as HTMLInputElement).value),
      birthDate: (form.elements.namedItem('birthDate') as HTMLInputElement).value || undefined,
      lastConsultation: new Date().toISOString().split('T')[0]
    };

    try {
      if (selectedPatient) {
        await patientService.updatePatient(selectedPatient.id, data);
      } else {
        await patientService.createPatient(data);
      }
      setShowModal(false);
      loadPatients();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar paciente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus Pacientes</h1>
          <p className="text-slate-500 font-medium">Gestão de acompanhamento nutricional</p>
        </div>
        <button
          onClick={() => { setSelectedPatient(null); setShowModal(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-100 transition-all active:scale-95"
        >
          <UserPlus size={22} />
          Novo Paciente
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6">
        <div className="relative max-w-md">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <RefreshCw className="animate-spin text-emerald-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.length > 0 ? patients.map((p) => (
            <div key={p.id} className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner uppercase">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight text-lg">{p.name}</h3>
                    <p className="text-xs text-slate-400 font-bold tracking-wider">{p.email}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setSelectedPatient(p); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Objetivo</span>
                  <span className="text-sm font-black text-slate-700">{p.objective || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-slate-50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Último Peso</span>
                  <span className="text-sm font-black text-slate-700 text-emerald-600">{p.weight} kg</span>
                </div>
                {p.birthDate && (
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nascimento</span>
                    <span className="text-sm font-black text-slate-700">{new Date(new Date(p.birthDate).getTime() + 86400000).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate(`/planos?patientId=${p.id}&mode=list`)}
                  className="flex items-center justify-center gap-2 p-3.5 bg-emerald-600 border border-emerald-600 rounded-2xl text-white hover:bg-emerald-700 transition-all font-bold text-xs shadow-md shadow-emerald-100"
                >
                  <Utensils size={18} />
                  Plano Alimentar
                </button>
                <button
                  onClick={() => navigate(`/prontuarios?patientId=${p.id}`)}
                  className="flex items-center justify-center gap-2 p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs shadow-sm"
                >
                  <History size={18} />
                  Registro Clínico
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <User className="mx-auto text-slate-100 mb-4" size={64} />
              <p className="text-slate-400 font-medium italic">Nenhum paciente cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
            <div className="p-8 pb-4 flex justify-between items-center bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <UserPlus size={28} />
                <h3 className="text-2xl font-black">{selectedPatient ? 'Editar Ficha' : 'Ficha de Paciente'}</h3>
              </div>
              <button
                disabled={submitting}
                onClick={() => setShowModal(false)}
                className="hover:rotate-90 transition-transform"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                  <input
                    name="name"
                    defaultValue={selectedPatient?.name}
                    type="text"
                    required
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">E-mail</label>
                  <input
                    name="email"
                    defaultValue={selectedPatient?.email}
                    type="email"
                    required
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Data de Nascimento</label>
                  <input
                    name="birthDate"
                    defaultValue={selectedPatient?.birthDate}
                    type="date"
                    required
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Objetivo</label>
                  <select
                    name="objective"
                    defaultValue={selectedPatient?.objective || 'Emagrecimento'}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 appearance-none"
                  >
                    <option>Emagrecimento</option>
                    <option>Hipertrofia</option>
                    <option>Performance</option>
                    <option>Saúde Geral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Peso (kg)</label>
                  <input
                    name="weight"
                    defaultValue={selectedPatient?.weight}
                    type="number"
                    step="0.1"
                    required
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Altura (cm)</label>
                  <input
                    name="height"
                    defaultValue={selectedPatient?.height}
                    type="number"
                    required
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 px-6 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
                >
                  {submitting ? <RefreshCw className="animate-spin" size={24} /> : 'Salvar Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutriPatients;
