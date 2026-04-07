import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { 
  User, Mail, Shield, Building2, Moon, Sun, Save, LogOut, CheckCircle2, AlertCircle, AlertTriangle, Trash2, CheckCircle
} from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

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

  // Estados de Liquidação (Danger Zone)
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyConfirmStep, setEmptyConfirmStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function executeEmptyInventory() {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('empty_asset_inventory');
      if (error) throw error;
      setEmptyConfirmStep(3);
      toast.success('Inventário limpo com sucesso.');
    } catch (err: any) {
      toast.error('Erro ao esvaziar estoque: ' + err.message);
      setShowEmptyConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

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
          <div className="gp-card p-6 text-center overflow-hidden relative group">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-gp-blue/5 rounded-full blur-3xl group-hover:bg-gp-blue/10 transition-colors" />
            
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-black mb-5 bg-gp-blue shadow-lg shadow-gp-blue/20 relative z-10 transition-transform group-hover:scale-105">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="text-[15px] font-bold text-gp-text relative z-10">{profile?.full_name}</h2>
            <p className="text-[11px] font-black mt-1 mb-4 uppercase tracking-widest text-gp-blue-light relative z-10">
              {roleLabels[profile?.role || 'usuario']}
            </p>
            
            <div className="space-y-2.5 pt-4 border-t border-gp-border relative z-10">
              <div className="flex items-center gap-2.5 text-[13px] text-gp-text2">
                <Mail size={15} strokeWidth={2.5} className="text-gp-text3" />
                <span className="truncate font-medium">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-gp-text2">
                <Building2 size={15} strokeWidth={2.5} className="text-gp-text3" />
                <span className="font-medium">{profile?.department || 'Global Parts'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="btn-premium-danger w-full py-3.5 rounded-xl text-[12px] shadow-lg shadow-gp-error/10"
          >
            <LogOut size={16} strokeWidth={2.5} />
            Sair do Sistema
          </button>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile form */}
          <div className="gp-card p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gp-blue-muted text-gp-blue-light">
                <User size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gp-text leading-none">Dados do Perfil</h3>
                <p className="text-[11px] text-gp-text3 font-medium mt-1.5 uppercase tracking-wider">Informações visíveis para a equipe</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl text-[13px] font-bold bg-gp-error/10 border border-gp-error/20 text-gp-error animate-shake">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 p-4 rounded-xl text-[13px] font-bold bg-gp-success/10 border border-gp-success/20 text-gp-success">
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                  Perfil atualizado com sucesso!
                </div>
              )}

              <div className="space-y-2">
                <label className={labelClass + ' text-gp-muted'}>Nome Completo</label>
                <input
                  required
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="gp-input"
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass + ' text-gp-muted'}>Setor / Departamento</label>
                <SearchableSelect
                  options={departmentOptions}
                  value={form.department}
                  onChange={val => setForm({ ...form, department: val })}
                  placeholder="Selecione seu setor"
                />
              </div>

              <div className="flex justify-end pt-6 border-t border-gp-border">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium-primary px-8 py-3.5 rounded-xl text-[12px] w-full sm:w-auto"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save size={16} strokeWidth={2.5} />
                  }
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>

          {/* Appearance */}
          <div className="gp-card p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gp-blue/10 text-gp-blue">
                <Sun size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gp-text leading-none">Aparência e Sistema</h3>
                <p className="text-[11px] text-gp-text3 font-medium mt-1.5 uppercase tracking-wider">Preferências visuais e permissões</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Dark mode toggle */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-gp-surface2 border border-gp-border group hover:bg-gp-surface transition-colors">
                <div>
                  <h4 className="text-[14px] font-bold text-gp-text">Modo Escuro</h4>
                  <p className="text-[12px] mt-0.5 text-gp-text3 font-medium">Interface visual escura para menor cansaço visual</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={clsx('w-14 h-7 rounded-full transition-all relative flex items-center p-1', darkMode ? 'bg-gp-blue shadow-lg shadow-gp-blue/20' : 'bg-gp-border2')}
                >
                  <div
                    className={clsx('w-5 h-5 bg-white rounded-full shadow-md absolute transition-all flex items-center justify-center', darkMode ? 'translate-x-7' : 'translate-x-0')}
                  >
                    {darkMode
                       ? <Moon size={11} className="text-gp-blue" strokeWidth={3} />
                       : <Sun size={11} className="text-slate-400" strokeWidth={3} />
                    }
                  </div>
                </button>
              </div>

              {/* Role display */}
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-gp-surface2 border border-gp-border">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gp-surface3 text-gp-text3 border border-gp-border shadow-inner">
                  <Shield size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-gp-text">Nível de Acesso Corporativo</h4>
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-gp-blue mt-1 leading-none">
                    {roleLabels[profile?.role || 'usuario']}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone — Master Admin Only */}
          {profile?.role === 'master_admin' && (
             <div className="gp-card p-6 sm:p-8 border-gp-error/30 bg-gp-error/[0.02]">
               <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gp-error/10">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gp-error/10 text-gp-error">
                   <AlertTriangle size={20} strokeWidth={2.5} />
                 </div>
                 <div>
                   <h3 className="text-[16px] font-bold text-gp-error leading-none">Zona de Risco</h3>
                   <p className="text-[11px] text-gp-error/60 font-medium mt-1.5 uppercase tracking-wider">Ações estruturais irreversíveis</p>
                 </div>
               </div>

               <div className="p-5 rounded-2xl bg-gp-surface2 border border-gp-error/10 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-[14px] font-bold text-gp-text">Zerar Inventário Global</h4>
                      <p className="text-[12px] mt-0.5 text-gp-text3 font-medium">Remove permanentemente todos os ativos do banco de dados.</p>
                    </div>
                    <button 
                      onClick={() => { setShowEmptyConfirm(true); setEmptyConfirmStep(1); }}
                      className="btn-premium-danger px-6 py-2.5 rounded-xl text-[11px] w-full sm:w-auto"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                      EXECUTAR LIMPEZA
                    </button>
                  </div>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Limpeza */}
      {showEmptyConfirm && (
        <div className="gp-modal-overlay">
          <div className="gp-modal max-w-md animate-fade-up">
            <div className="p-10 text-center">
              <div className="flex justify-center mb-8">
                 <div className={clsx(
                   "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner",
                   emptyConfirmStep === 3 ? "bg-gp-success/10 text-gp-success" : "bg-gp-error/10 text-gp-error"
                 )}>
                    {emptyConfirmStep === 3 ? <CheckCircle size={32} strokeWidth={2.5} /> : <AlertTriangle size={32} strokeWidth={2.5} />}
                 </div>
              </div>
              
              {emptyConfirmStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gp-text tracking-tight uppercase leading-none">Liquidação Total?</h3>
                    <p className="text-gp-text3 font-medium text-[14px] uppercase tracking-wider">Passo 1 de 2</p>
                  </div>
                  <p className="text-gp-text2 font-medium text-[15px] leading-relaxed">Você está prestes a apagar <strong className="text-gp-text font-bold">todos os registros</strong> de patrimônio. Esta ação é monitorada e deixará logs de auditoria.</p>
                  <div className="pt-6 space-y-3">
                    <button onClick={() => setEmptyConfirmStep(2)} className="w-full btn-premium-danger py-4 rounded-xl shadow-lg">PROSSEGUIR COM CAUTELA</button>
                    <button onClick={() => setShowEmptyConfirm(false)} className="w-full btn-premium-ghost py-3 rounded-xl text-gp-text3 font-black">ABORTAR MISSÃO</button>
                  </div>
                </div>
              )}

              {emptyConfirmStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gp-error tracking-tight uppercase leading-none">Confirmação Final</h3>
                    <p className="text-gp-error/60 font-medium text-[14px] uppercase tracking-wider">Passo 2 de 2</p>
                  </div>
                  <p className="text-gp-text2 font-medium text-[15px] leading-relaxed italic">"Eu entendo que todos os equipamentos e históricos vinculados serão removidos instantaneamente."</p>
                  <div className="pt-6 space-y-3">
                    <button onClick={executeEmptyInventory} disabled={isDeleting} className="w-full btn-premium-danger py-4 rounded-xl shadow-xl flex items-center justify-center">
                      {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'SIM, DELETAR TUDO AGORA'}
                    </button>
                    <button onClick={() => setShowEmptyConfirm(false)} disabled={isDeleting} className="w-full btn-premium-ghost py-3 rounded-xl font-black">VOLTAR</button>
                  </div>
                </div>
              )}

              {emptyConfirmStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-gp-success tracking-tight uppercase leading-none">Base Geral Limpa</h3>
                  <p className="text-gp-text3 font-medium text-[15px]">O inventário global foi reiniciado com sucesso via servidor.</p>
                  <div className="pt-6">
                    <button onClick={() => setShowEmptyConfirm(false)} className="w-full btn-premium-dark py-4 rounded-xl shadow-lg font-black uppercase tracking-widest text-[12px]">CONCLUÍDO</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
