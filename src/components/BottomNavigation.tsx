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
    { label: 'Início', icon: Home, path: '/', id: 'nav-home' },
    { label: 'Pedidos', icon: ClipboardList, path: '/solicitacoes', id: 'nav-requests' },
    { label: 'Novo', icon: PlusCircle, path: '/solicitacoes/nova', id: 'nav-new', isCenter: true },
    { label: 'Estoque', icon: Box, path: '/estoque', id: 'nav-inventory' },
    { label: 'Mais', icon: Menu, onClick: onMenuClick, id: 'nav-more' },
  ];

  return (
    <nav 
      className="sm:hidden fixed bottom-0 left-0 right-0 h-[80px] pb-[env(safe-area-inset-bottom)] bg-gp-header border-t border-gp-border flex items-center justify-around px-2 z-[60] backdrop-blur-xl transition-all duration-300"
      style={{
        background: 'rgba(var(--gp-header-rgb, 15, 23, 42), 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -10px 30px -10px rgba(0,0,0,0.5)'
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(5);
              item.onClick ? item.onClick() : navigate(item.path!);
            }}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none group flex-1 h-full active:scale-95 touch-manipulation',
              item.isCenter && 'relative -top-4 overflow-visible'
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={clsx(
              'flex items-center justify-center rounded-xl transition-all duration-300',
              item.isCenter 
                ? 'w-15 h-15 bg-gp-blue text-white shadow-xl shadow-gp-blue/40 ring-4 ring-gp-header' 
                : 'w-11 h-11',
              !item.isCenter && isActive ? 'text-gp-blue bg-gp-blue/15' : !item.isCenter && 'text-gp-text3'
            )}>
              <Icon 
                size={item.isCenter ? 30 : 22} 
                strokeWidth={isActive || item.isCenter ? 2.5 : 2} 
              />
            </div>
            {!item.isCenter && (
              <span className={clsx(
                'text-[10px] font-bold tracking-tight transition-colors mt-0.5 uppercase',
                isActive ? 'text-gp-blue' : 'text-gp-text3 opacity-60'
              )}>
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
