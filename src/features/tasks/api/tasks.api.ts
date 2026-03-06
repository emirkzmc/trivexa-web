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
    assigneeEmail?: string;
    assigneeFirstName?: string;
    assigneeLastName?: string;
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

type BackendTask = Partial<{
    id: string;
    projectId: string;
    project_id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    assigneeId: string | null;
    assignee_id: string | null;
    assigneeEmail: string | null;
    assignee_email: string | null;
    assigneeFirstName: string | null;
    assignee_first_name: string | null;
    assigneeLastName: string | null;
    assignee_last_name: string | null;
    dueDate: string | null;
    due_date: string | null;
    createdAt: string;
    created_at: string;
    updatedAt: string;
    updated_at: string;
}>;

function normalizeTask(task: BackendTask | null | undefined): TaskItem | null {
    if (!task?.id || !task.title) {
        return null;
    }

    const createdAt = task.createdAt ?? task.created_at;
    const updatedAt = task.updatedAt ?? task.updated_at;
    if (!createdAt || !updatedAt) {
        return null;
    }

    return {
        id: task.id,
        projectId: task.projectId ?? task.project_id ?? '',
        title: task.title,
        description: task.description ?? '',
        priority: task.priority ?? 'MEDIUM',
        status: task.status ?? 'TODO',
        assigneeId: task.assigneeId ?? task.assignee_id ?? undefined,
        assigneeEmail: task.assigneeEmail ?? task.assignee_email ?? undefined,
        assigneeFirstName: task.assigneeFirstName ?? task.assignee_first_name ?? undefined,
        assigneeLastName: task.assigneeLastName ?? task.assignee_last_name ?? undefined,
        dueDate: task.dueDate ?? task.due_date ?? undefined,
        createdAt,
        updatedAt,
    };
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getProjectTasks(
    projectId: string,
    params?: TaskListParams,
): Promise<PaginatedTaskResponse> {
    const { data } = await api.get<
        { data?: { data?: TaskItem[]; meta?: { total?: number; page?: number; limit?: number } } } |
        { data?: TaskItem[]; meta?: { total?: number; page?: number; limit?: number } }
    >(
        `/tasks/projects/${projectId}/tasks`,
        { params },
    );

    const topLevelData = data.data;
    const payload = (
        typeof topLevelData === 'object' &&
        topLevelData !== null &&
        !Array.isArray(topLevelData)
    )
        ? topLevelData
        : data;
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const meta = (
        typeof payload === 'object' &&
        payload !== null &&
        'meta' in payload &&
        typeof payload.meta === 'object' &&
        payload.meta !== null
    )
        ? payload.meta
        : {};

    return {
        data: rows
            .map((row) => normalizeTask(row as BackendTask))
            .filter((row): row is TaskItem => !!row),
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
