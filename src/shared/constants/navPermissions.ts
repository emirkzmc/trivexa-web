export const PROJECT_PERMS = ['PROJECTS_READ', 'PROJECTS_CREATE', 'PROJECTS_UPDATE', 'PROJECTS_DELETE'];
export const TASK_PERMS = ['TASKS_READ', 'TASKS_CREATE', 'TASKS_UPDATE', 'TASKS_DELETE'];
export const USER_PERMS = ['USERS_READ', 'USERS_CREATE', 'USERS_UPDATE', 'USERS_DELETE'];
export const CLIENT_PERMS = ['CLIENTS_READ', 'CLIENTS_CREATE', 'CLIENTS_UPDATE', 'CLIENTS_DELETE'];
export const INVOICE_PERMS = ['INVOICES_READ', 'INVOICES_CREATE', 'INVOICES_UPDATE', 'INVOICES_DELETE'];
export const PAYMENT_PERMS = ['PAYMENTS_READ', 'PAYMENTS_CREATE'];
export const EXPENSE_PERMS = ['EXPENSES_READ', 'EXPENSES_CREATE', 'EXPENSES_UPDATE', 'EXPENSES_APPROVE'];
export const CONTRACT_PERMS = ['CONTRACTS_READ', 'CONTRACTS_CREATE', 'CONTRACTS_UPDATE', 'CONTRACTS_APPROVE'];
export const MEETING_PERMS = ['MEETINGS_READ', 'MEETINGS_CREATE', 'MEETINGS_UPDATE', 'MEETINGS_DELETE'];
export const FILE_PERMS = ['FILES_READ', 'FILES_UPLOAD', 'FILES_DELETE'];
export const TICKET_PERMS = ['TICKETS_READ', 'TICKETS_CREATE', 'TICKETS_UPDATE', 'TICKETS_DELETE'];
export const TIME_PERMS = ['TIME_ENTRIES_READ', 'TIME_ENTRIES_CREATE', 'TIME_ENTRIES_UPDATE', 'TIME_ENTRIES_DELETE', 'TIME_ENTRIES_APPROVE'];

export const NAV_PERMISSION_MAP: Record<string, string[] | string> = {
    '/app/notifications': 'NOTIFICATIONS_READ',
    '/app/personel': USER_PERMS,
    '/app/departmanlar': USER_PERMS,
    '/app/departman-atamalari': USER_PERMS,
    '/app/musteriler': CLIENT_PERMS,
    '/app/musterilerim': CLIENT_PERMS,
    '/app/projeler': PROJECT_PERMS,
    '/app/projelerim': PROJECT_PERMS,
    '/app/gorevler': TASK_PERMS,
    '/app/gorevlerim': TASK_PERMS,
    '/app/icerik-plani': TASK_PERMS,
    '/app/kampanyalar': TASK_PERMS,
    '/app/tasarim': TASK_PERMS,
    '/app/produksiyon': TASK_PERMS,
    '/app/kod': PROJECT_PERMS,
    '/app/talepler': TICKET_PERMS,
    '/app/portal-talepleri': TICKET_PERMS,
    '/app/gorusme-talepleri': MEETING_PERMS,
    '/app/gorusmeler': MEETING_PERMS,
    '/app/personel-toplantilari': MEETING_PERMS,
    '/app/toplanti-takvimi': MEETING_PERMS,
    '/app/finans': [...PAYMENT_PERMS, ...INVOICE_PERMS, ...EXPENSE_PERMS],
    '/app/finans-dashboard': [...PAYMENT_PERMS, ...INVOICE_PERMS, ...EXPENSE_PERMS],
    '/app/faturalar': INVOICE_PERMS,
    '/app/tahsilat-takibi': PAYMENT_PERMS,
    '/app/gider-yonetimi': EXPENSE_PERMS,
    '/app/banka-mutabakat': PAYMENT_PERMS,
    '/app/musteri-ekstresi': PAYMENT_PERMS,
    '/app/vergi-beyan': EXPENSE_PERMS,
    '/app/puantaj': [...TIME_PERMS, ...USER_PERMS],
    '/app/sozlesmeler': CONTRACT_PERMS,
    '/app/dosyalar': FILE_PERMS,
    '/app/dosyalarim': FILE_PERMS,
    '/app/audit-log': 'AUDIT_READ',
    '/app/iletisim-talepleri': CLIENT_PERMS,
    '/app/izin-yonetimi': USER_PERMS,
    '/app/calisma-suresi': TIME_PERMS,
    '/app/performans': USER_PERMS,
};

export const NAV_DEPARTMENT_MAP: Record<string, string[]> = {
    '/app/finans': ['FINANCE'],
    '/app/finans-dashboard': ['FINANCE'],
    '/app/faturalar': ['FINANCE'],
    '/app/tahsilat-takibi': ['FINANCE'],
    '/app/gider-yonetimi': ['FINANCE'],
    '/app/banka-mutabakat': ['FINANCE'],
    '/app/musteri-ekstresi': ['FINANCE'],
    '/app/vergi-beyan': ['FINANCE'],
    '/app/puantaj': ['FINANCE', 'HR'],
    '/app/sozlesmeler': ['FINANCE'],
    '/app/icerik-plani': ['MARKETING'],
    '/app/kampanyalar': ['MARKETING'],
    '/app/tasarim': ['DESIGN'],
    '/app/produksiyon': ['PRODUCTION'],
    '/app/kod': ['DEVELOPMENT'],
    '/app/izin-yonetimi': ['HR'],
    '/app/calisma-suresi': ['HR'],
    '/app/performans': ['HR'],
    '/app/departman-atamalari': ['HR'],
};
