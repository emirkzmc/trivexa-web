/**
 * Rol-bazlı izin matrisi.
 * '*' → tüm izinlere sahip (CEO).
 * İzin formatı: RESOURCE:ACTION
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    CEO: ['*'],
    ADMIN: ['*'],

    MANAGER: [
        'USERS_READ', 'USERS_UPDATE',
        'PROJECTS_CREATE', 'PROJECTS_READ', 'PROJECTS_UPDATE', 'PROJECTS_DELETE',
        'TASKS_CREATE', 'TASKS_READ', 'TASKS_UPDATE', 'TASKS_DELETE',
        'PAYMENTS_READ', 'INVOICES_READ',
    ],

    ACCOUNTING: [
        'USERS_READ',
        'PROJECTS_READ',
        'PAYMENTS_READ', 'INVOICES_READ', 'INVOICES_CREATE',
    ],

    DEVELOPER: [
        'PROJECTS_READ',
        'TASKS_READ', 'TASKS_UPDATE',
    ],

    SOCIAL_MEDIA: [
        'PROJECTS_READ',
        'TASKS_READ', 'TASKS_UPDATE',
    ],

    CREATIVE: [
        'PROJECTS_READ',
        'TASKS_READ', 'TASKS_UPDATE',
    ],

    MARKETING: [
        'PROJECTS_READ',
        'TASKS_READ', 'TASKS_UPDATE',
    ],

    PRODUCTION: [
        'PROJECTS_READ',
        'TASKS_READ', 'TASKS_UPDATE',
    ],

    ACCOUNT_MANAGER: [
        'USERS_READ',
        'PROJECTS_READ', 'PROJECTS_CREATE', 'PROJECTS_UPDATE',
        'TASKS_CREATE', 'TASKS_READ', 'TASKS_UPDATE',
    ],

    HR: [
        'USERS_CREATE', 'USERS_READ', 'USERS_UPDATE',
    ],

    CLIENT: [],
} as const;
