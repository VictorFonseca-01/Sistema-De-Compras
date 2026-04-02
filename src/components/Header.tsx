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
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30"
      style={{
        background: 'var(--gp-header)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--gp-border)',
      }}
    >
      {/* Left — breadcrumb / page context (future use) */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={iconBtn}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          style={{ color: 'var(--gp-text3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--gp-text2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--gp-text3)'; }}
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
            className={iconBtn}
            style={{ color: 'var(--gp-text3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--gp-text2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--gp-text3)'; }}
          >
            <Bell size={16} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 animate-fade-up"
              style={{ background: 'var(--gp-surface)', border: '1px solid var(--gp-border)', boxShadow: 'var(--gp-shadow-lg)' }}
            >
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--gp-border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--gp-text3)' }}>Notificações</span>
                  {unreadCount > 0 && (
                    <span className="gp-badge gp-badge-blue">{unreadCount} novas</span>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="gp-empty py-10" style={{ color: 'var(--gp-text3)' }}>
                    <p className="text-[13px]">Nenhuma notificação</p>
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n.id); if (n.link) window.location.href = n.link; setShowNotifications(false); }}
                    className="px-5 py-3.5 cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid var(--gp-border)',
                      borderLeft: !n.is_read ? '2px solid var(--gp-blue)' : '2px solid transparent',
                      opacity: n.is_read ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--gp-text)' }}>{n.title}</p>
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--gp-text3)' }}>{n.message}</p>
                    <p className="text-[10px] mt-1 font-bold uppercase" style={{ color: 'var(--gp-blue-light)' }}>{getRelativeTime(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-2 h-5 w-px" style={{ background: 'var(--gp-border2)' }} />

        {/* User Menu */}
        <div className="relative flex items-center gap-2.5" data-dropdown>
          {/* User info */}
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-semibold leading-none" style={{ color: 'var(--gp-text)' }}>
              {profile?.full_name || '—'}
            </p>
            <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: 'var(--gp-blue-light)' }}>
              {profile ? roleLabels[profile.role] : '…'}
            </p>
          </div>

          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition-all duration-150"
            style={{ background: 'linear-gradient(135deg, var(--gp-blue) 0%, var(--gp-blue-dim) 100%)' }}
          >
            <UserIcon size={16} strokeWidth={2} />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50 animate-fade-up"
              style={{ background: 'var(--gp-surface)', border: '1px solid var(--gp-border)', boxShadow: 'var(--gp-shadow-lg)' }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--gp-border)' }}>
                <p className="text-[11px] font-medium" style={{ color: 'var(--gp-text3)' }}>Logado como</p>
                <p className="text-[13px] font-semibold truncate mt-0.5" style={{ color: 'var(--gp-text)' }}>{profile?.email}</p>
              </div>
              <div className="py-1">
                <a
                  href="/configuracoes"
                  className={clsx(iconBtn, 'w-full rounded-none justify-start gap-3 px-4 py-2.5 h-auto text-[13px] font-medium')}
                  style={{ color: 'var(--gp-text2)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Settings size={15} strokeWidth={2} />
                  Configurações
                </a>
                <button
                  onClick={handleSignOut}
                  className={clsx(iconBtn, 'w-full rounded-none justify-start gap-3 px-4 py-2.5 h-auto text-[13px] font-medium text-red-500')}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
