
import React, { useState, useRef } from 'react';
import { Camera, Save, Lock, Mail, User, Shield, Image as ImageIcon, Loader2, CheckCircle, Smartphone, DownloadCloud, UploadCloud } from 'lucide-react';
import { useAuth } from '../../src/context';
import { authService, backupService } from '../../src/services';
import { supabase } from '../../src/lib/supabase';

const NutriProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.profile?.name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    crn: user?.profile?.crn || '',
    nutriCode: user?.profile?.nutriCode || '',
    password: '',
  });

  const [avatar, setAvatar] = useState<string | null>(user?.profile?.avatar || null);

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
    setLoading(true);
    setSuccess(false);
    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        crn: formData.crn,
        nutriCode: formData.nutriCode,
        avatar: avatar || undefined
      });

      if (formData.password) {
        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) throw error;
        setFormData(prev => ({ ...prev, password: '' }));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    const tenantId = user?.tenantId;
    if (!tenantId) {
      alert('Erro: ID do Consultório (Tenant) não encontrado para gerar o backup.');
      return;
    }
    try {
      setExporting(true);
      await backupService.exportData(tenantId);
      alert('Backup exportado com sucesso! Verifique sua pasta de downloads.');
    } catch (error: any) {
      alert(error.message || 'Erro ao exportar backup');
    } finally {
      setExporting(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const tenantId = user?.tenantId;
    if (!file || !tenantId) return;

    try {
      setImporting(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const contents = e.target?.result as string;
          const payload = JSON.parse(contents);

          await backupService.importData(tenantId, payload);
          alert('Backup importado e restaurado com sucesso!');
          window.location.reload(); // Recarrega para buscar os novos dados
        } catch (error: any) {
          alert('Erro ao processar arquivo: ' + (error.message || 'Formato inválido'));
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsText(file);
    } catch (error: any) {
      alert('Erro inesperado: ' + error.message);
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configurações de Perfil</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Gerencie sua identidade visual e dados profissionais.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm animate-in slide-in-from-right-4">
            <CheckCircle size={18} /> Alterações Salvas
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-10 rounded-[40px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex flex-col items-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative group">
              <div className="w-40 h-40 rounded-[48px] bg-slate-50 border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <User className="text-slate-200" size={64} />}
              </div>
              <label className="absolute -bottom-2 -right-2 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl cursor-pointer hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-2xl text-slate-900 tracking-tight">{formData.name || 'Seu Nome'}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{formData.crn ? `CRN: ${formData.crn}` : 'Registro não informado'}</p>
            </div>
            <div className="w-full pt-6 border-t border-slate-50 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código NutriSaaS</span>
                <span className="font-black text-emerald-600 tracking-wider">#{formData.nutriCode || '---'}</span>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-bold leading-relaxed px-4 opacity-70">
                Este código é utilizado pelos seus pacientes para se vincularem à sua clínica no momento do cadastro.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col items-center text-center space-y-4 shadow-2xl shadow-slate-900/40">
            <div className="p-4 bg-white/10 rounded-3xl"><Shield className="text-emerald-400" size={32} /></div>
            <h4 className="font-black text-lg tracking-tight">Segurança de Dados</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Seu perfil é protegido por criptografia de nível bancário e conformidade total com a LGPD clínica.</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white p-12 rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/60 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo Profissional</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 shadow-inner"
                    placeholder="Como seus pacientes te verão..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de Acesso</label>
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

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Telefone / WhatsApp</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Inscrição no CRN</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    value={formData.crn}
                    onChange={(e) => setFormData({ ...formData, crn: e.target.value })}
                    placeholder="00000/P"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-emerald-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Código de Indicação</label>
                <input
                  type="text"
                  value={formData.nutriCode}
                  disabled
                  className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-black text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2 space-y-3 pt-6 border-t border-slate-50">
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight max-w-[250px]">
                Ao salvar, seus dados profissionais serão atualizados instantaneamente em todos os documentos emitidos pela plataforma.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Seção Nova de Backup Local */}
          <div className="bg-white mt-10 p-12 rounded-[50px] border border-slate-50 shadow-2xl shadow-slate-200/60 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <DownloadCloud size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cofre Local (Backup)</h3>
              <p className="text-slate-500 font-medium max-w-sm mt-2">
                Baixe um arquivo de segurança contendo todos os dados do seu consultório ou restaure um cofre salvo no seu PC.
              </p>
            </div>

            <div className="flex w-full md:w-auto flex-col md:flex-row gap-4 mt-4">
              <button
                onClick={handleExportBackup}
                disabled={exporting || importing}
                className="px-10 py-4 bg-slate-900 text-white rounded-[20px] font-black shadow-xl hover:bg-slate-800 active:scale-95 transition-all text-sm flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="animate-spin" size={18} /> : <DownloadCloud size={18} className="text-blue-400" />}
                {exporting ? 'Exportando...' : 'Exportar Nuvem para PC'}
              </button>

              <label
                className={`px-10 py-4 bg-white text-slate-700 rounded-[20px] border-2 border-slate-100 font-black shadow-sm hover:border-slate-300 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all text-sm flex items-center justify-center gap-3 ${importing ? "opacity-50 pointer-events-none" : ""}`}
              >
                {importing ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} className="text-orange-500" />}
                {importing ? 'Importando...' : 'Restaurar PC para Nuvem'}
                <input
                  type="file"
                  className="hidden"
                  accept=".json"
                  onChange={handleImportBackup}
                  ref={fileInputRef}
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 opacity-70">
              Usa arquitetura JSON Upsert Segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutriProfile;
