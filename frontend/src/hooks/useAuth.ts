import { useAuthStore } from '@/store/authStore';
import { useCallback, useMemo } from 'react';

export function useAuth() {
    const store = useAuthStore();

    const hasPermission = useCallback((permission: string) => {
        return store.permissions.includes(permission);
    }, [store.permissions]);

    const hasRole = useCallback((roles: string | string[]) => {
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return store.user ? roleArray.includes(store.user.role) : false;
    }, [store.user]);

    const isAdmin = useMemo(() => store.user?.role === 'admin', [store.user]);
    const isManager = useMemo(() =>
        ['admin', 'manager'].includes(store.user?.role || ''), [store.user]);

    return {
        user: store.user,
        token: store.token,
        isAuthenticated: store.isAuthenticated,
        isLoading: store.isLoading,
        error: store.error,
        permissions: store.permissions,
        login: store.login,
        logout: store.logout,
        refreshUser: store.refreshUser,
        hasPermission,
        hasRole,
        isAdmin,
        isManager,
    };
}
