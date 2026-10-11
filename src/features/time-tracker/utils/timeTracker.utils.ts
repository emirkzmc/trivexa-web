import type { TimerEntry } from '../api/timeTracker.api';

export function formatClock(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

export function getStatusLabel(status: TimerEntry['status']): string {
    if (status === 'ACTIVE') return 'Calisiyor';
    if (status === 'STOPPED') return 'Tamamlandi';
    return 'Iptal';
}

export function getStatusChipClass(status: TimerEntry['status']): string {
    if (status === 'ACTIVE') return 'sem-danger-chip';
    if (status === 'STOPPED') return 'sem-success-chip';
    return 'bg-gray-100 text-gray-600';
}

export function getEntryDurationSeconds(entry: TimerEntry): number {
    if (typeof entry.duration === 'number' && entry.duration >= 0) return entry.duration;
    if (!entry.startedAt) return 0;

    const start = new Date(entry.startedAt).getTime();
    if (Number.isNaN(start)) return 0;

    if (entry.stoppedAt) {
        const stop = new Date(entry.stoppedAt).getTime();
        if (Number.isNaN(stop)) return 0;
        return Math.max(0, Math.floor((stop - start) / 1000));
    }

    return Math.max(0, Math.floor((Date.now() - start) / 1000));
}

export function getDisplayUserName(entry: TimerEntry): string {
    const first = entry.userFirstName?.trim() ?? '';
    const last = entry.userLastName?.trim() ?? '';
    const fullName = `${first} ${last}`.trim();
    if (fullName) return fullName;
    if (entry.userEmail) return entry.userEmail;
    return entry.userId || '-';
}
