import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/GlobalSidebar';
import { Header } from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';
import { Toaster } from 'react-hot-toast';
import { BottomNavigation } from '../components/BottomNavigation';

export function MainLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className={clsx("min-h-screen flex flex-col items-center justify-center bg-gp-bg", theme)} data-theme={theme}>
        <div className="flex flex-col items-center gap-8 animate-fade-in">
          <div className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center bg-gp-surface2 border border-gp-border shadow-2xl relative group">
            <div className="absolute inset-0 bg-gp-blue/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <img 
              src={theme === 'light' ? '/logo-preta.png' : '/logo-branca.png'} 
              alt="GP" 
              className={clsx(
                "w-10 h-10 object-contain transition-all duration-700",
                theme === 'dark' && "animate-pulse-short"
              )} 
            />
          </div>
          <div className="flex flex-col items-center gap-4">
             <p className="text-[10px] font-black text-gp-muted uppercase tracking-[0.4em] opacity-40">Global Parts Intelligence</p>
             <div className="flex gap-2">
               {[0, 1, 2].map(i => (
                 <div
                   key={i}
                   className="w-1.5 h-1.5 rounded-full bg-gp-blue"
                   style={{ 
                     animation: 'gp-bounce 1.4s infinite ease-in-out both',
                     animationDelay: `${i * 0.16}s` 
                   }}
                 />
               ))}
             </div>
          </div>
        </div>
        <style>{`
          @keyframes gp-bounce {
            0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
            40% { transform: scale(1.0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div 
      className={clsx(
        "flex h-screen overflow-hidden print:h-auto print:overflow-visible transition-colors duration-500 bg-gp-bg text-gp-text font-sans selection:bg-gp-blue/30 selection:text-white", 
        theme
      )} 
      data-theme={theme}
    >
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          className: 'gp-toast-premium',
          style: {
            background: 'var(--gp-surface)',
            color: 'var(--gp-text)',
            border: '1px solid var(--gp-border)',
            borderRadius: '1.25rem',
            padding: '16px 24px',
            fontSize: '13px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4)',
          }
        }} 
      />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gp-bg/80 backdrop-blur-md z-[65] lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="print:hidden">
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      </div>

      {/* Main Structural Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden print:overflow-visible relative">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-gp-blue/5 rounded-full blur-[140px] pointer-events-none -translate-y-1/2 translate-x-1/4" />

        <div className="print:hidden relative z-40">
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        </div>

        <main className="flex-1 overflow-y-auto custom-scrollbar pb-40 lg:pb-0 print:overflow-visible bg-transparent relative z-10">
          <div className="max-w-7xl mx-auto p-4 sm:p-8 lg:p-12 print:p-0 print:max-w-none transition-all">
            <Outlet />
          </div>
          
        </main>
        
        {/* Mobile Ecosystem Navigation */}
        <div className="print:hidden">
          <BottomNavigation onMenuClick={() => setIsMobileMenuOpen(true)} />
        </div>
      </div>
    </div>
  );
}
