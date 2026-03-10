const PROJECT_PERMS = ['PROJECTS_READ', 'PROJECTS_CREATE', 'PROJECTS_UPDATE', 'PROJECTS_DELETE'];
const TASK_PERMS = ['TASKS_READ', 'TASKS_CREATE', 'TASKS_UPDATE', 'TASKS_DELETE'];
const USER_PERMS = ['USERS_READ', 'USERS_CREATE', 'USERS_UPDATE', 'USERS_DELETE'];
const CLIENT_PERMS = ['CLIENTS_READ', 'CLIENTS_CREATE', 'CLIENTS_UPDATE', 'CLIENTS_DELETE'];
const INVOICE_PERMS = ['INVOICES_READ', 'INVOICES_CREATE', 'INVOICES_UPDATE', 'INVOICES_DELETE'];
const PAYMENT_PERMS = ['PAYMENTS_READ', 'PAYMENTS_CREATE'];
const EXPENSE_PERMS = ['EXPENSES_READ', 'EXPENSES_CREATE', 'EXPENSES_UPDATE', 'EXPENSES_APPROVE'];
const CONTRACT_PERMS = ['CONTRACTS_READ', 'CONTRACTS_CREATE', 'CONTRACTS_UPDATE', 'CONTRACTS_APPROVE'];
const MEETING_PERMS = ['MEETINGS_READ', 'MEETINGS_CREATE', 'MEETINGS_UPDATE', 'MEETINGS_DELETE'];
const FILE_PERMS = ['FILES_READ', 'FILES_UPLOAD', 'FILES_DELETE'];
const TICKET_PERMS = ['TICKETS_READ', 'TICKETS_CREATE', 'TICKETS_UPDATE', 'TICKETS_DELETE'];
const TIME_PERMS = ['TIME_ENTRIES_READ', 'TIME_ENTRIES_CREATE', 'TIME_ENTRIES_UPDATE', 'TIME_ENTRIES_DELETE', 'TIME_ENTRIES_APPROVE'];

export const NAV_PERMISSION_MAP: Record<string, string[] | string> = {
    '/app/notifications': 'NOTIFICATIONS_READ',
    '/app/personel': USER_PERMS,
    '/app/musteriler': CLIENT_PERMS,
    '/app/musterilerim': CLIENT_PERMS,
    '/app/projeler': PROJECT_PERMS,
    '/app/projelerim': PROJECT_PERMS,
    '/app/gorevler': TASK_PERMS,
    '/app/gorevlerim': TASK_PERMS,
    '/app/icerik-plani': TASK_PERMS,
    '/app/talepler': TICKET_PERMS,
    '/app/portal-talepleri': TICKET_PERMS,
    '/app/gorusme-talepleri': MEETING_PERMS,
    '/app/gorusmeler': MEETING_PERMS,
    '/app/personel-toplantilari': MEETING_PERMS,
    '/app/toplanti-takvimi': MEETING_PERMS,
    '/app/finans': [...PAYMENT_PERMS, ...INVOICE_PERMS, ...EXPENSE_PERMS],
    '/app/faturalar': INVOICE_PERMS,
    '/app/tahsilat-takibi': PAYMENT_PERMS,
    '/app/gider-yonetimi': EXPENSE_PERMS,
    '/app/banka-mutabakat': PAYMENT_PERMS,
    '/app/musteri-ekstresi': PAYMENT_PERMS,
    '/app/vergi-beyan': EXPENSE_PERMS,
    '/app/sozlesmeler': CONTRACT_PERMS,
    '/app/dosyalar': FILE_PERMS,
    '/app/dosyalarim': FILE_PERMS,
    '/app/time-tracker': TIME_PERMS,
    '/app/audit-log': 'AUDIT_READ',
    '/app/iletisim-talepleri': CLIENT_PERMS,
};
