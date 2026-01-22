import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseAvailable } from '@/lib/supabase';
import { Loop } from '@mui/icons-material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Se Supabase não estiver disponível, permitir acesso livre
  if (!isSupabaseAvailable) {
    return <>{children}</>;
  }

  // Exibir loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loop className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Bloquear usuário inativo
  if (profile && profile.is_active === false) {
    return <Navigate to="/login?reason=inactive" replace />;
  }

  // Verificar se é admin quando necessário
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
