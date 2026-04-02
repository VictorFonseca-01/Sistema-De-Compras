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
  const { profile } = useProfile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ListOrdered, label: 'Minhas Solicitações', path: '/solicitacoes' },
  ];

  // Adiciona seção de Estoque/Patrimônio
  if (profile?.role === 'master_admin' || profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'gestor' || profile?.role === 'diretoria') {
    navItems.push({
      icon: Warehouse,
      label: 'Estoque',
      path: '/estoque'
    });
  }

  // Adiciona seção de Aprovações para quem tem poder de decisão
  if (profile?.role === 'master_admin' || profile?.role === 'gestor' || profile?.role === 'ti' || profile?.role === 'diretoria') {
    navItems.push({ 
      icon: UserCheck, 
      label: 'Fila de Aprovação', 
      path: '/solicitacoes' 
    });
  }

  // Seções específicas por área (Limpeza para Sistema de Compras original)
  const adminItems = [];
  if (profile?.role === 'master_admin') {
    adminItems.push({ icon: Users, label: 'Usuários', path: '/admin' });
  }

  return (
    <aside 
      className={clsx(
        "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 flex flex-col h-screen sticky top-0 transition-all duration-300 z-40 border-r border-slate-200 dark:border-slate-800",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between overflow-hidden">
        <div className={clsx("flex items-center gap-3 transition-opacity duration-500", isCollapsed ? "opacity-0 invisible" : "opacity-100 visible")}>
          <div className="flex items-center justify-center shrink-0">
             <img src="/logo-branca.png" alt="Logo" className="h-9 object-contain dark:brightness-100 brightness-0 contrast-125 transition-all duration-300" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[17px] font-black text-slate-900 dark:text-white leading-none tracking-tight">Sistema de Compras</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 font-black mt-1">Global Parts</p>
          </div>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Section */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto no-scrollbar">
        {!isCollapsed && (
          <div className="px-3 mb-6">
            <NavLink 
              to="/nova-solicitacao"
              onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-[11px] tracking-widest transition-all shadow-lg shadow-primary-500/20 active:scale-95 group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
              <PlusCircle size={18} strokeWidth={3} className="relative z-10" />
              <span className="relative z-10 uppercase">Nova Solicitação</span>
            </NavLink>
          </div>
        )}

        <div>
          {!isCollapsed && <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500/60">Menu Principal</p>}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={clsx("shrink-0 transition-transform group-hover:scale-110", isCollapsed && "mx-auto", isActive && "text-primary-600 dark:text-primary-500")} />
                    {!isCollapsed && <span>{item.label}</span>}
                    {isActive && !isCollapsed && (
                      <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 animate-in fade-in zoom-in duration-300"></span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {adminItems.length > 0 && (
          <div>
            {!isCollapsed && <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500/60">Administração</p>}
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
                   className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group",
                    isActive && item.path === '/admin' ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon size={20} className={clsx("shrink-0", isCollapsed && "mx-auto")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-800 mt-auto">
        <NavLink 
          to="/configuracoes"
          onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
          className={({ isActive }) => clsx(
            "flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all duration-300",
            isActive 
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Settings size={20} className={clsx("shrink-0", isCollapsed && "mx-auto")} />
          {!isCollapsed && <span className="font-semibold text-sm">Configurações</span>}
        </NavLink>
      </div>
    </aside>
  );
}
