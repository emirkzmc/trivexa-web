import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimerEntry {
    id: string;
    projectId: string;
    description: string;
    startedAt: string;
    stoppedAt?: string;
    duration?: number;
    status: 'ACTIVE' | 'STOPPED' | 'CANCELLED';
    createdAt: string;
}

export interface TimerHistoryParams {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
}

export interface PaginatedTimerResponse {
    data: TimerEntry[];
    total: number;
    page: number;
    limit: number;
}

export interface StartTimerPayload {
    projectId: string;
    description: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function startTimer(payload: StartTimerPayload): Promise<TimerEntry> {
    const { data } = await api.post<{ data: TimerEntry }>(
        '/time-tracker/start',
        payload,
    );
    return data.data;
}

export async function stopTimer(id: string): Promise<TimerEntry> {
    const { data } = await api.post<{ data: TimerEntry }>(
        `/time-tracker/stop/${id}`,
    );
    return data.data;
}

export async function cancelTimer(id: string): Promise<void> {
    await api.post(`/time-tracker/cancel/${id}`);
}

export async function getActiveTimer(): Promise<TimerEntry | null> {
    const { data } = await api.get<{ data: TimerEntry | null }>(
        '/time-tracker/active',
    );
    return data.data;
}

export async function getTimerHistory(
    params: TimerHistoryParams,
): Promise<PaginatedTimerResponse> {
    const { data } = await api.get<PaginatedTimerResponse>(
        '/time-tracker',
        { params },
    );
    return data;
}
