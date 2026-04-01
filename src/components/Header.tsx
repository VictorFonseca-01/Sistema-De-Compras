import { 
  Bell, 
  Search, 
  LogOut, 
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';

export function Header() {
  const { profile } = useProfile();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
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
        <div className="relative max-w-md w-full hidden md:block">
          <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar solicitações..." 
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

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
