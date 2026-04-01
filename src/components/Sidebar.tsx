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
  ShieldCheck,
  HardDrive,
  UserCheck,
  Truck
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { clsx } from 'clsx';

export function Sidebar() {
  const { profile } = useProfile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: PlusCircle, label: 'Nova Solicitação', path: '/nova-solicitacao' },
    { icon: ListOrdered, label: 'Minhas Solicitações', path: '/solicitacoes' },
  ];

  // Adiciona seção de Aprovações para quem tem poder de decisão
  if (profile?.role === 'master_admin' || profile?.role === 'gestor' || profile?.role === 'ti' || profile?.role === 'diretoria') {
    navItems.push({ 
      icon: UserCheck, 
      label: 'Fila de Aprovação', 
      path: '/solicitacoes' // Por enquanto usa a mesma lista, mas com filtros diferentes aplicados no futuro
    });
  }

  // Seções específicas por área (Conforme solicitado SaaS Admin)
  const adminItems = [];
  if (profile?.role === 'master_admin' || profile?.role === 'ti') {
    adminItems.push({ icon: HardDrive, label: 'Estoque / TI', path: '/estoque' });
    adminItems.push({ icon: Truck, label: 'Entregar Ativo', path: '/entregar' });
    adminItems.push({ icon: Users, label: 'Usuários', path: '/admin' });
  }

  return (
    <aside 
      className={clsx(
        "bg-slate-900 text-slate-400 flex flex-col h-screen sticky top-0 transition-all duration-300 z-40 border-r border-slate-800",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between overflow-hidden">
        <div className={clsx("flex items-center gap-3 min-w-0 transition-opacity", isCollapsed ? "opacity-0 invisible" : "opacity-100 visible")}>
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
             <ShieldCheck className="text-white" size={20} />
          </div>
          <div className="truncate">
            <h1 className="text-lg font-bold text-white leading-tight">Compras TI</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Global Parts</p>
          </div>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            "p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Section */}
      <div className="flex-1 px-3 py-4 space-y-8 overflow-y-auto no-scrollbar">
        <div>
          {!isCollapsed && <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500/60">Menu Principal</p>}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  isActive 
                    ? "bg-primary-600/10 text-primary-400 font-semibold" 
                    : "hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <item.icon size={20} className={clsx("shrink-0", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span>{item.label}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                    {item.label}
                  </div>
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
                   className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                    isActive && item.path === '/admin' ? "text-primary-400" : "hover:bg-slate-800/50 hover:text-white"
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
          className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <Settings size={20} className={clsx("shrink-0", isCollapsed && "mx-auto")} />
          {!isCollapsed && <span className="font-semibold text-sm">Configurações</span>}
        </NavLink>
      </div>
    </aside>
  );
}
