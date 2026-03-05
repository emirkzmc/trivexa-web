import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskItem {
    id: string;
    projectId: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    assigneeId?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskListParams {
    page?: number;
    limit?: number;
    status?: string;
    assigneeId?: string;
    priority?: string;
    search?: string;
}

export interface PaginatedTaskResponse {
    data: TaskItem[];
    total: number;
    page: number;
    limit: number;
}

export interface TaskCreatePayload {
    title: string;
    description: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
}

export type TaskUpdatePayload = Partial<TaskCreatePayload>;

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getProjectTasks(
    projectId: string,
    params?: TaskListParams,
): Promise<PaginatedTaskResponse> {
    const { data } = await api.get<{ data?: { data?: TaskItem[]; meta?: { total?: number; page?: number; limit?: number } } } | { data?: TaskItem[]; meta?: { total?: number; page?: number; limit?: number } }>(
        `/tasks/projects/${projectId}/tasks`,
        { params },
    );

    const payload = ('data' in data && typeof data.data === 'object' && data.data !== null)
        ? data.data
        : data;
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const meta = payload.meta ?? {};

    return {
        data: rows,
        total: typeof meta.total === 'number' ? meta.total : rows.length,
        page: typeof meta.page === 'number' ? meta.page : params?.page ?? 1,
        limit: typeof meta.limit === 'number' ? meta.limit : params?.limit ?? 50,
    };
}

export async function createTask(
    projectId: string,
    payload: TaskCreatePayload,
): Promise<TaskItem> {
    const { data } = await api.post<{ data: TaskItem }>(
        `/tasks/projects/${projectId}/tasks`,
        payload,
    );
    return data.data;
}

export async function getTaskById(taskId: string): Promise<TaskItem> {
    const { data } = await api.get<{ data: TaskItem }>(`/tasks/${taskId}`);
    return data.data;
}

export async function updateTask(
    taskId: string,
    payload: TaskUpdatePayload,
): Promise<TaskItem> {
    const { data } = await api.put<{ data: TaskItem }>(`/tasks/${taskId}`, payload);
    return data.data;
}

export async function updateTaskStatus(taskId: string, status: string): Promise<void> {
    await api.patch(`/tasks/${taskId}/status`, { status });
}
