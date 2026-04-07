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
  X
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { clsx } from 'clsx';

interface SidebarProps {
  theme: 'light' | 'dark';
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ theme, isOpen, onClose }: SidebarProps) {
  const { profile, loading } = useProfile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ListOrdered, label: 'Minhas Solicitações', path: '/solicitacoes' },
  ];

  if (profile?.role === 'master_admin' || profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'gestor' || profile?.role === 'diretoria') {
    navItems.push({ icon: Warehouse, label: 'Estoque', path: '/estoque' });
  }

  if (profile?.role === 'master_admin' || profile?.role === 'gestor' || profile?.role === 'ti' || profile?.role === 'diretoria') {
    navItems.push({ icon: UserCheck, label: 'Fila de Aprovação', path: '/solicitacoes' });
  }

  const adminItems: { icon: any; label: string; path: string }[] = [];
  if (profile?.role === 'master_admin') {
    adminItems.push({ icon: Users, label: 'Usuários', path: '/admin' });
  }

  if (loading) {
     return (
       <aside 
         style={{ 
           background: theme === 'light' ? '#ffffff' : 'var(--gp-sidebar)', 
           borderRight: '1px solid var(--gp-sidebar-border)' 
         }}
         className={clsx('flex flex-col h-screen sticky top-0 animate-pulse', isCollapsed ? 'w-[68px]' : 'w-60')}
       >
         <div className="h-14 border-b border-gp-sidebar-border flex items-center px-4">
           <div className="w-8 h-8 rounded bg-gp-blue/5" />
         </div>
         <div className="p-4 space-y-4">
           <div className="h-8 rounded bg-gp-blue/5" />
           <div className="h-8 rounded bg-gp-blue/5 w-2/3" />
           <div className="h-8 rounded bg-gp-blue/5" />
         </div>
       </aside>
     );
  }

  return (
    <aside
      style={{ 
        background: theme === 'light' ? '#ffffff' : 'var(--gp-sidebar)', 
        borderRight: theme === 'light' ? '1px solid #e2e8f0' : '1px solid var(--gp-sidebar-border)',
        color: theme === 'light' ? '#0f172a' : 'var(--gp-text)'
      }}
      className={clsx(
        'flex flex-col h-screen sticky top-0 transition-all duration-300 z-[70] flex-shrink-0',
        'fixed inset-y-0 left-0 sm:sticky transform',
        !isOpen && '-translate-x-full sm:translate-x-0',
        isOpen && 'translate-x-0',
        isCollapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-5 flex-shrink-0" style={{ borderBottom: theme === 'light' ? '1px solid #f1f5f9' : '1px solid var(--gp-border)' }}>
        {!isCollapsed && (
          <div className="flex items-center gap-3.5 min-w-0 group cursor-default">
            <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-gp-blue rounded-xl shadow-lg shadow-gp-blue/20 transform group-hover:rotate-6 transition-transform">
               <img src="/logo-branca.png" alt="Global Parts" className="w-5 h-5 object-contain" />
             </div>
            <div className="min-w-0 flex flex-col justify-center">
               <p className="text-[12px] font-black leading-tight tracking-tight uppercase" style={{ color: theme === 'light' ? '#0f172a' : 'var(--gp-text)' }}>
                 Sistema de <span className="text-gp-blue">Compras</span>
               </p>
               <p className="text-[10px] font-bold tracking-[0.15em] uppercase opacity-60 mt-0.5" style={{ color: theme === 'light' ? '#64748b' : 'var(--gp-text3)' }}>
                 Global Parts
               </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto w-9 h-9 flex items-center justify-center bg-gp-blue rounded-xl shadow-lg shadow-gp-blue/20">
            <img src="/logo-branca.png" alt="GP" className="w-5 h-5 object-contain" />
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gp-surface border border-gp-border text-gp-text2"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* New Request CTA */}
      {!isCollapsed && (
        <div className="px-5 pt-6 pb-4">
          <NavLink
            to="/solicitacoes/nova"
            onClick={() => {
              if (window.innerWidth < 1024 && onClose) onClose();
            }}
            className="relative overflow-hidden flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-[11px] font-black tracking-[0.1em] uppercase transition-all duration-300 text-white shadow-xl shadow-gp-blue/25 hover:shadow-gp-blue/40 hover:-translate-y-0.5 active:translate-y-0 group/btn"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <PlusCircle size={16} strokeWidth={3} className="transform group-hover/btn:rotate-90 transition-transform" />
            Nova Solicitação
          </NavLink>
        </div>
      )}

      {isCollapsed && (
        <div className="px-3 pt-6 pb-4">
          <NavLink
            to="/solicitacoes/nova"
            className="flex items-center justify-center w-full h-11 rounded-xl transition-all duration-300 text-white shadow-lg shadow-gp-blue/20 hover:scale-105 active:scale-95"
            style={{ background: '#2563eb' }}
            title="Nova Solicitação"
          >
            <PlusCircle size={20} strokeWidth={3} />
          </NavLink>
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2 space-y-4">
        {/* Main Menu */}
        <div>
          {!isCollapsed && (
            <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)' }}>
              Menu Principal
            </p>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/'}
                onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 rounded-lg transition-all duration-150 group relative',
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                  isActive
                    ? 'font-bold'
                    : 'font-medium'
                )}
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
                  color: isActive ? '#2563eb' : (theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)'),
                  borderLeft: isActive && !isCollapsed ? '2px solid #2563eb' : '2px solid transparent',
                })}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!el.className.includes('active')) {
                    el.style.background = theme === 'light' ? 'rgba(15,23,42,0.04)' : 'var(--gp-sidebar-hover)';
                    el.style.color = theme === 'light' ? '#2563eb' : 'var(--gp-sidebar-text-active)';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!el.className.includes('active')) {
                     el.style.background = 'transparent';
                     el.style.color = theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)';
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="flex-shrink-0"
                    />
                    {!isCollapsed && (
                      <span className="text-[13px] truncate">{item.label}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#2563eb' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <div>
            {!isCollapsed && (
              <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)' }}>
                Administração
              </p>
            )}
            <nav className="space-y-0.5">
              {adminItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 rounded-lg transition-all duration-150',
                    isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}
                  style={({ isActive }) => ({
                    background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
                    color: isActive ? '#2563eb' : (theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)'),
                    borderLeft: isActive && !isCollapsed ? '2px solid #2563eb' : '2px solid transparent',
                  })}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!el.className.includes('active')) {
                      el.style.background = theme === 'light' ? 'rgba(15,23,42,0.04)' : 'var(--gp-sidebar-hover)';
                      el.style.color = theme === 'light' ? '#2563eb' : 'var(--gp-sidebar-text-active)';
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!el.className.includes('active')) {
                       el.style.background = 'transparent';
                       el.style.color = theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)';
                    }
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                      {!isCollapsed && <span className="text-[13px] truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 pb-3 pt-2 flex-shrink-0" style={{ borderTop: theme === 'light' ? '1px solid #e2e8f0' : '1px solid var(--gp-border)' }}>
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center w-full h-9 rounded-lg transition-all duration-200 mb-1"
            style={{ color: theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)' }}
            onMouseEnter={e => { 
              (e.currentTarget as HTMLElement).style.background = theme === 'light' ? 'rgba(15,23,42,0.04)' : 'var(--gp-sidebar-hover)'; 
              (e.currentTarget as HTMLElement).style.color = theme === 'light' ? '#2563eb' : 'var(--gp-sidebar-text-active)'; 
            }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)'; }}
          >
            <ChevronRight size={14} />
          </button>
        )}

        <NavLink
          to="/configuracoes"
          onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
          title={isCollapsed ? 'Configurações' : undefined}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 rounded-lg transition-all duration-150',
            isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
            isActive ? 'font-semibold' : 'font-medium'
          )}
          style={({ isActive }) => ({
            background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
            color: isActive ? '#2563eb' : (theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)'),
          })}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            if (!el.className.includes('active')) {
              el.style.background = theme === 'light' ? 'rgba(15,23,42,0.04)' : 'var(--gp-sidebar-hover)';
              el.style.color = theme === 'light' ? '#2563eb' : 'var(--gp-sidebar-text-active)';
            }
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            if (!el.className.includes('active')) {
               el.style.background = 'transparent';
               el.style.color = theme === 'light' ? '#64748b' : 'var(--gp-sidebar-text)';
            }
          }}
        >
          {({ isActive }) => (
            <>
              <Settings size={18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-[13px]">Configurações</span>}
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
