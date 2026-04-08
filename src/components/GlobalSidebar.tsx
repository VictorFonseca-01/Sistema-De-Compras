import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  Users, 
  Settings,
  ChevronRight,
  UserCheck,
  Warehouse,
  X,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { clsx } from 'clsx';

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { profile, loading } = useProfile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Painel de Controle', path: '/' },
    { icon: ListOrdered, label: 'Solicitações de Compras', path: '/solicitacoes' }, 
    { icon: Warehouse, label: 'Estoque / Inventário', path: '/estoque' }, 
  ];

  if (profile?.role === 'master_admin' || profile?.role === 'gestor' || profile?.role === 'diretoria' || profile?.role === 'compras' || profile?.role === 'ti') {
    navItems.push({ icon: UserCheck, label: 'Solicitações Pendentes', path: '/solicitacoes' });
  }

  const adminItems: { icon: any; label: string; path: string }[] = [];
  if (profile?.role === 'master_admin') {
    adminItems.push({ icon: Users, label: 'Usuários e Empresas', path: '/admin' });
    adminItems.push({ icon: FileText, label: 'Relatórios BI', path: '/relatorios' });
  }

  if (loading) {
     return (
       <aside 
         className={clsx(
           'flex flex-col h-screen sticky top-0 bg-gp-sidebar border-r border-gp-sidebar-border transition-all duration-300', 
           isCollapsed ? 'w-20' : 'w-64'
         )}
       >
         <div className="h-20 border-b border-gp-sidebar-border flex items-center px-6">
            <div className="w-10 h-10 rounded-xl bg-gp-surface animate-pulse" />
         </div>
         <div className="p-6 space-y-6">
            <div className="h-4 bg-gp-surface rounded-full w-24 opacity-20" />
            <div className="space-y-3">
               <div className="h-12 bg-gp-surface rounded-xl w-full opacity-40 animate-pulse" />
               <div className="h-12 bg-gp-surface rounded-xl w-full opacity-40 animate-pulse" />
               <div className="h-12 bg-gp-surface rounded-xl w-full opacity-40 animate-pulse" />
            </div>
         </div>
       </aside>
     );
  }

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen overflow-hidden transition-all duration-500 z-[70] shadow-2xl',
        'fixed inset-y-0 left-0 lg:sticky lg:top-0 transform',
        'bg-gp-sidebar border-r border-gp-sidebar-border text-gp-text',
        !isOpen && '-translate-x-full lg:translate-x-0',
        isOpen && 'translate-x-0',
        isCollapsed ? 'w-24' : 'w-72 lg:w-80' // Um pouco mais largo para respiro e frases longas
      )}
    >
      {/* Brand Identity */}
      <div className="h-24 flex items-center justify-between px-6 flex-shrink-0 border-b border-gp-sidebar-border/50 relative overflow-hidden bg-gp-surface2/30">
        {!isCollapsed && (
          <div className="flex items-center gap-4 min-w-0 group cursor-pointer" onClick={() => setIsCollapsed(true)}>
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gp-blue rounded-xl shadow-lg shadow-gp-blue/20 transform group-hover:scale-110 transition-all duration-500">
               <img src="/logo-branca.png" alt="Global Parts" className="w-6 h-6 object-contain" />
             </div>
            <div className="min-w-0 flex flex-col justify-center">
               <p className="text-[14px] font-black leading-none tracking-tight uppercase text-gp-text dark:text-white">
                 GLOBAL<span className="text-gp-blue">PARTS</span>
               </p>
                <p className="text-[9px] font-black tracking-[0.3em] uppercase text-gp-blue-light mt-1.5 opacity-80 leading-none">
                  Sistema de Compras
                </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="mx-auto w-10 h-10 flex items-center justify-center bg-gp-blue rounded-xl shadow-xl shadow-gp-blue/20 hover:scale-110 transition-transform duration-300"
          >
            <img src="/logo-branca.png" alt="GP" className="w-6 h-6 object-contain" />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gp-surface border border-gp-border text-gp-text shadow-sm"
          >
            <X size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Primary Action */}
      {!isCollapsed ? (
        <div className="px-6 pt-8 pb-4">
          <NavLink
            to="/solicitacoes/nova"
            onClick={() => window.innerWidth < 1024 && onClose && onClose()}
            className="btn-premium-primary w-full py-4 rounded-xl shadow-xl shadow-gp-blue/10 uppercase text-[11px] font-black tracking-[0.2em] group"
          >
            <PlusCircle size={16} strokeWidth={3} className="mr-2.5 group-hover:rotate-90 transition-transform duration-500" />
            Nova Solicitação
          </NavLink>
        </div>
      ) : (
        <div className="px-5 pt-8 pb-4">
          <NavLink
            to="/solicitacoes/nova"
            className="w-14 h-14 mx-auto flex items-center justify-center rounded-xl bg-gp-blue text-white shadow-xl shadow-gp-blue/20 hover:scale-105 active:scale-95 transition-all group"
            title="Nova Solicitação"
          >
            <PlusCircle size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
          </NavLink>
        </div>
      )}

      {/* Navigation Ecosystem */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 space-y-10">
        
        {/* Core Operations */}
        <section className="space-y-3">
          {!isCollapsed && (
            <p className="px-3 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-gp-muted opacity-40">
              Operações
            </p>
          )}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <SidebarItem 
                key={item.label} 
                item={item} 
                isCollapsed={isCollapsed} 
                onClose={onClose} 
              />
            ))}
          </nav>
        </section>

        {/* Administration & Intelligence */}
        {adminItems.length > 0 && (
          <section className="space-y-3">
            {!isCollapsed && (
              <p className="px-3 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-gp-muted opacity-40">
                Governança
              </p>
            )}
            <nav className="space-y-1.5">
              {adminItems.map((item) => (
                <SidebarItem 
                  key={item.label} 
                  item={item} 
                  isCollapsed={isCollapsed} 
                  onClose={onClose} 
                  variant="purple"
                />
              ))}
            </nav>
          </section>
        )}
      </div>

      {/* Modular Footer */}
      <div className="px-5 pb-8 pt-4 flex-shrink-0 border-t border-gp-sidebar-border/50 bg-gp-surface2/10">
        {!isCollapsed && (
           <div className="px-3 mb-4 flex items-center gap-2">
              <ShieldCheck size={12} className="text-gp-success opacity-60" />
              <span className="text-[9px] font-black text-gp-muted uppercase tracking-[0.2em] opacity-40">Design v3.0 Estendido</span>
           </div>
        )}
        <NavLink
          to="/configuracoes"
          onClick={() => window.innerWidth < 1024 && onClose && onClose()}
          className={({ isActive }) => clsx(
            'flex items-center gap-3.5 rounded-xl transition-all duration-300 relative group',
            isCollapsed ? 'justify-center py-4' : 'px-4 py-3.5',
            isActive 
              ? 'bg-gp-surface border border-gp-border text-gp-blue shadow-lg shadow-black/5' 
              : 'text-gp-muted hover:text-gp-text hover:bg-gp-surface2/30'
          )}
        >
          {({ isActive }) => (
            <>
              <Settings size={20} strokeWidth={isActive ? 3 : 2.5} className={clsx(isActive && "text-gp-blue")} />
              {!isCollapsed && <span className="text-[13px] font-black uppercase tracking-widest truncate">Ajustes</span>}
              {!isCollapsed && (
                 <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
              )}
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}

function SidebarItem({ item, isCollapsed, onClose, variant = 'blue' }: { item: any, isCollapsed: boolean, onClose?: () => void, variant?: 'blue' | 'purple' }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={() => window.innerWidth < 1024 && onClose && onClose()}
      className={({ isActive }) => clsx(
        'flex items-center gap-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden',
        isCollapsed ? 'justify-center py-4' : 'px-4 py-3.5',
        isActive
          ? clsx(
              'font-black bg-gp-surface border border-gp-border shadow-xl shadow-black/5',
              variant === 'blue' ? 'text-gp-blue' : 'text-gp-purple'
            )
          : 'font-bold text-gp-muted hover:text-gp-text hover:bg-gp-surface2/30'
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
             <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1",
                variant === 'blue' ? "bg-gp-blue" : "bg-gp-purple"
             )} />
          )}
          <item.icon
            size={18}
            strokeWidth={isActive ? 3 : 2.5}
            className={clsx(
              "flex-shrink-0 transition-colors",
              isActive && (variant === 'blue' ? "text-gp-blue" : "text-gp-purple")
            )}
          />
          {!isCollapsed && (
            <span className="text-[12px] sm:text-[13px] font-black uppercase tracking-tight sm:tracking-[0.05em] truncate group-hover:translate-x-1 transition-transform">
               {item.label}
            </span>
          )}
          {isActive && !isCollapsed && (
             <div className={clsx(
                "ml-auto w-1.5 h-1.5 rounded-full",
                variant === 'blue' ? "bg-gp-blue animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-gp-purple shadow-[0_0_8px_rgba(168,85,247,0.5)]"
             )} />
          )}
        </>
      )}
    </NavLink>
  );
}
