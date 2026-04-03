import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-gp-bg flex flex-col justify-center items-center gap-4 animate-fade-up">
        <div className="w-10 h-10 border-4 border-gp-blue/20 border-t-gp-blue rounded-full animate-spin" />
        <span className="text-gp-text3 font-bold text-[11px] uppercase tracking-widest">Sincronizando Permissões...</span>
      </div>
    );
  }

  // Se carregou e não achou perfil ou permissão é insuficiente
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" state={{ accessDenied: true }} replace />;
  }

  return <Outlet />;
}
