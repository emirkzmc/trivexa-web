import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore';

interface RoleGuardProps {
    roles: string[];
    children: React.ReactNode;
}

/**
 * Kullanıcının rolü izin verilen listede yoksa /404'e yönlendirir.
 * 403 değil 404 gösterir → sayfa varlığını gizler.
 */
export function RoleGuard({ roles, children }: RoleGuardProps) {
    const userRole = useAuthStore((s) => s.user?.role);

    if (!userRole || !roles.includes(userRole)) {
        return <Navigate to="/404" replace />;
    }

    return <>{children}</>;
}
