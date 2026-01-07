import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];
    permissions?: string[];
    fallback?: React.ReactNode;
}

export function ProtectedRoute({
    children,
    roles,
    permissions,
    fallback,
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
    const location = useLocation();

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role requirements
    if (roles && roles.length > 0 && !hasRole(roles)) {
        return fallback || <UnauthorizedPage />;
    }

    // Check permission requirements
    if (permissions && permissions.length > 0) {
        const hasRequired = permissions.some((p) => hasPermission(p));
        if (!hasRequired) {
            return fallback || <UnauthorizedPage />;
        }
    }

    return <>{children}</>;
}

function UnauthorizedPage() {
    const { user } = useAuth();

    return (
        <div className="flex h-full flex-col items-center justify-center p-8">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
                Your role ({user?.role}) does not have access to this page.
            </p>
            <a href="/dashboard" className="mt-4 text-primary hover:underline">
                Go to Dashboard
            </a>
        </div>
    );
}
