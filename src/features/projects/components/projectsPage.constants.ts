import type { ProjectCreatePanelState, PriorityLevel } from './projectsPage.types';

export const PRIORITY_OPTIONS: Array<{ value: PriorityLevel; label: string }> = [
    { value: 'LOW', label: 'Dusuk' },
    { value: 'MEDIUM', label: 'Orta' },
    { value: 'HIGH', label: 'Yuksek' },
    { value: 'CRITICAL', label: 'Kritik' },
];

export const FALLBACK_DEPARTMENTS = [
    { id: 'fallback-software', name: 'Yazilim' },
    { id: 'fallback-marketing', name: 'Pazarlama' },
    { id: 'fallback-production', name: 'Produksiyon' },
    { id: 'fallback-design', name: 'Tasarim' },
];

export const INITIAL_CREATE_FORM: ProjectCreatePanelState = {
    name: '',
    description: '',
    clientId: '',
    departmentId: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    isPrivate: false,
    startDate: '',
    deadline: '',
    budget: '',
    teamSize: '',
    tags: '',
    projectManagerId: '',
    teamLeadId: '',
    personnelSearch: '',
    assignedPersonnelIds: [],
    departmentDetails: {
        software: {
            repoUrl: '',
            techStack: '',
            apiDocumentation: '',
            serverInfo: '',
        },
        marketing: {
            targetAudience: '',
            adChannels: '',
            campaignBudget: '',
        },
        production: {
            equipmentNeeds: '',
            shootingLocation: '',
            rawFilePath: '',
        },
        design: {
            designTools: '',
            brandGuide: '',
            deliveryFormat: '',
        },
        general: {
            notes: '',
        },
    },
};

export const STATUS_META: Record<string, { label: string; badgeClass: string; progress: number }> = {
    DRAFT: { label: 'Taslak', badgeClass: 'bg-slate-100 text-slate-700', progress: 8 },
    PLANNING: { label: 'Planlama', badgeClass: 'bg-sky-100 text-sky-700', progress: 20 },
    IN_PROGRESS: { label: 'Devam Ediyor', badgeClass: 'bg-amber-100 text-amber-700', progress: 58 },
    ON_HOLD: { label: 'Beklemede', badgeClass: 'bg-orange-100 text-orange-700', progress: 42 },
    COMPLETED: { label: 'Tamamlandi', badgeClass: 'bg-emerald-100 text-emerald-700', progress: 100 },
    CANCELLED: { label: 'Iptal', badgeClass: 'bg-rose-100 text-rose-700', progress: 0 },
    ARCHIVED: { label: 'Arsiv', badgeClass: 'bg-zinc-200 text-zinc-700', progress: 100 },
};

export const STATUS_OPTIONS = [
    { value: '', label: 'Tum Durumlar' },
    { value: 'DRAFT', label: STATUS_META.DRAFT.label },
    { value: 'PLANNING', label: STATUS_META.PLANNING.label },
    { value: 'IN_PROGRESS', label: STATUS_META.IN_PROGRESS.label },
    { value: 'ON_HOLD', label: STATUS_META.ON_HOLD.label },
    { value: 'COMPLETED', label: STATUS_META.COMPLETED.label },
    { value: 'CANCELLED', label: STATUS_META.CANCELLED.label },
    { value: 'ARCHIVED', label: STATUS_META.ARCHIVED.label },
];
