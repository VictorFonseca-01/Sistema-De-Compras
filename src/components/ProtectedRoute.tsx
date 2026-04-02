import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-gp-bg flex justify-center items-center text-gp-text3 font-medium">
        Verificando permissões...
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    // Redireciona para o dashboard se não tiver permissão
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
