import { ROLES } from './roles';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SidebarTheme {
    bg: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
}

export interface NavItem {
    label: string;
    path: string;
    icon?: string;
    badge?: 'unread';
}

export interface NavGroup {
    group: string | null;
    items: NavItem[];
}

export interface RoleNavConfig {
    theme: SidebarTheme;
    groups: NavGroup[];
}

/**
 * NAV_CONFIG shape:
 * {
 *   [ROLE]: {
 *     theme: { bg, accent, text },
 *     groups: [
 *       {
 *         group: string,          // Grup başlığı (null ise başlık render edilmez)
 *         items: [
 *           { label, path, icon, badge? }
 *           // icon: Lucide icon adı (string)
 *           // badge: 'unread' → bildirim sayısını gösterir, undefined → yok
 *         ]
 *       }
 *     ]
 *   }
 * }
 */

// ─── TEMALAR ────────────────────────────────────────────────────────────────

const THEMES: Record<string, SidebarTheme> = {
    ADMIN: { bg: '#F3F4F6', accent: '#DC2626', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    CEO: { bg: '#F3F4F6', accent: '#0D9488', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    MANAGER: { bg: '#F3F4F6', accent: '#2563EB', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    ACCOUNTING: { bg: '#F3F4F6', accent: '#059669', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    ACCOUNT_MANAGER: { bg: '#F3F4F6', accent: '#D97706', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    DEVELOPER: { bg: '#F3F4F6', accent: '#7C3AED', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    SOCIAL_MEDIA: { bg: '#F3F4F6', accent: '#DB2777', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    CREATIVE: { bg: '#F3F4F6', accent: '#EA580C', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    MARKETING: { bg: '#F3F4F6', accent: '#0891B2', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    PRODUCTION: { bg: '#F3F4F6', accent: '#65A30D', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    HR: { bg: '#F3F4F6', accent: '#9333EA', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
    CLIENT: { bg: '#F3F4F6', accent: '#111827', text: '#111827', muted: '#6B7280', border: '#E5E7EB' },
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

const ADMIN_NAV: RoleNavConfig = {
    theme: THEMES.ADMIN,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'YÖNETİM',
            items: [
                { label: 'Personel Yönetimi', path: '/app/personel', icon: 'Users' },
                { label: 'Müşteri Yönetimi', path: '/app/musteriler', icon: 'Building2' },
                { label: 'Projeler', path: '/app/projeler', icon: 'FolderKanban' },
                { label: 'Görev Yönetimi', path: '/app/gorevler', icon: 'CheckSquare' },
                { label: 'Departmanlar', path: '/app/departmanlar', icon: 'Network' },
            ],
        },
        {
            group: 'FİNANS',
            items: [
                { label: 'Finansal Raporlar', path: '/app/finans', icon: 'BarChart3' },
                { label: 'Fatura Yönetimi', path: '/app/faturalar', icon: 'Receipt' },
                { label: 'Sözleşmeler', path: '/app/sozlesmeler', icon: 'FileText' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
                { label: 'Dosya Yönetimi', path: '/app/dosyalar', icon: 'FolderOpen' },
                { label: 'Görüşmeler', path: '/app/gorusmeler', icon: 'MessageSquare' },
                { label: 'Destek Talepleri', path: '/app/talepler', icon: 'Inbox' },
            ],
        },
        {
            group: 'SİSTEM',
            items: [
                { label: 'Roller & İzinler', path: '/app/roller', icon: 'ShieldCheck' },
                { label: 'Audit Log', path: '/app/audit-log', icon: 'ShieldCheck' },
                { label: 'Ayarlar', path: '/app/ayarlar', icon: 'Settings' },
            ],
        },
    ],
};

// ─── CEO ─────────────────────────────────────────────────────────────────────

const CEO_NAV: RoleNavConfig = {
    theme: THEMES.CEO,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'YÖNETİM',
            items: [
                { label: 'Personel Yönetimi', path: '/app/personel', icon: 'Users' },
                { label: 'Müşteri Yönetimi', path: '/app/musteriler', icon: 'Building2' },
                { label: 'Projeler', path: '/app/projeler', icon: 'FolderKanban' },
                { label: 'Görev Yönetimi', path: '/app/gorevler', icon: 'CheckSquare' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
                { label: 'Finansal Raporlar', path: '/app/finans', icon: 'BarChart3' },
                { label: 'Sözleşmeler', path: '/app/sozlesmeler', icon: 'FileText' },
                { label: 'Dosya Yönetimi', path: '/app/dosyalar', icon: 'FolderOpen' },
            ],
        },
        {
            group: 'SİSTEM',
            items: [
                { label: 'Audit Log', path: '/app/audit-log', icon: 'ShieldCheck' },
                { label: 'Ayarlar', path: '/app/ayarlar', icon: 'Settings' },
            ],
        },
    ],
};

// ─── MANAGER ─────────────────────────────────────────────────────────────────

const MANAGER_NAV: RoleNavConfig = {
    theme: THEMES.MANAGER,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'YÖNETİM',
            items: [
                { label: 'Personel', path: '/app/personel', icon: 'Users' },
                { label: 'Müşteri Listesi', path: '/app/musteriler', icon: 'Building2' },
                { label: 'Projeler', path: '/app/projeler', icon: 'FolderKanban' },
                { label: 'Görev Yönetimi', path: '/app/gorevler', icon: 'CheckSquare' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
                { label: 'Dosya Yönetimi', path: '/app/dosyalar', icon: 'FolderOpen' },
            ],
        },
    ],
};

const ACCOUNTING_NAV: RoleNavConfig = {
    theme: THEMES.ACCOUNTING,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'YÖNETİM',
            items: [
                { label: 'Personel', path: '/app/personel', icon: 'Users' },
                { label: 'Müşteri Listesi', path: '/app/musteriler', icon: 'Building2' },
                { label: 'Proje Bütçeleri', path: '/app/projeler', icon: 'FolderKanban' },
            ],
        },
        {
            group: 'FİNANS',
            items: [
                { label: 'Finansal Raporlar', path: '/app/finans', icon: 'BarChart3' },
                { label: 'Fatura Yönetimi', path: '/app/faturalar', icon: 'Receipt' },
                { label: 'Sözleşmeler', path: '/app/sozlesmeler', icon: 'FileText' },
            ],
        },
    ],
};

// ─── ACCOUNT MANAGER ─────────────────────────────────────────────────────────

const ACCOUNT_MANAGER_NAV: RoleNavConfig = {
    theme: THEMES.ACCOUNT_MANAGER,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'MÜŞTERİ',
            items: [
                { label: 'Müşterilerim', path: '/app/musterilerim', icon: 'Building2' },
                { label: 'Yeni Talepler', path: '/app/yeni-talepler', icon: 'Inbox', badge: 'unread' },
                { label: 'Brief Yönetimi', path: '/app/briefler', icon: 'ClipboardList' },
                { label: 'Ön Onay Paneli', path: '/app/on-onay', icon: 'ShieldCheck' },
            ],
        },
        {
            group: 'İŞ TAKİBİ',
            items: [
                { label: 'Görüşme Yönetimi', path: '/app/gorusmeler', icon: 'MessageSquare' },
                { label: 'Proje Yönetimi', path: '/app/projeler', icon: 'FolderKanban' },
                { label: 'Görevlerim', path: '/app/gorevlerim', icon: 'CheckSquare' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
            ],
        },
    ],
};

// ─── DEVELOPER ───────────────────────────────────────────────────────────────

const DEVELOPER_NAV: RoleNavConfig = {
    theme: THEMES.DEVELOPER,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'İŞ',
            items: [
                { label: 'Görevlerim', path: '/app/gorevlerim', icon: 'CheckSquare' },
                { label: 'Projelerim', path: '/app/projelerim', icon: 'FolderKanban' },
                { label: 'Kod Süreçleri', path: '/app/kod', icon: 'Code2' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
                { label: 'Dosyalarım', path: '/app/dosyalarim', icon: 'FolderOpen' },
            ],
        },
    ],
};

// ─── SOSYAL MEDYA ─────────────────────────────────────────────────────────────

const SOCIAL_MEDIA_NAV: RoleNavConfig = {
    theme: THEMES.SOCIAL_MEDIA,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'İŞ',
            items: [
                { label: 'Görevlerim', path: '/app/gorevlerim', icon: 'CheckSquare' },
                { label: 'İçerik Planları', path: '/app/icerik-plani', icon: 'CalendarDays' },
                { label: 'Kampanya Yönetimi', path: '/app/kampanyalar', icon: 'Megaphone' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
                { label: 'Dosyalarım', path: '/app/dosyalarim', icon: 'FolderOpen' },
            ],
        },
    ],
};

// ─── KREATİF ─────────────────────────────────────────────────────────────────

const CREATIVE_NAV: RoleNavConfig = {
    theme: THEMES.CREATIVE,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'İŞ',
            items: [
                { label: 'Görevlerim', path: '/app/gorevlerim', icon: 'CheckSquare' },
                { label: 'Tasarım Süreçleri', path: '/app/tasarim', icon: 'Palette' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
                { label: 'Dosyalarım', path: '/app/dosyalarim', icon: 'FolderOpen' },
            ],
        },
    ],
};

// ─── PAZARLAMA ───────────────────────────────────────────────────────────────

const MARKETING_NAV: RoleNavConfig = {
    theme: THEMES.MARKETING,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'İŞ',
            items: [
                { label: 'Görevlerim', path: '/app/gorevlerim', icon: 'CheckSquare' },
                { label: 'Kampanya Yönetimi', path: '/app/kampanyalar', icon: 'Megaphone' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
                { label: 'Dosyalarım', path: '/app/dosyalarim', icon: 'FolderOpen' },
            ],
        },
    ],
};

// ─── PRODÜKSİYON ─────────────────────────────────────────────────────────────

const PRODUCTION_NAV: RoleNavConfig = {
    theme: THEMES.PRODUCTION,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'İŞ',
            items: [
                { label: 'Görevlerim', path: '/app/gorevlerim', icon: 'CheckSquare' },
                { label: 'Prodüksiyon Süreçleri', path: '/app/produksiyon', icon: 'Film' },
            ],
        },
        {
            group: 'ARAÇLAR',
            items: [
                { label: 'Time Tracker', path: '/app/time-tracker', icon: 'Timer' },
                { label: 'Dosyalarım', path: '/app/dosyalarim', icon: 'FolderOpen' },
            ],
        },
    ],
};

// ─── İNSAN KAYNAKLARI ────────────────────────────────────────────────────────

const HR_NAV: RoleNavConfig = {
    theme: THEMES.HR,
    groups: [
        {
            group: 'GENEL',
            items: [
                { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard' },
                { label: 'Bildirimler', path: '/app/notifications', icon: 'Bell', badge: 'unread' },
            ],
        },
        {
            group: 'PERSONEL',
            items: [
                { label: 'Personel Kayıtları', path: '/app/personel', icon: 'Users' },
                { label: 'Departman Atamaları', path: '/app/departman-atamalari', icon: 'Network' },
            ],
        },
        {
            group: 'İK ARAÇLARI',
            items: [
                { label: 'İzin Yönetimi', path: '/app/izin-yonetimi', icon: 'CalendarCheck' },
                { label: 'Çalışma Süresi', path: '/app/calisma-suresi', icon: 'Clock' },
                { label: 'Performans', path: '/app/performans', icon: 'TrendingUp' },
            ],
        },
    ],
};

// ─── MÜŞTERİ PORTALİ ─────────────────────────────────────────────────────────
// Tamamen izole layout kullanır; bu config sadece portal sidebar için referans

const CLIENT_NAV: RoleNavConfig = {
    theme: THEMES.CLIENT,
    groups: [
        {
            group: null,
            items: [
                { label: 'Dashboard', path: '/portal/dashboard', icon: 'LayoutDashboard' },
                { label: 'Projelerim', path: '/portal/projeler', icon: 'FolderKanban' },
                { label: 'Taleplerim', path: '/portal/talepler', icon: 'MessageSquarePlus' },
                { label: 'Görüşme Notları', path: '/portal/notlar', icon: 'StickyNote' },
                { label: 'Onay Bekleyen', path: '/portal/onaylar', icon: 'ClipboardList', badge: 'unread' },
            ],
        },
    ],
};

// ─── ANA CONFIG ──────────────────────────────────────────────────────────────

export const NAV_CONFIG: Record<string, RoleNavConfig> = {
    [ROLES.ADMIN]: ADMIN_NAV,
    [ROLES.CEO]: CEO_NAV,
    [ROLES.MANAGER]: MANAGER_NAV,
    [ROLES.ACCOUNTING]: ACCOUNTING_NAV,
    [ROLES.ACCOUNT_MANAGER]: ACCOUNT_MANAGER_NAV,
    [ROLES.DEVELOPER]: DEVELOPER_NAV,
    [ROLES.SOCIAL_MEDIA]: SOCIAL_MEDIA_NAV,
    [ROLES.CREATIVE]: CREATIVE_NAV,
    [ROLES.MARKETING]: MARKETING_NAV,
    [ROLES.PRODUCTION]: PRODUCTION_NAV,
    [ROLES.HR]: HR_NAV,
    [ROLES.CLIENT]: CLIENT_NAV,
};
