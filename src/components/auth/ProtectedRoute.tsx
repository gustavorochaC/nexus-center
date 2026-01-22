import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    fallbackPath?: string;
}

/**
 * ProtectedRoute - Protege rotas baseado em autenticação e role
 * 
 * @param children - Componentes filhos a serem renderizados se autorizado
 * @param requireAdmin - Se true, exige que o usuário seja admin
 * @param fallbackPath - Path para redirecionamento se não autorizado (default: /dashboard)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAdmin = false,
    fallbackPath = '/dashboard'
}) => {
    const { user, profile, isLoading } = useAuth();
    const location = useLocation();

    // Ainda carregando - mostrar loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Não autenticado - redirecionar para login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Requer admin mas usuário não é admin
    if (requireAdmin && profile?.role !== 'admin') {
        console.warn('ProtectedRoute: Acesso admin negado para:', user.email);
        return <Navigate to={fallbackPath} replace />;
    }

    return <>{children}</>;
};

/**
 * AdminOnly - Wrapper para renderização condicional de conteúdo admin
 * Não redireciona, apenas esconde o conteúdo
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { profile, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (profile?.role !== 'admin') {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
