import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  Moon, 
  Sun, 
  Save, 
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

const departmentOptions = [
  { value: "Administrativo", label: "Administrativo" },
  { value: "Comercial", label: "Comercial" },
  { value: "Compras", label: "Compras" },
  { value: "Diretoria", label: "Diretoria" },
  { value: "Engenharia", label: "Engenharia" },
  { value: "Estoque", label: "Estoque" },
  { value: "Financeiro", label: "Financeiro" },
  { value: "Logística", label: "Logística" },
  { value: "Operacional", label: "Operacional" },
  { value: "Recursos Humanos", label: "Recursos Humanos (RH)" },
  { value: "TI", label: "Tecnologia (TI)" },
  { value: "Outro", label: "Outro" }
];

export default function Settings() {
  const { profile, loading: profileLoading } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    department: ''
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        department: profile.department || ''
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        department: form.department,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      setError('Erro ao atualizar perfil: ' + updateError.message);
    } else {
      setSuccess(true);
      // Auto-hide success message
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
        <div className="w-12 h-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    master_admin: 'Admin Master',
    diretoria: 'Diretoria',
    gestor: 'Gestor',
    ti: 'TI / Tecnologia',
    compras: 'Compras',
    usuario: 'Funcionário'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Minha Conta</h1>
        <p className="text-slate-500 text-lg">Configure suas preferências e dados corporativos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar de Configurações */}
        <div className="space-y-6">
          <div className="glass rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary-500 to-primary-700 mx-auto flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary-500/20 mb-6 animate-float">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{profile?.full_name}</h2>
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1 mb-6">
              {roleLabels[profile?.role || 'usuario']}
            </p>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
               <div className="flex items-center gap-3 text-sm text-slate-500 font-medium hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Mail size={16} className="text-slate-300" />
                  {profile?.email}
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-500 font-medium hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Building2 size={16} className="text-slate-300" />
                  {profile?.department || 'GLOBAL'}
               </div>
            </div>
          </div>

          <button 
            onClick={handleSignOut}
            className="btn-premium-danger w-full py-5 rounded-[2rem] shadow-sm"
          >
            <LogOut size={20} />
            SAIR DO SISTEMA
          </button>
        </div>

        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                <User size={20} />
              </div>
              Dados do Perfil
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl border border-rose-100 dark:border-rose-800 flex items-center gap-2 font-bold text-sm">
                  <AlertCircle size={18} /> {error}
                </div>
              )}
              
              {success && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-2 font-bold text-sm animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 size={18} /> Perfil atualizado com sucesso!
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={form.full_name} 
                  onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor / Departamento</label>
                <SearchableSelect 
                  options={departmentOptions} 
                  value={form.department} 
                  onChange={val => setForm({...form, department: val})} 
                  placeholder="Selecione seu setor" 
                />
              </div>

              <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-premium-primary px-10 py-4 rounded-2xl shadow-xl active:scale-95"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : <Save size={20} />}
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
             <h3 className="text-xl font-black flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                  <Sun size={20} />
                </div>
                Aparência e Sistema
              </h3>

              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-primary-500/30 transition-all duration-300">
                 <div>
                    <h4 className="font-black text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">Modo Noturno (Dark)</h4>
                    <p className="text-sm text-slate-500 font-medium">Ativar interface visual escura para ambientes com pouca luz.</p>
                 </div>
                 <button 
                  onClick={toggleTheme}
                  className={clsx(
                    "w-16 h-8 rounded-full transition-all relative flex items-center shadow-inner",
                    darkMode ? "bg-primary-600" : "bg-slate-300"
                  )}
                 >
                    <div className={clsx(
                      "w-6 h-6 bg-white rounded-full shadow-lg absolute transition-all flex items-center justify-center",
                      darkMode ? "translate-x-9" : "translate-x-1"
                    )}>
                      {darkMode ? <Moon size={14} className="text-primary-600" /> : <Sun size={14} className="text-slate-400" />}
                    </div>
                 </button>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <Shield size={24} />
                 </div>
                 <div>
                    <h4 className="font-black text-slate-900 dark:text-white italic">Nível de Acesso Corporativo</h4>
                    <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">{roleLabels[profile?.role || 'usuario']}</p>
                 </div>
              </div>
          </section>
        </div>
      </div>
    </div>
  );
}
