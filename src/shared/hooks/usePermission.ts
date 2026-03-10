import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../features/auth/store/authStore';
import { getMyPermissions } from '../../features/roles/api/roles.api';
import { ROLE_PERMISSIONS } from '../constants/permissions';

function normalizePermission(value: string): string {
    if (!value) return '';
    if (value === '*') return '*';
    if (value.includes(':')) {
        return value.replace(/:/g, '_').replace(/-/g, '_').toUpperCase();
    }
    return value.toUpperCase();
}

/**
 * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder.
 * CEO rolü her zaman true döner ('*' wildcard).
 * Sidebar ve UI elemanlarında yetkisiz öğeleri gizlemek için kullanılır.
 */
export function usePermission() {
    const role = useAuthStore((s) => s.user?.role);
    const normalizedRole = String(role ?? '').toUpperCase();

    const permissionsQuery = useQuery({
        queryKey: ['my-permissions', normalizedRole],
        queryFn: getMyPermissions,
        enabled: Boolean(role),
        retry: false,
        staleTime: 60_000,
        refetchOnWindowFocus: true,
    });

    const dynamicPermissions = useMemo(() => {
        const items = permissionsQuery.data ?? [];
        return items
            .map((perm) => perm.id || perm.name)
            .filter((perm): perm is string => Boolean(perm))
            .map(normalizePermission);
    }, [permissionsQuery.data]);

    const fallbackPermissions = useMemo(() => {
        const items = ROLE_PERMISSIONS[normalizedRole] ?? [];
        return items.map(normalizePermission);
    }, [normalizedRole]);

    const shouldUseFallback = !role || permissionsQuery.isError || permissionsQuery.data === undefined;
    const effectivePermissions = shouldUseFallback ? fallbackPermissions : dynamicPermissions;
    const permissionSet = useMemo(() => new Set(effectivePermissions), [effectivePermissions]);

    function hasPermission(permission: string): boolean {
        if (!role) return false;
        if (normalizedRole === 'ADMIN') return true;
        if (permissionSet.has('*')) return true;
        return permissionSet.has(normalizePermission(permission));
    }

    function hasAnyPermission(perms: string[]): boolean {
        if (normalizedRole === 'ADMIN') return true;
        return perms.some(hasPermission);
    }

    function hasAllPermissions(perms: string[]): boolean {
        if (normalizedRole === 'ADMIN') return true;
        return perms.every(hasPermission);
    }

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        permissions: effectivePermissions,
        isLoading: permissionsQuery.isLoading,
        source: shouldUseFallback ? 'static' : 'dynamic',
    };
}
