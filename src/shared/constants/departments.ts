export const DEPARTMENTS = {
    MANAGEMENT: 'MANAGEMENT',
    DESIGN: 'DESIGN',
    DEVELOPMENT: 'DEVELOPMENT',
    MARKETING: 'MARKETING',
    FINANCE: 'FINANCE',
    HR: 'HR',
} as const;

export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS];

/** Departmanların Türkçe etiketleri */
export const DEPARTMENT_LABELS: Record<string, string> = {
    MANAGEMENT: 'Yönetim',
    DESIGN: 'Tasarım',
    DEVELOPMENT: 'Geliştirme',
    MARKETING: 'Pazarlama',
    FINANCE: 'Finans',
    HR: 'İnsan Kaynakları',
};
