import { useAuthStore } from '../../features/auth/store/authStore';
import { ROLE_PERMISSIONS } from '../constants/permissions';

/**
 * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder.
 * CEO rolü her zaman true döner ('*' wildcard).
 * Sidebar ve UI elemanlarında yetkisiz öğeleri gizlemek için kullanılır.
 */
export function usePermission() {
    const role = useAuthStore((s) => s.user?.role);

    function hasPermission(permission: string): boolean {
        if (!role) return false;

        const permissions = ROLE_PERMISSIONS[role];
        if (!permissions) return false;

        // Wildcard — CEO
        if (permissions.includes('*')) return true;

        return permissions.includes(permission);
    }

    function hasAnyPermission(perms: string[]): boolean {
        return perms.some(hasPermission);
    }

    function hasAllPermissions(perms: string[]): boolean {
        return perms.every(hasPermission);
    }

    return { hasPermission, hasAnyPermission, hasAllPermissions };
}
