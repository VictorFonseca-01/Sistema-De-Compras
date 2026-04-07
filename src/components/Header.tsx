import { useState, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  User as UserIcon,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';

export function Header() {
  const { profile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile) fetchNotifications();
  }, [profile]);

  // Close dropdowns on outside click
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
    await supabase.auth.signOut();
    window.location.href = '/login';
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
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const roleLabels: Record<string, string> = {
    master_admin: 'Admin Master',
    diretoria: 'Diretoria',
    gestor: 'Gestor',
    ti: 'TI / Tecnologia',
    compras: 'Compras',
    usuario: 'Funcionário'
  };

  const iconBtn = 'w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer relative';

  return (
    <header className="h-14 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30 bg-gp-header/80 backdrop-blur-md border-b border-gp-border">
      {/* Left — breadcrumb / page context (future use) */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={clsx(iconBtn, "text-gp-text3 hover:bg-gp-hover hover:text-gp-text2")}
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark'
            ? <Sun size={17} strokeWidth={2} />
            : <Moon size={17} strokeWidth={2} />
          }
        </button>

        {/* Notifications */}
        <div className="relative" data-dropdown>
          <button
            onClick={() => { if (!showNotifications) fetchNotifications(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className={clsx(iconBtn, "text-gp-text3 hover:bg-gp-hover hover:text-gp-text2")}
          >
            <Bell size={16} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 animate-fade-up bg-gp-surface border border-gp-border shadow-gp-shadow-lg">
              <div className="px-5 py-3.5 border-b border-gp-border">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gp-text3">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="gp-badge gp-badge-blue">{unreadCount} novas</span>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="gp-empty py-10 text-gp-text3">
                    <p className="text-[13px]">Nenhuma notificação</p>
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n.id); if (n.link) window.location.href = n.link; setShowNotifications(false); }}
                    className={clsx(
                      "px-5 py-3.5 cursor-pointer transition-colors border-b border-gp-border last:border-0 hover:bg-gp-hover",
                      !n.is_read ? 'border-l-2 border-l-gp-blue' : 'border-l-2 border-l-transparent',
                      n.is_read && 'opacity-60'
                    )}
                  >
                    <p className="text-[13px] font-semibold truncate text-gp-text">{n.title}</p>
                    <p className="text-[12px] mt-0.5 truncate text-gp-text3">{n.message}</p>
                    <p className="text-[10px] mt-1 font-bold uppercase text-gp-blue-light">{getRelativeTime(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-2 h-5 w-px bg-gp-border" />

        {/* User Menu */}
        <div className="relative flex items-center gap-2.5" data-dropdown>
          {/* User info */}
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-semibold leading-none text-gp-text">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide text-gp-blue-light">
              {profile ? roleLabels[profile.role] : 'Acesso Geral'}
            </p>
          </div>

          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-all duration-300 shadow-lg shadow-gp-blue/20 hover:scale-105 active:scale-95 group/avatar overflow-hidden relative bg-gp-blue"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            <UserIcon size={18} strokeWidth={2.5} className="relative z-10" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50 animate-fade-up bg-gp-surface border border-gp-border shadow-gp-shadow-lg">
              <div className="px-4 py-3 border-b border-gp-border">
                <p className="text-[11px] font-medium text-gp-text3">Logado como</p>
                <p className="text-[13px] font-semibold truncate mt-0.5 text-gp-text">{profile?.email}</p>
              </div>
              <div className="py-1">
                <a
                  href="/configuracoes"
                  className={clsx(iconBtn, 'w-full rounded-none justify-start gap-3 px-4 py-2.5 h-auto text-[13px] font-medium text-gp-text2 hover:bg-gp-hover')}
                >
                  <Settings size={15} strokeWidth={2} />
                  Configurações
                </a>
                <button
                  onClick={handleSignOut}
                  className={clsx(iconBtn, 'w-full rounded-none justify-start gap-3 px-4 py-2.5 h-auto text-[13px] font-medium text-red-500 hover:bg-red-500/10')}
                >
                  <LogOut size={15} strokeWidth={2} />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
