import { useState, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  User as UserIcon,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  ShieldCheck,
  Zap,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; is_read: boolean; link?: string; created_at: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile) fetchNotifications();
  }, [profile]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast.success('Sessão encerrada.');
      window.location.href = '/login';
    }
  };

  const fetchNotifications = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Todas as notificações foram lidas.');
    }
  };

  useEffect(() => {
    if (!profile) return;

    // Supabase Real-time Listener for notifications
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload: any) => {
          setNotifications(prev => [payload.new as any, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
          toast.success(payload.new.title || 'Nova Notificação Recebida', {
            icon: '🔔',
            duration: 4000
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const roleLabels: Record<string, string> = {
    master_admin: 'ADMINISTRADOR MASTER',
    diretoria: 'DIRETORIA EXECUTIVA',
    gestor: 'GESTOR REGIONAL',
    ti: 'ANALISTA DE TI',
    compras: 'COMPRAS / SUPRIMENTOS',
    usuario: 'COLABORADOR'
  };

  const actionBtn = 'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 relative group border border-transparent';

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-10 flex-shrink-0 sticky top-0 z-50 bg-gp-bg/60 backdrop-blur-xl border-b border-gp-border/50">
      
      {/* Mobile Menu Trigger & Logo */}
      <div className="flex items-center gap-2 sm:gap-4 lg:hidden min-w-0">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-xl bg-gp-surface border border-gp-border text-gp-text shadow-sm active:scale-95 transition-all shrink-0"
        >
          <Menu size={18} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
           <img src={theme === 'light' ? '/logo-preta.png' : '/logo-branca.png'} alt="GP" className="w-5 h-5 object-contain shrink-0" />
           <span className="font-black text-[11px] sm:text-[12px] uppercase tracking-widest text-gp-text truncate">GLOBAL PARTS</span>
        </div>
      </div>

      {/* Breadcrumb / Status Indicator (Desktop) */}
      <div className="hidden lg:flex items-center gap-6">
         <div className="flex items-center gap-2 px-4 py-1.5 bg-gp-surface2/50 rounded-full border border-gp-border/50">
            <div className="w-1.5 h-1.5 rounded-full bg-gp-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] opacity-80 leading-none">Sistema de Compras</span>
         </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2.5 lg:gap-4">
        
        {/* Theme Intelligence */}
        <button
          onClick={toggleTheme}
          className={clsx(actionBtn, "hover:bg-gp-surface hover:border-gp-border text-gp-muted hover:text-gp-blue active:scale-95")}
          title="Alternar Identidade Visual"
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={3} /> : <Moon size={18} strokeWidth={3} />}
          <div className="absolute inset-0 bg-gp-blue opacity-0 group-hover:opacity-[0.03] rounded-xl transition-opacity" />
        </button>

        {/* Neural Notifications */}
        <div className="relative" data-dropdown>
          <button
            onClick={() => { if (!showNotifications) fetchNotifications(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className={clsx(actionBtn, "hover:bg-gp-surface hover:border-gp-border text-gp-muted hover:text-gp-blue active:scale-95")}
          >
            <Bell size={18} strokeWidth={3} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gp-blue rounded-full text-[10px] font-black text-white flex items-center justify-center px-1.5 shadow-xl shadow-gp-blue/30 border-2 border-gp-bg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-4 w-[360px] rounded-2xl overflow-hidden z-[100] animate-fade-zoom bg-gp-surface border border-gp-border shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)]">
              <div className="px-6 py-5 border-b border-gp-border bg-gp-surface2/80 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Zap size={14} className="text-gp-blue" strokeWidth={3} />
                     <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gp-text dark:text-white">Central de Notificações</span>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                      className="text-[9px] font-black text-gp-blue uppercase tracking-widest bg-gp-blue/10 px-2 py-1 rounded-md hover:bg-gp-blue hover:text-white transition-all shadow-sm active:scale-95"
                    >
                       LIMPAR
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto no-scrollbar bg-gp-surface/50">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center px-10 border-b border-gp-border/30">
                    <div className="w-16 h-16 bg-gp-surface2 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gp-muted shadow-inner relative overflow-hidden">
                       <Bell size={24} strokeWidth={1} />
                       <div className="absolute inset-0 bg-gp-blue/5 animate-pulse" />
                    </div>
                    <p className="text-[11px] font-black uppercase text-gp-text tracking-widest opacity-60">Feed Limpo: Sem novas entradas.</p>
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); setShowNotifications(false); }}
                    className={clsx(
                      "px-6 py-5 cursor-pointer transition-all border-b border-gp-border/30 hover:bg-gp-blue/[0.02] relative group",
                      !n.is_read && 'bg-gp-blue/[0.01]'
                    )}
                  >
                    {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gp-blue" />}
                    <div className="flex justify-between items-start mb-1.5">
                       <p className={clsx("text-[13px] tracking-tight group-hover:text-gp-blue transition-colors", n.is_read ? 'text-gp-muted font-bold' : 'text-gp-text font-black')}>
                          {n.title}
                       </p>
                       {!n.is_read && <div className="w-2 h-2 rounded-full bg-gp-blue shadow-lg shadow-gp-blue/30 mt-1.5" />}
                    </div>
                    <p className="text-[12px] font-medium text-gp-muted line-clamp-2 leading-relaxed opacity-80">{n.message}</p>
                    <div className="flex items-center gap-2 mt-4">
                       <ShieldCheck size={10} className="text-gp-blue-light" />
                       <span className="text-[9px] font-black uppercase text-gp-blue-light tracking-[0.2em] opacity-60">SISTEMA GP • {new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => { navigate('/notificacoes'); setShowNotifications(false); }}
                className="w-full py-4 bg-gp-surface2/80 hover:bg-gp-surface hover:text-gp-blue transition-all border-t border-gp-border text-[10px] font-black uppercase tracking-[0.3em] text-gp-text opacity-70 hover:opacity-100"
              >
                 Ver Histórico Completo
              </button>
            </div>
          )}
        </div>

        {/* Separation Divider */}
        <div className="mx-2 h-6 w-px bg-gp-border/50 hidden sm:block" />

        {/* User Identity Matrix */}
        <div className="relative flex items-center gap-4" data-dropdown>
          <div className="text-right hidden md:block">
            <p className="text-[14px] font-black leading-tight text-gp-text uppercase tracking-tight">
              {profile?.full_name?.split(' ')[0] || 'Acesso'} {profile?.full_name?.split(' ').length! > 1 ? profile?.full_name?.split(' ').pop() : ''}
            </p>
            <div className="flex items-center justify-end gap-2 mt-1.5">
               <div className="w-1 h-1 rounded-full bg-gp-blue shadow-lg shadow-gp-blue/40" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gp-blue-light opacity-80 leading-none">
                 {profileLoading ? 'AUTENTICANDO...' : (profile ? roleLabels[profile.role] : 'SESSÃO VISITANTE')}
               </p>
            </div>
          </div>

          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-white flex-shrink-0 transition-all duration-500 shadow-2xl shadow-gp-blue/30 active:scale-95 group/avatar overflow-hidden relative bg-gp-blue border-2 border-transparent hover:border-white/20"
          >
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            <UserIcon size={20} strokeWidth={3} className="relative z-10" />
            
            {/* Visual Feedback of Active Action */}
            {showUserMenu && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />}
            {showUserMenu && <ChevronDown size={14} className="relative z-20 text-white animate-bounce-short" />}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-4 w-64 rounded-2xl overflow-hidden z-[100] animate-fade-zoom bg-gp-surface border border-gp-border shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)]">
              <div className="px-6 py-6 border-b border-gp-border bg-gp-surface2/80 backdrop-blur-md">
                <p className="text-[10px] font-black text-gp-muted uppercase tracking-[0.3em] opacity-40 mb-3">Informações de Acesso</p>
                <div className="flex flex-col gap-1.5">
                   <p className="text-[13px] font-black truncate text-gp-text uppercase tracking-tight">{profile?.full_name}</p>
                   <p className="text-[11px] font-bold text-gp-blue-light opacity-80 truncate">{profile?.email}</p>
                </div>
              </div>
              <div className="p-3 space-y-1">
                <SidebarMenuBtn 
                  onClick={() => { navigate('/configuracoes'); setShowUserMenu(false); }}
                  icon={Settings}
                  label="Parametrização"
                  badge="SYS"
                />
                <SidebarMenuBtn 
                  onClick={handleSignOut}
                  icon={LogOut}
                  label="Encerrar Sessão"
                  variant="danger"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface SidebarMenuBtnProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  badge?: string;
}

function SidebarMenuBtn({ icon: Icon, label, onClick, variant = 'default', badge }: SidebarMenuBtnProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest group relative overflow-hidden",
        variant === 'danger' ? "text-gp-error hover:bg-gp-error/10" : "text-gp-muted hover:bg-gp-surface2 hover:text-gp-blue"
      )}
    >
      <Icon size={18} strokeWidth={3} className="shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
         <span className="text-[9px] bg-gp-blue/10 text-gp-blue px-1.5 py-0.5 rounded font-black opacity-60 group-hover:opacity-100 transition-opacity">{badge}</span>
      )}
      <div className={clsx(
         "absolute right-2 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100",
         variant === 'danger' ? "bg-gp-error" : "bg-gp-blue"
      )} />
    </button>
  );
}
