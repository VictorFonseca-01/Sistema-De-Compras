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
      className="sm:hidden fixed bottom-0 left-0 right-0 h-[72px] pb-[env(safe-area-inset-bottom)] bg-gp-header border-t border-gp-border flex items-center justify-around px-2 z-[60] backdrop-blur-xl transition-all duration-300"
      style={{
        background: 'rgba(var(--gp-header-rgb, 15, 23, 42), 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 20px -5px rgba(0,0,0,0.3)'
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none group',
              item.isCenter ? 'relative -top-3' : 'flex-1'
            )}
          >
            <div className={clsx(
              'flex items-center justify-center rounded-xl transition-all duration-300',
              item.isCenter ? 'w-14 h-14 bg-gp-blue text-white shadow-lg shadow-gp-blue/30 scale-100 active:scale-95' : 'w-10 h-10',
              !item.isCenter && isActive ? 'text-gp-blue bg-gp-blue/10' : !item.isCenter && 'text-gp-text3 group-active:scale-90'
            )}>
              <Icon 
                size={item.isCenter ? 28 : 20} 
                strokeWidth={isActive || item.isCenter ? 2.5 : 2} 
              />
            </div>
            {!item.isCenter && (
              <span className={clsx(
                'text-[10px] font-bold tracking-tight transition-colors',
                isActive ? 'text-gp-blue' : 'text-gp-text3'
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
