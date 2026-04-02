import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { 
  User, Mail, Shield, Building2, Moon, Sun, Save, LogOut, CheckCircle2, AlertCircle
} from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

const departmentOptions = [
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Compras', label: 'Compras' },
  { value: 'Diretoria', label: 'Diretoria' },
  { value: 'Engenharia', label: 'Engenharia' },
  { value: 'Estoque', label: 'Estoque' },
  { value: 'Financeiro', label: 'Financeiro' },
  { value: 'Logística', label: 'Logística' },
  { value: 'Operacional', label: 'Operacional' },
  { value: 'Recursos Humanos', label: 'Recursos Humanos (RH)' },
  { value: 'TI', label: 'Tecnologia (TI)' },
  { value: 'Outro', label: 'Outro' },
];

const roleLabels: Record<string, string> = {
  master_admin: 'Admin Master',
  diretoria: 'Diretoria',
  gestor: 'Gestor',
  ti: 'TI / Tecnologia',
  compras: 'Compras',
  usuario: 'Funcionário',
};

const labelClass = 'block text-[11px] font-bold uppercase tracking-widest mb-2 opacity-70';

export default function Settings() {
  const { profile, loading: profileLoading } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', department: '' });

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', department: profile.department || '' });
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name, department: form.department, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    if (updateError) {
      setError('Erro ao atualizar perfil: ' + updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gp-border2 border-t-gp-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-up">
      <header>
        <h1 className="gp-page-title">Minha Conta</h1>
        <p className="gp-page-subtitle">Configure suas preferências e dados corporativos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile sidebar */}
        <div className="space-y-4">
          <div className="gp-card p-6 text-center">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-5 bg-gradient-to-br from-gp-blue to-gp-blue-dim shadow-gp-blue/20 shadow-lg">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-[15px] font-bold text-gp-text">{profile?.full_name}</h2>
            <p className="text-[11px] font-bold mt-1 mb-4 uppercase tracking-wider text-gp-blue-light">
              {roleLabels[profile?.role || 'usuario']}
            </p>
            <div className="space-y-2.5 pt-4 border-t border-gp-border">
              <div className="flex items-center gap-2.5 text-[13px] text-gp-text2">
                <Mail size={15} strokeWidth={2} className="text-gp-text3" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-gp-text2">
                <Building2 size={15} strokeWidth={2} className="text-gp-text3" />
                {profile?.department || 'Global Parts'}
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="btn-premium-danger w-full py-3 rounded-xl text-[12px]"
          >
            <LogOut size={16} strokeWidth={2} />
            Sair do Sistema
          </button>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile form */}
          <div className="gp-card p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gp-border">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gp-blue-muted text-gp-blue-light">
                <User size={18} strokeWidth={2} />
              </div>
              <h3 className="text-[15px] font-bold text-gp-text">Dados do Perfil</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl text-[13px] font-medium bg-gp-error/10 border border-gp-error/20 text-gp-error">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 p-4 rounded-xl text-[13px] font-medium bg-gp-success/10 border border-gp-success/20 text-gp-success">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  Perfil atualizado com sucesso!
                </div>
              )}

              <div>
                <label className={labelClass + ' text-gp-text3'}>Nome Completo</label>
                <input
                  required
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="gp-input px-4 py-3"
                />
              </div>

              <div>
                <label className={labelClass + ' text-gp-text3'}>Setor / Departamento</label>
                <SearchableSelect
                  options={departmentOptions}
                  value={form.department}
                  onChange={val => setForm({ ...form, department: val })}
                  placeholder="Selecione seu setor"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gp-border">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium-primary px-6 py-3 rounded-xl text-[12px]"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save size={15} strokeWidth={2} />
                  }
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>

          {/* Appearance */}
          <div className="gp-card p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gp-border">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gp-blue-muted text-gp-blue-light">
                <Sun size={18} strokeWidth={2} />
              </div>
              <h3 className="text-[15px] font-bold text-gp-text">Aparência e Sistema</h3>
            </div>

            <div className="space-y-3">
              {/* Dark mode toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gp-surface2 border border-gp-border">
                <div>
                  <h4 className="text-[14px] font-bold text-gp-text">Modo Escuro</h4>
                  <p className="text-[12px] mt-0.5 text-gp-text3">Interface visual escura para menor cansaço visual</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={clsx('w-12 h-6 rounded-full transition-all relative flex items-center', darkMode ? 'bg-gp-blue' : 'bg-gp-border2')}
                >
                  <div
                    className={clsx('w-5 h-5 bg-white rounded-full shadow-md absolute transition-all flex items-center justify-center', darkMode ? 'left-[26px]' : 'left-[2px]')}
                  >
                    {darkMode
                       ? <Moon size={11} className="text-gp-blue" />
                       : <Sun size={11} className="text-slate-400" />
                    }
                  </div>
                </button>
              </div>

              {/* Role display */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gp-surface2 border border-gp-border">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gp-surface3 text-gp-text3">
                  <Shield size={17} strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-gp-text">Nível de Acesso</h4>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-gp-blue-light">
                    {roleLabels[profile?.role || 'usuario']}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
