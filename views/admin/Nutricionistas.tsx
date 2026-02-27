
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Trash2, CheckCircle, XCircle, X, Mail, User, Power, PowerOff, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { adminService, NutriDetail } from '../../src/services/adminService';
import { nutritionistService } from '../../src/services/nutritionistService';
import { adminManagementService } from '../../src/services/adminManagementService';

const AdminNutricionistas: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [nutris, setNutris] = useState<NutriDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State for New Nutri
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const loadNutris = async () => {
    setLoading(true);
    try {
      const data = await adminService.getNutritionists();
      setNutris(data);
    } catch (error: any) {
      console.error('Error loading nutris:', error);
      setErrorMsg('Falha ao carregar lista de nutricionistas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNutris();
  }, []);

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    if (!tenantId) {
      alert('Erro: ID do nutricionista não encontrado.');
      return;
    }
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await nutritionistService.updateStatus(tenantId, newStatus);
      await loadNutris();
    } catch (error: any) {
      alert('Erro ao atualizar status: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (!tenantId) return;
    if (window.confirm('Excluir este nutricionista removerá todos os pacientes e dados vinculados. Esta ação é irreversível. Prosseguir?')) {
      try {
        await nutritionistService.deleteNutritionist(tenantId);
        await loadNutris();
      } catch (error: any) {
        alert('Erro ao excluir: ' + (error.message || 'Erro desconhecido'));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Iniciando cadastro de nutricionista:', formData.email);
      const result = await adminManagementService.createNutritionist(formData);
      console.log('Resultado do cadastro:', result);

      alert('Nutricionista cadastrado com sucesso! \n\nInstruções: \n1. Ele receberá um e-mail de confirmação (se habilitado).\n2. Você deve ativar o acesso dele na lista abaixo clicando no ícone de "Power".');

      setShowModal(false);
      setFormData({ name: '', email: '', password: '' });

      // Delay to allow trigger to complete before reload
      setTimeout(() => loadNutris(), 1000);
    } catch (error: any) {
      console.error('Erro detalhado no cadastro:', error);
      setErrorMsg(error.message || 'Erro ao cadastrar nutricionista no banco de dados.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNutris = nutris.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gerenciar Nutricionistas</h1>
          <p className="text-slate-500 font-medium">Controle de parceiros e acesso à plataforma</p>
        </div>
        <button
          onClick={() => { setErrorMsg(null); setShowModal(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          <UserPlus size={22} />
          Novo Profissional
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou CRN..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={40} />
              <p className="mt-4 text-slate-400 font-medium italic">Sincronizando com o banco de dados...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Profissional</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Código de Acesso</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Pacientes</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredNutris.length > 0 ? filteredNutris.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                          {n.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{n.name}</div>
                          <div className="text-sm text-slate-400 font-medium">{n.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <code className="bg-white border border-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm tracking-widest">
                        {n.nutriCode}
                      </code>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${n.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        {n.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {n.status === 'active' ? 'Liberado' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-slate-600">{n.patientsCount}</td>
                    <td className="px-8 py-5 text-right space-x-3">
                      <button
                        onClick={() => handleToggleStatus(n.tenantId || n.id, n.status)}
                        className={`p-2.5 rounded-xl transition-all shadow-sm ${n.status === 'active' ? 'text-red-500 bg-red-50 hover:bg-red-100 hover:shadow-red-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:shadow-emerald-100'}`}
                        title={n.status === 'active' ? 'Bloquear Acesso' : 'Liberar Acesso'}
                      >
                        {n.status === 'active' ? <PowerOff size={20} /> : <Power size={20} />}
                      </button>
                      <button
                        onClick={() => handleDelete(n.tenantId || n.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir Permanentemente"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full text-slate-200 mb-4 font-black">?</div>
                      <p className="text-slate-400 font-medium">Nenhum profissional encontrado.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 pb-4 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Novo Profissional</h3>
                  <p className="text-slate-400 text-sm font-medium">Cadastrar acesso manual para nutricionista</p>
                </div>
              </div>
              <button
                disabled={submitting}
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X size={28} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 pt-4 space-y-6">
              {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
                  <AlertCircle size={20} />
                  <p className="text-sm font-bold">{errorMsg}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="Ex: Dra. Juliana Souza"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">E-mail Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input
                        type="email"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="julia@nutrisaas.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Senha Provisória</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input
                        type="password"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        placeholder="••••••••"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 px-6 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors border border-transparent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {submitting ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      <UserPlus size={20} />
                      Cadastrar Agora
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

export default AdminNutricionistas;
