import { useAuth } from '@/hooks/useAuth';

interface RoleGateProps {
    children: React.ReactNode;
    roles?: string[];
    permissions?: string[];
    fallback?: React.ReactNode;
}

export function RoleGate({
    children,
    roles,
    permissions,
    fallback = null,
}: RoleGateProps) {
    const { hasRole, hasPermission } = useAuth();

    // Check roles
    if (roles && roles.length > 0 && !hasRole(roles)) {
        return <>{fallback}</>;
    }

    // Check permissions
    if (permissions && permissions.length > 0) {
        const hasRequired = permissions.some((p) => hasPermission(p));
        if (!hasRequired) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}

// Convenience components
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
    return <RoleGate roles={['admin']} fallback={fallback}>{children}</RoleGate>;
}

export function ManagerOrAdmin({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
    return <RoleGate roles={['admin', 'manager']} fallback={fallback}>{children}</RoleGate>;
}

export function CanEdit({
    entity,
    children,
    fallback = null
}: {
    entity: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    return (
        <RoleGate
            permissions={[`${entity}:create`, `${entity}:update`]}
            fallback={fallback}
        >
            {children}
        </RoleGate>
    );
}
