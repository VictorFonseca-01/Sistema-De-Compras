import { Home, ClipboardList, PlusCircle, Box, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

interface BottomNavigationProps {
  onMenuClick: () => void;
}

export function BottomNavigation({ onMenuClick }: BottomNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'HUB', icon: Home, path: '/', id: 'nav-home' },
    { label: 'OS', icon: ClipboardList, path: '/solicitacoes', id: 'nav-requests' },
    { label: 'NOVO', icon: PlusCircle, path: '/solicitacoes/nova', id: 'nav-new', isCenter: true },
    { label: 'ASSETS', icon: Box, path: '/estoque', id: 'nav-inventory' },
    { label: 'MAIS', icon: Menu, onClick: onMenuClick, id: 'nav-more' },
  ];

  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 h-[88px] pb-[env(safe-area-inset-bottom)] bg-gp-bg/80 backdrop-blur-2xl border-t border-gp-border/50 flex items-center justify-around px-4 z-[90] shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.4)] transition-all duration-500"
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(8);
              item.onClick ? item.onClick() : navigate(item.path!);
            }}
            className={clsx(
              'flex flex-col items-center justify-center transition-all duration-300 outline-none flex-1 h-full active:scale-90 touch-manipulation relative group',
              item.isCenter && 'overflow-visible'
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={clsx(
              'flex items-center justify-center rounded-2xl transition-all duration-500 border border-transparent',
              item.isCenter 
                ? 'w-16 h-16 bg-gp-blue text-white shadow-[0_12px_24px_-4px_rgba(59,130,246,0.5)] -translate-y-6 scale-110 active:scale-100 hover:rotate-6' 
                : 'w-12 h-12',
              !item.isCenter && isActive ? 'text-gp-blue bg-gp-blue/10 border-gp-blue/20 shadow-lg shadow-gp-blue/10' : !item.isCenter && 'text-gp-muted hover:text-gp-text'
            )}>
              <Icon 
                size={item.isCenter ? 32 : 20} 
                strokeWidth={isActive || item.isCenter ? 3 : 2.5} 
                className={clsx(isActive && "animate-pulse-short")}
              />
              
              {isActive && !item.isCenter && (
                 <div className="absolute top-0 w-1 h-1 bg-gp-blue rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </div>
            
            {!item.isCenter && (
              <span className={clsx(
                'text-[9px] font-black tracking-[0.2em] transition-all mt-1 uppercase leading-none',
                isActive ? 'text-gp-blue opacity-100' : 'text-gp-muted opacity-40 group-hover:opacity-100 group-hover:text-gp-text'
              )}>
                {item.label}
              </span>
            )}
            
            {item.isCenter && (
               <div className="absolute -bottom-1 w-6 h-1 bg-gp-blue/20 rounded-full blur-sm" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
