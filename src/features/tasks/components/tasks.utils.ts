import { isAxiosError } from 'axios';
import {
    TASK_PRIORITY_BADGE_CLASS,
    TASK_PRIORITY_OPTIONS,
    TASK_STATUS_BADGE_CLASS,
    TASK_STATUS_OPTIONS,
    TASK_STATUS_TRANSITIONS,
    type TaskPriority,
    type TaskStatus,
} from './tasks.constants';

export function toTaskStatus(value?: string): TaskStatus {
    const upper = (value ?? '').toUpperCase();
    if (upper === 'TODO' || upper === 'IN_PROGRESS' || upper === 'IN_REVIEW' || upper === 'DONE' || upper === 'BLOCKED') {
        return upper;
    }
    return 'TODO';
}

export function toTaskPriority(value?: string): TaskPriority {
    const upper = (value ?? '').toUpperCase();
    if (upper === 'LOW' || upper === 'MEDIUM' || upper === 'HIGH' || upper === 'URGENT') {
        return upper;
    }
    return 'MEDIUM';
}

export function taskStatusLabel(status?: string): string {
    const normalized = toTaskStatus(status);
    return TASK_STATUS_OPTIONS.find((item) => item.value === normalized)?.label ?? normalized;
}

export function taskPriorityLabel(priority?: string): string {
    const normalized = toTaskPriority(priority);
    return TASK_PRIORITY_OPTIONS.find((item) => item.value === normalized)?.label ?? normalized;
}

export function taskStatusBadgeClass(status?: string): string {
    return TASK_STATUS_BADGE_CLASS[toTaskStatus(status)];
}

export function taskPriorityBadgeClass(priority?: string): string {
    return TASK_PRIORITY_BADGE_CLASS[toTaskPriority(priority)];
}

export function nextStatusOptions(status?: string): TaskStatus[] {
    const normalized = toTaskStatus(status);
    return [normalized, ...TASK_STATUS_TRANSITIONS[normalized]];
}

export function extractErrorMessage(error: unknown, fallback: string): string {
    if (!isAxiosError(error)) {
        return fallback;
    }

    const responseData = error.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    if (typeof responseData === 'object' && responseData !== null) {
        const message = (responseData as { message?: unknown }).message;
        if (Array.isArray(message)) {
            return String(message[0] ?? fallback);
        }
        if (typeof message === 'string' && message.trim()) {
            return message;
        }
    }

    return fallback;
}
