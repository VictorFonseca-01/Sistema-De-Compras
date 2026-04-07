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
      <div
        className={clsx("min-h-screen flex items-center justify-center", theme)}
        style={{ background: 'var(--gp-bg)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--gp-surface2)' }}
          >
            <img src="/logo-branca.png" alt="GP" className="w-7 h-7 object-contain opacity-60" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: 'var(--gp-blue)', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={clsx("flex h-screen overflow-hidden print:h-auto print:overflow-visible", theme)} style={{ background: 'var(--gp-bg)' }}>
      <Toaster position="top-right" toastOptions={{
        className: 'gp-toast',
        style: {
          background: 'var(--gp-surface2)',
          color: 'var(--gp-text)',
          border: '1px solid var(--gp-border)',
          borderRadius: '1rem',
          fontSize: '13px',
          fontWeight: '600'
        }
      }} />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] sm:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="print:hidden">
        <Sidebar 
          theme={theme} 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 sm:pb-0 print:overflow-visible print:bg-white">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none min-w-0">
            <Outlet />
          </div>
        </main>
        
        {/* Mobile App Navigation */}
        <BottomNavigation onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </div>
  );
}
