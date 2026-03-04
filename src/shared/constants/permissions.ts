/**
 * Rol-bazlı izin matrisi.
 * '*' → tüm izinlere sahip (CEO).
 * İzin formatı: RESOURCE:ACTION
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    CEO: ['*'],

    MANAGER: [
        'users:read', 'users:update',
        'projects:create', 'projects:read', 'projects:update', 'projects:delete',
        'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
        'finance:view_revenue',
    ],

    ACCOUNTING: [
        'users:read',
        'projects:read',
        'finance:view_revenue', 'finance:create_invoice',
    ],

    DEVELOPER: [
        'projects:read',
        'tasks:read', 'tasks:update',
    ],

    SOCIAL_MEDIA: [
        'projects:read',
        'tasks:read', 'tasks:update',
    ],

    CREATIVE: [
        'projects:read',
        'tasks:read', 'tasks:update',
    ],

    MARKETING: [
        'projects:read',
        'tasks:read', 'tasks:update',
    ],

    PRODUCTION: [
        'projects:read',
        'tasks:read', 'tasks:update',
    ],

    ACCOUNT_MANAGER: [
        'users:read',
        'projects:read', 'projects:create', 'projects:update',
        'tasks:create', 'tasks:read', 'tasks:update',
    ],

    HR: [
        'users:create', 'users:read', 'users:update',
    ],

    CLIENT: [],
} as const;
