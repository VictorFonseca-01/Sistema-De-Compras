import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  Settings,
  LogOut
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const { profile } = useProfile();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The application will automatically redirect due to the session listener in MainLayout,
    // but we can also forcefully navigate or reload.
    window.location.href = '/login';
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: PlusCircle, label: 'Nova Solicitação', path: '/nova-solicitacao' },
    { icon: ListOrdered, label: 'Minhas Solicitações', path: '/solicitacoes' },
  ];

  if (profile?.role === 'master_admin' || profile?.role === 'ti' || profile?.role === 'diretoria') {
    navItems.push({
      icon: Settings,
      label: 'Painel Admin',
      path: '/admin'
    });
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo-branca.png" alt="Global Parts Logo" className="h-8 object-contain" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-primary-400">
          Compras TI
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
          Global Parts
        </p>
      </div>


      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              isActive 
                ? "bg-primary-600 text-white" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
