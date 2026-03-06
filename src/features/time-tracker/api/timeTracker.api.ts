import api from '../../../shared/lib/axios';

export interface TimerEntry {
    id: string;
    userId: string;
    projectId: string;
    taskId?: string;
    description: string;
    startedAt: string;
    stoppedAt?: string;
    duration?: number;
    status: 'ACTIVE' | 'STOPPED' | 'CANCELLED';
    createdAt: string;
    updatedAt: string;
    projectName?: string;
    taskTitle?: string;
    userEmail?: string;
    userFirstName?: string;
    userLastName?: string;
}

export interface TimerHistoryParams {
    page?: number;
    limit?: number;
    projectId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
}

export interface PaginatedTimerResponse {
    data: TimerEntry[];
    total: number;
    page: number;
    limit: number;
}

export interface StartTimerPayload {
    projectId: string;
    taskId?: string;
    description?: string;
}

type MaybeWrapped<T> = { data?: T } | T;

type BackendTimeEntry = Partial<{
    id: string;
    userId: string;
    projectId: string;
    taskId: string | null;
    description: string | null;
    startedAt: string;
    stoppedAt: string | null;
    duration: number | null;
    status: TimerEntry['status'];
    createdAt: string;
    updatedAt: string;
    startTime: string;
    endTime: string | null;
    durationMinutes: number | null;
    projectName: string | null;
    taskTitle: string | null;
    userEmail: string | null;
    userFirstName: string | null;
    userLastName: string | null;
    user_id: string;
    project_id: string;
    task_id: string | null;
    project_name: string | null;
    task_title: string | null;
    user_email: string | null;
    user_first_name: string | null;
    user_last_name: string | null;
}>;

function unwrapData<T>(payload: MaybeWrapped<T>): T {
    if (typeof payload === 'object' && payload !== null && 'data' in payload && payload.data !== undefined) {
        return payload.data as T;
    }
    return payload as T;
}

function normalizeTimerEntry(entry: BackendTimeEntry | null | undefined): TimerEntry | null {
    if (!entry || !entry.id) return null;

    const startedAt = entry.startedAt ?? entry.startTime ?? entry.createdAt;
    if (!startedAt) return null;

    const stoppedAt = entry.stoppedAt ?? entry.endTime ?? undefined;
    
    let duration = typeof entry.duration === 'number' 
        ? entry.duration 
        : (typeof entry.durationMinutes === 'number' ? entry.durationMinutes * 60 : undefined);

    if (startedAt && stoppedAt) {
        duration = Math.floor((new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    }

    const status = entry.status ?? (stoppedAt ? 'STOPPED' : 'ACTIVE');

    return {
        id: entry.id,
        userId: entry.userId ?? entry.user_id ?? '',
        projectId: entry.projectId ?? entry.project_id ?? '',
        taskId: entry.taskId ?? entry.task_id ?? undefined,
        description: entry.description ?? '',
        startedAt,
        stoppedAt,
        duration,
        status,
        createdAt: entry.createdAt ?? startedAt,
        updatedAt: entry.updatedAt ?? entry.createdAt ?? startedAt,
        projectName: entry.projectName ?? entry.project_name ?? undefined,
        taskTitle: entry.taskTitle ?? entry.task_title ?? undefined,
        userEmail: entry.userEmail ?? entry.user_email ?? undefined,
        userFirstName: entry.userFirstName ?? entry.user_first_name ?? undefined,
        userLastName: entry.userLastName ?? entry.user_last_name ?? undefined,
    };
}

export async function startTimer(payload: StartTimerPayload): Promise<TimerEntry> {
    const { data } = await api.post<MaybeWrapped<BackendTimeEntry>>(
        '/time-entries/start',
        payload,
    );

    const normalized = normalizeTimerEntry(unwrapData(data));
    if (!normalized) throw new Error('Timer response could not be parsed');
    return normalized;
}

export async function stopTimer(): Promise<TimerEntry> {
    const { data } = await api.patch<MaybeWrapped<BackendTimeEntry>>(
        '/time-entries/stop',
    );

    const normalized = normalizeTimerEntry(unwrapData(data));
    if (!normalized) throw new Error('Timer response could not be parsed');
    return normalized;
}

export async function deleteTimerEntry(id: string): Promise<void> {
    await api.delete(`/time-entries/${id}`);
}

export async function getActiveTimer(): Promise<TimerEntry | null> {
    const { data } = await api.get<MaybeWrapped<BackendTimeEntry | null>>(
        '/time-entries/active',
    );
    return normalizeTimerEntry(unwrapData(data));
}

export async function getTimerHistory(
    params: TimerHistoryParams,
): Promise<PaginatedTimerResponse> {
    const { data } = await api.get<
        MaybeWrapped<{
            data?: BackendTimeEntry[];
            total?: number;
            page?: number;
            limit?: number;
        }>
    >(
        '/time-entries',
        { params },
    );

    const payload = unwrapData(data);
    const rows = Array.isArray(payload.data)
        ? payload.data
            .map((row) => normalizeTimerEntry(row))
            .filter((row): row is TimerEntry => !!row)
        : [];

    return {
        data: rows,
        total: typeof payload.total === 'number' ? payload.total : rows.length,
        page: typeof payload.page === 'number' ? payload.page : params.page ?? 1,
        limit: typeof payload.limit === 'number' ? payload.limit : params.limit ?? 10,
    };
}
