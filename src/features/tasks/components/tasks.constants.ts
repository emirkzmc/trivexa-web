export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
    { value: 'TODO', label: 'Yapilacak' },
    { value: 'IN_PROGRESS', label: 'Devam Ediyor' },
    { value: 'IN_REVIEW', label: 'Incelemede' },
    { value: 'DONE', label: 'Tamamlandi' },
    { value: 'BLOCKED', label: 'Iptal Edildi' },
];

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
    { value: 'LOW', label: 'Dusuk' },
    { value: 'MEDIUM', label: 'Orta' },
    { value: 'HIGH', label: 'Yuksek' },
    { value: 'URGENT', label: 'Kritik' },
];

export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    TODO: ['IN_PROGRESS', 'BLOCKED'],
    IN_PROGRESS: ['IN_REVIEW', 'BLOCKED', 'TODO'],
    IN_REVIEW: ['DONE', 'IN_PROGRESS'],
    BLOCKED: ['TODO', 'IN_PROGRESS'],
    DONE: ['TODO'],
};

export const TASK_STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
    TODO: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    IN_REVIEW: 'bg-blue-100 text-blue-700',
    DONE: 'sem-success-chip',
    BLOCKED: 'sem-danger-chip',
};

export const TASK_PRIORITY_BADGE_CLASS: Record<TaskPriority, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-amber-100 text-amber-700',
    URGENT: 'sem-danger-chip',
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
    'TODO',
    'IN_PROGRESS',
    'IN_REVIEW',
    'BLOCKED',
    'DONE',
];
