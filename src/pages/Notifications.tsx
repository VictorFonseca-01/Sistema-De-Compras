import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { 
  Bell, 
  Clock, 
  Trash2, 
  Zap,
  ShieldCheck,
  Inbox,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

export default function Notifications() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    if (!profile) return;
    setLoading(true);
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile, filter]);

  // Real-time listener
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('notifications_history')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${profile.id}` 
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    
    if (!error) {
      toast.success('Todas as notificações foram lidas.');
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notificação removida.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                <Bell size={20} strokeWidth={3} />
             </div>
             <h1 className="gp-page-title text-2xl">Histórico de Protocolos</h1>
          </div>
          <p className="gp-page-subtitle">Central de alertas, atualizações de status e comunicações do sistema.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={markAllAsRead}
            className="flex-1 md:flex-none btn-premium-ghost px-5 py-2.5 rounded-xl border-gp-blue/20 text-gp-blue text-[11px] font-black"
          >
            MARCAR TODAS COMO LIDAS
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="gp-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-gp-surface2 p-1 rounded-xl border border-gp-border w-full sm:w-auto shadow-inner">
          <button 
            onClick={() => setFilter('all')}
            className={clsx(
              "flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              filter === 'all' ? "bg-gp-blue text-white shadow-lg" : "text-gp-text3 hover:text-gp-text"
            )}
          >
            TODAS
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={clsx(
              "flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              filter === 'unread' ? "bg-gp-blue text-white shadow-lg" : "text-gp-text3 hover:text-gp-text"
            )}
          >
            NÃO LIDAS
          </button>
        </div>

        <div className="flex items-center gap-3 text-gp-text3 font-bold text-[11px] uppercase tracking-widest opacity-60">
           <Clock size={14} /> {notifications.length} ENTRADAS ENCONTRADAS
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="gp-card p-6 animate-pulse flex items-center gap-6">
               <div className="w-12 h-12 rounded-2xl bg-gp-surface2 shrink-0" />
               <div className="flex-1 space-y-3">
                  <div className="h-4 w-48 bg-gp-surface2 rounded" />
                  <div className="h-4 w-full bg-gp-surface2 rounded opacity-50" />
               </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="gp-card py-24 text-center border-dashed border-2 opacity-40">
            <div className="w-20 h-20 bg-gp-surface2 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gp-muted shadow-inner">
               <Inbox size={40} strokeWidth={1} />
            </div>
            <p className="text-[12px] font-black uppercase text-gp-muted tracking-[0.2em]">O feed de protocolos está vazio no momento.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              className={clsx(
                "gp-card group relative overflow-hidden transition-all duration-500 hover:scale-[1.01] active:scale-[0.99]",
                !n.is_read ? "border-l-4 border-l-gp-blue bg-gp-blue/[0.02]" : "border-l-4 border-l-transparent"
              )}
            >
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Icon/Type */}
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:rotate-12",
                  !n.is_read ? "bg-gp-blue text-white" : "bg-gp-surface2 text-gp-text3"
                )}>
                  {n.title.toLowerCase().includes('recusado') ? <Zap size={20} /> : <ShieldCheck size={20} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                   <div className="flex items-center gap-3 mb-1">
                      <h3 className={clsx("text-base font-black tracking-tight", !n.is_read ? "text-gp-text" : "text-gp-text2")}>
                        {n.title}
                      </h3>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-gp-blue shadow-lg shadow-gp-blue/40" />}
                   </div>
                   <p className="text-[14px] font-medium text-gp-text3 leading-relaxed opacity-80 line-clamp-2">
                     {n.message}
                   </p>
                   <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gp-border/30">
                      <span className="text-[9px] font-black uppercase text-gp-blue-light tracking-[0.2em] opacity-60">
                        {new Date(n.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className="text-[9px] font-black uppercase text-gp-muted tracking-[0.2em] opacity-40">• SISTEMA GP</span>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
                  <button 
                    onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-gp-surface2 border border-gp-border text-[10px] font-black text-gp-text hover:border-gp-blue hover:text-gp-blue transition-all"
                  >
                    VER DETALHES <ArrowRight size={14} />
                  </button>
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gp-surface2 border border-gp-border text-gp-text3 hover:text-gp-error hover:border-gp-error/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
