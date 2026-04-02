import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Warehouse
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { clsx } from 'clsx';

export function Sidebar() {
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
         style={{ background: 'var(--gp-sidebar)', borderRight: '1px solid var(--gp-border)' }}
         className={clsx('flex flex-col h-screen sticky top-0 animate-pulse', isCollapsed ? 'w-[68px]' : 'w-60')}
       >
         <div className="h-14 border-b border-gp-border flex items-center px-4">
           <div className="w-8 h-8 rounded bg-white/5" />
         </div>
         <div className="p-4 space-y-4">
           <div className="h-8 rounded bg-white/5" />
           <div className="h-8 rounded bg-white/5 w-2/3" />
           <div className="h-8 rounded bg-white/5" />
         </div>
       </aside>
     );
  }

  return (
    <aside
      style={{ background: 'var(--gp-sidebar)', borderRight: '1px solid var(--gp-border)' }}
      className={clsx(
        'flex flex-col h-screen sticky top-0 transition-all duration-300 z-40 flex-shrink-0',
        isCollapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--gp-border)' }}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
              <img src="/logo-branca.png" alt="Global Parts" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white leading-none truncate">Sistema de Compras</p>
              <p className="text-[10px] mt-0.5 font-semibold tracking-widest uppercase" style={{ color: 'var(--gp-blue-light)' }}>Global Parts</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto w-7 h-7 flex items-center justify-center">
            <img src="/logo-branca.png" alt="GP" className="w-full h-full object-contain" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            'w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200',
            isCollapsed && 'hidden'
          )}
          style={{ color: 'var(--gp-sidebar-text)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gp-sidebar-text-active)'; (e.currentTarget as HTMLElement).style.background = 'var(--gp-sidebar-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gp-sidebar-text)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* New Request CTA */}
      {!isCollapsed && (
        <div className="px-3 pt-4 pb-2">
          <NavLink
            to="/nova-solicitacao"
            onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[11px] font-bold tracking-wide uppercase text-white transition-all duration-200"
            style={{ background: 'var(--gp-blue)', boxShadow: 'var(--gp-shadow-blue)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-blue-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-blue)'; }}
          >
            <PlusCircle size={15} strokeWidth={2.5} />
            Nova Solicitação
          </NavLink>
        </div>
      )}

      {isCollapsed && (
        <div className="px-3 pt-4 pb-2">
          <NavLink
            to="/nova-solicitacao"
            className="flex items-center justify-center w-full h-9 rounded-lg transition-all duration-200 text-white"
            style={{ background: 'var(--gp-blue)' }}
            title="Nova Solicitação"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-blue-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-blue)'; }}
          >
            <PlusCircle size={16} strokeWidth={2.5} />
          </NavLink>
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2 space-y-4">
        {/* Main Menu */}
        <div>
          {!isCollapsed && (
            <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--gp-sidebar-text)' }}>
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
                    ? 'font-semibold'
                    : 'font-medium'
                )}
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
                  color: isActive ? 'var(--gp-blue-light)' : 'var(--gp-sidebar-text)',
                  borderLeft: isActive && !isCollapsed ? '2px solid var(--gp-blue)' : '2px solid transparent',
                })}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!el.className.includes('active')) {
                    el.style.background = 'var(--gp-sidebar-hover)';
                    el.style.color = 'var(--gp-sidebar-text-active)';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!el.className.includes('active')) {
                     el.style.background = 'transparent';
                     el.style.color = 'var(--gp-sidebar-text)';
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
                        style={{ background: 'var(--gp-blue-light)' }}
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
              <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--gp-sidebar-text)' }}>
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
                    color: isActive ? 'var(--gp-blue-light)' : 'var(--gp-sidebar-text)',
                    borderLeft: isActive && !isCollapsed ? '2px solid var(--gp-blue)' : '2px solid transparent',
                  })}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!el.className.includes('active')) {
                      el.style.background = 'var(--gp-sidebar-hover)';
                      el.style.color = 'var(--gp-sidebar-text-active)';
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!el.className.includes('active')) {
                       el.style.background = 'transparent';
                       el.style.color = 'var(--gp-sidebar-text)';
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
      <div className="px-2 pb-3 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--gp-border)' }}>
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center w-full h-9 rounded-lg transition-all duration-200 mb-1"
            style={{ color: 'var(--gp-sidebar-text)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gp-sidebar-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--gp-sidebar-text-active)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--gp-sidebar-text)'; }}
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
            color: isActive ? 'var(--gp-blue-light)' : 'var(--gp-sidebar-text)',
          })}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            if (!el.className.includes('active')) {
              el.style.background = 'var(--gp-sidebar-hover)';
              el.style.color = 'var(--gp-sidebar-text-active)';
            }
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            if (!el.className.includes('active')) {
               el.style.background = 'transparent';
               el.style.color = 'var(--gp-sidebar-text)';
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
