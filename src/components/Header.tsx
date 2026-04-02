import { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  LogOut, 
  User as UserIcon,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';

export function Header() {
  const { profile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile) fetchNotifications();
  }, [profile]);

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
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) return `HÁ ${diffInMins} MINUTOS`;
    if (diffInHours < 24) return `HÁ ${diffInHours} HORAS`;
    return `HÁ ${diffInDays} DIAS`;
  };

  const roleLabels: Record<string, string> = {
    master_admin: 'Admin Master',
    diretoria: 'Diretoria',
    gestor: 'Gestor',
    ti: 'TI / Tecnologia',
    compras: 'Compras',
    usuario: 'Funcionário'
  };


  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full hidden md:block group">
          <Search size={18} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar solicitações..." 
            className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-500 active:scale-90 group"
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          <div className="relative w-5 h-5 transition-transform duration-700 group-hover:rotate-[360deg]">
            {theme === 'dark' ? (
              <Sun size={20} className="absolute inset-0 animate-in zoom-in spin-in-90 duration-500" />
            ) : (
              <Moon size={20} className="absolute inset-0 animate-in zoom-in spin-in-90 duration-500" />
            )}
          </div>
        </button>

        <div className="relative">
          <button 
            onClick={() => {
              if (!showNotifications) fetchNotifications();
              setShowNotifications(!showNotifications);
            }}
            className="p-2.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-all active:scale-95 group/bell"
          >
            <Bell size={20} className="transition-transform duration-300 group-hover/bell:rotate-12" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-rose-500/40">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full animate-ping opacity-30"></span>
              </>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-6 pb-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h4 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Notificações</h4>
                {unreadCount > 0 && <span className="text-[10px] font-black bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">{unreadCount} NOVAS</span>}
              </div>
              <div className="max-h-64 overflow-y-auto py-2">
                {notifications.length === 0 ? (
                  <div className="px-6 py-8 text-center text-xs text-slate-400 font-bold italic">Nenhuma notificação recente.</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) window.location.href = n.link;
                        setShowNotifications(false);
                      }}
                      className={clsx(
                        "px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-l-4",
                        !n.is_read ? "border-primary-600 bg-primary-50/10" : "border-transparent opacity-70"
                      )}
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                      <p className="text-[10px] font-bold text-primary-500 mt-2 uppercase">{getRelativeTime(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-6 pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
                <button 
                  onClick={() => { window.location.href = '/solicitacoes'; setShowNotifications(false); }}
                  className="text-[10px] font-black text-primary-600 hover:text-primary-500 uppercase tracking-widest"
                >
                  Ir para minhas solicitações
                </button>
              </div>

            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:border-slate-800 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {profile?.full_name || 'Carregando...'}
            </p>
            <p className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider">
              {profile ? roleLabels[profile.role] : '...'}
            </p>
          </div>
          
          <div className="group relative">
            <button className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                <UserIcon size={20} />
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                <p className="text-xs text-slate-500">Logado como</p>
                <p className="text-sm font-semibold truncate">{profile?.email}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
              >
                <LogOut size={16} />
                Sair do Sistema
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

  );
}
