
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Apple, ArrowLeft, CheckCircle2, Lock, Mail, User } from 'lucide-react';
import { authService } from '../src/services/authService';

const ADMIN_EMAIL = 'eduzribeiro@gmail.com';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nutriCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      if (formData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        // Fluxo especial para criação do Admin Master
        await authService.registerUser(formData.email, formData.password, formData.name, 'admin');
      } else {
        // Fluxo padrão para pacientes
        if (!formData.nutriCode) {
          setError('O código do nutricionista é obrigatório para pacientes');
          setLoading(false);
          return;
        }
        await authService.register(formData.email, formData.password, formData.name, formData.nutriCode);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar sua conta');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-100 shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Conta Criada!</h2>
          <p className="text-slate-500 mb-8">
            {formData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
              ? 'Sua conta de Administrador Master foi configurada com sucesso.'
              : 'Seu cadastro foi realizado com sucesso. Agora você pode entrar na plataforma.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full">
        <Link to="/login" className="inline-flex items-center text-slate-500 hover:text-emerald-600 mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Voltar para login
        </Link>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Apple size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Criar conta</h2>
              <p className="text-sm text-slate-500">Paciente NutriSaaS</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 italic font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-300" size={18} />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="Seu nome"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-300" size={18} />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="seu@email.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-300" size={18} />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-300" size={18} />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* O campo de código só aparece/é obrigatório se não for o email do admin */}
            {formData.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && (
              <div className="pt-2">
                <label className="block text-sm font-bold text-emerald-700 mb-1">Código do Nutricionista</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-500/20 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500 outline-none font-mono uppercase font-bold text-emerald-700"
                  placeholder="EX: NUTRI123"
                  required
                  value={formData.nutriCode}
                  onChange={(e) => setFormData({ ...formData, nutriCode: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1 italic">Este código é obrigatório para vincular sua conta ao profissional.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 mt-4"
            >
              {loading ? 'Criando conta...' : 'Criar minha conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
