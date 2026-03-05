
import React, { useState } from 'react';
import { User, Mail, Lock, Camera, Save, UserCircle, Loader2, CheckCircle, Shield, Smartphone, AlertCircle } from 'lucide-react';
import { useAuth } from '../../src/context';
import { authService } from '../../src/services';
import { supabase } from '../../src/lib/supabase';

const PatientProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nutriName, setNutriName] = useState<string>('Carregando...');

  const [formData, setFormData] = useState({
    name: user?.profile?.name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    password: '',
  });

  const [avatar, setAvatar] = useState<string | null>(user?.profile?.avatar || null);

  React.useEffect(() => {
    const fetchNutriName = async () => {
      try {
        let tid = user?.tenantId;

        let nutriId = null;

        // 1. Tentar pegar o linked_nutri_id direto do perfil
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('linked_nutri_id')
          .eq('id', user.id)
          .single();

        if (userProfile && (userProfile as any).linked_nutri_id) {
          nutriId = (userProfile as any).linked_nutri_id;
        }

        // 2. Se falhar, tenta pegar via tenant_id
        if (!nutriId && tid) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('nutritionist_id')
            .eq('id', tid)
            .single();

          nutriId = (tenantData as any)?.nutritionist_id;
        }

        if (nutriId) {
          const { data: nutriProfile } = await (supabase as any)
            .rpc('get_public_nutritionist', { nutri_id: nutriId })
            .single();

          if (nutriProfile && (nutriProfile as any).name) {
            setNutriName((nutriProfile as any).name);
          } else {
            setNutriName('Desconhecido');
          }
        } else {
          setNutriName('Desconhecido');
        }
      } catch (e) {
        setNutriName('Erro ao carregar');
      }
    };
    fetchNutriName();
  }, [user]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccess(false);

    if (formData.password && formData.password.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        updateProfile({
          name: formData.name,
          avatar: avatar || undefined
        })
      ];

      if (formData.password) {
        promises.push(
          supabase.auth.updateUser({ password: formData.password }).then(({ error }) => {
            if (error) throw error;
            return true;
          })
        );
      }

      await Promise.all(promises);

      if (formData.password) {
        setFormData(prev => ({ ...prev, password: '' }));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Meu Perfil</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Gerencie seus dados e foto de identificação.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm animate-in slide-in-from-right-4">
            <CheckCircle size={18} /> Perfil Atualizado!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex flex-col items-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative group">
              <div className="w-44 h-44 rounded-[48px] bg-slate-50 border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <UserCircle className="text-slate-200" size={80} />}
              </div>
              <label className="absolute -bottom-2 -right-2 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl cursor-pointer hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-2xl text-slate-900 tracking-tight">{formData.name || 'Seu Nome'}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Paciente NutriSaaS</p>
            </div>
            <div className="w-full pt-6 border-t border-slate-50">
              <div className="bg-slate-50 p-6 rounded-3xl text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Seu Nutricionista</p>
                <p className="font-black text-emerald-600">{nutriName}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col items-center text-center space-y-4 shadow-2xl shadow-slate-900/40">
            <div className="p-4 bg-white/10 rounded-3xl"><Shield className="text-emerald-400" size={32} /></div>
            <h4 className="font-black text-lg tracking-tight">Privacidade Total</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Seus dados de saúde são criptografados e acessíveis apenas pelo seu nutricionista responsável.</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white p-12 rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/60 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 shadow-inner"
                    placeholder="Seu nome..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-6 border-t border-slate-50 space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Alterar Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Nova senha (deixe em branco para não alterar)"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                {errorMsg ? (
                  <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-in slide-in-from-bottom-2">
                    <AlertCircle size={18} /> {errorMsg}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight max-w-[250px]">
                    Suas informações são atualizadas instantaneamente e protegidas por protocolos de segurança clínica.
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black shadow-2xl hover:bg-slate-800 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} className="text-emerald-400" />}
                {loading ? 'Salvando...' : 'Atualizar Meus Dados'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
