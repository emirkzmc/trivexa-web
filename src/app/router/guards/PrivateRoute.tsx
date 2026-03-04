import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore';

/**
 * Token yoksa /login'e yönlendirir.
 * Token varsa children (Outlet) render eder.
 */
export function PrivateRoute() {
    const token = useAuthStore((s) => s.token);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
