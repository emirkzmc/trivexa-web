import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../features/auth/store/authStore';
import { getMyPermissions } from '../../features/roles/api/roles.api';
import { ROLE_PERMISSIONS } from '../constants/permissions';
import { normalizeRoleKey } from '../utils/roleUtils';

function normalizePermission(value: string): string {
    if (!value) return '';
    if (value === '*') return '*';
    if (value.includes(':')) {
        return value.replace(/:/g, '_').replace(/-/g, '_').toUpperCase();
    }
    return value.toUpperCase();
}

function extractPermissionValues(raw: unknown): string[] {
    if (Array.isArray(raw)) {
        return raw.flatMap((item) => {
            if (typeof item === 'string') return [item];
            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>;
                const id = typeof record.id === 'string' ? record.id : undefined;
                const name = typeof record.name === 'string' ? record.name : undefined;
                return [id, name].filter((val): val is string => Boolean(val));
            }
            return [];
        });
    }

    if (raw && typeof raw === 'object') {
        const record = raw as Record<string, unknown>;
        if (Array.isArray(record.permissions)) {
            return extractPermissionValues(record.permissions);
        }
        if (Array.isArray(record.data)) {
            return extractPermissionValues(record.data);
        }
    }

    return [];
}

/**
 * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder.
 * CEO rolü her zaman true döner ('*' wildcard).
 * Sidebar ve UI elemanlarında yetkisiz öğeleri gizlemek için kullanılır.
 */
export function usePermission() {
    const role = useAuthStore((s) => s.user?.role);
    const normalizedRole = normalizeRoleKey(role);
    const fallbackRole = normalizedRole === 'SEO'
        ? 'SOCIAL_MEDIA'
        : (normalizedRole.includes('MUHASEBE') ? 'ACCOUNTING' : normalizedRole);

    const permissionsQuery = useQuery({
        queryKey: ['my-permissions', normalizedRole],
        queryFn: getMyPermissions,
        enabled: Boolean(role),
        retry: false,
        staleTime: 60_000,
        refetchOnWindowFocus: true,
    });

    const dynamicPermissions = useMemo(() => {
        const values = extractPermissionValues(permissionsQuery.data);
        return values.map(normalizePermission).filter(Boolean);
    }, [permissionsQuery.data]);

    const fallbackPermissions = useMemo(() => {
        const items = ROLE_PERMISSIONS[fallbackRole] ?? [];
        return items.map(normalizePermission);
    }, [fallbackRole]);

    const shouldUseFallback = !role
        || permissionsQuery.isError
        || permissionsQuery.data === undefined
        || (dynamicPermissions.length === 0 && fallbackPermissions.length > 0);
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
