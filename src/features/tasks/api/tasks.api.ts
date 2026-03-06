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
    assigneeIds?: string[];
    assignees?: TaskAssignee[];
    assigneeEmail?: string;
    assigneeFirstName?: string;
    assigneeLastName?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskAssignee {
    userId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
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
    assigneeIds?: string[];
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
    assigneeIds: string[];
    assignee_ids: string[];
    assignees: Array<Partial<{
        userId: string;
        user_id: string;
        email: string | null;
        firstName: string | null;
        first_name: string | null;
        lastName: string | null;
        last_name: string | null;
    }>>;
    dueDate: string | null;
    due_date: string | null;
    createdAt: string;
    created_at: string;
    updatedAt: string;
    updated_at: string;
}>;

type MetaPayload = Partial<{
    total: number;
    page: number;
    limit: number;
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function extractRows(payload: unknown): { rows: unknown[]; meta: MetaPayload } {
    const root = asRecord(payload);
    const topLevel = root && 'data' in root ? root.data : payload;

    if (Array.isArray(topLevel)) {
        return { rows: topLevel, meta: {} };
    }

    const topLevelRecord = asRecord(topLevel);
    if (!topLevelRecord) {
        return { rows: [], meta: {} };
    }

    const directRows = Array.isArray(topLevelRecord.data)
        ? topLevelRecord.data
        : Array.isArray(topLevelRecord.items)
            ? topLevelRecord.items
            : null;

    if (directRows) {
        const meta = asRecord(topLevelRecord.meta) ?? {};
        return { rows: directRows, meta: meta as MetaPayload };
    }

    const nestedData = asRecord(topLevelRecord.data);
    if (!nestedData) {
        const meta = asRecord(topLevelRecord.meta) ?? {};
        return { rows: [], meta: meta as MetaPayload };
    }

    const nestedRows = Array.isArray(nestedData.data)
        ? nestedData.data
        : Array.isArray(nestedData.items)
            ? nestedData.items
            : [];
    const nestedMeta = asRecord(nestedData.meta) ?? asRecord(topLevelRecord.meta) ?? {};
    return { rows: nestedRows, meta: nestedMeta as MetaPayload };
}

function extractSingleTask(payload: unknown): BackendTask | null {
    let current: unknown = payload;

    for (let i = 0; i < 3; i += 1) {
        const currentRecord = asRecord(current);
        if (!currentRecord || !('data' in currentRecord) || currentRecord.data === undefined) {
            break;
        }
        current = currentRecord.data;
    }

    const taskRecord = asRecord(current);
    return taskRecord ? (taskRecord as BackendTask) : null;
}

function normalizeTask(task: BackendTask | null | undefined): TaskItem | null {
    if (!task?.id || !task.title) {
        return null;
    }

    const createdAt = task.createdAt ?? task.created_at;
    const updatedAt = task.updatedAt ?? task.updated_at;
    if (!createdAt || !updatedAt) {
        return null;
    }

    const normalizedAssignees = normalizeAssignees(task);
    const normalizedAssigneeIds = normalizedAssignees.length
        ? normalizedAssignees.map((assignee) => assignee.userId)
        : normalizeAssigneeIds(task);

    const fallbackPrimaryAssigneeId = task.assigneeId ?? task.assignee_id ?? undefined;
    const primaryAssigneeId = normalizedAssigneeIds[0] ?? fallbackPrimaryAssigneeId;

    return {
        id: task.id,
        projectId: task.projectId ?? task.project_id ?? '',
        title: task.title,
        description: task.description ?? '',
        priority: task.priority ?? 'MEDIUM',
        status: task.status ?? 'TODO',
        assigneeId: primaryAssigneeId,
        assigneeIds: normalizedAssigneeIds.length ? normalizedAssigneeIds : undefined,
        assignees: normalizedAssignees.length ? normalizedAssignees : undefined,
        assigneeEmail: task.assigneeEmail ?? task.assignee_email ?? undefined,
        assigneeFirstName: task.assigneeFirstName ?? task.assignee_first_name ?? undefined,
        assigneeLastName: task.assigneeLastName ?? task.assignee_last_name ?? undefined,
        dueDate: task.dueDate ?? task.due_date ?? undefined,
        createdAt,
        updatedAt,
    };
}

function normalizeAssigneeIds(task: BackendTask): string[] {
    const raw = Array.isArray(task.assigneeIds)
        ? task.assigneeIds
        : Array.isArray(task.assignee_ids)
            ? task.assignee_ids
            : [];

    const unique = Array.from(
        new Set(
            raw
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter((value): value is string => !!value),
        ),
    );

    return unique;
}

function normalizeAssignees(task: BackendTask): TaskAssignee[] {
    if (!Array.isArray(task.assignees)) {
        return [];
    }

    const mapped: TaskAssignee[] = [];
    for (const assignee of task.assignees) {
        const userId = assignee.userId ?? assignee.user_id;
        if (!userId) {
            continue;
        }

        mapped.push({
            userId,
            email: assignee.email ?? undefined,
            firstName: assignee.firstName ?? assignee.first_name ?? undefined,
            lastName: assignee.lastName ?? assignee.last_name ?? undefined,
        });
    }

    return Array.from(new Map(mapped.map((assignee) => [assignee.userId, assignee])).values());
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getProjectTasks(
    projectId: string,
    params?: TaskListParams,
): Promise<PaginatedTaskResponse> {
    const { data } = await api.get<unknown>(
        `/tasks/projects/${projectId}/tasks`,
        { params },
    );
    const { rows, meta } = extractRows(data);

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
    const { data } = await api.post<unknown>(
        `/tasks/projects/${projectId}/tasks`,
        payload,
    );
    const normalized = normalizeTask(extractSingleTask(data));
    if (!normalized) {
        throw new Error('Create task response could not be parsed');
    }
    return normalized;
}

export async function getTaskById(taskId: string): Promise<TaskItem> {
    const { data } = await api.get<unknown>(`/tasks/${taskId}`);
    const normalized = normalizeTask(extractSingleTask(data));
    if (!normalized) {
        throw new Error('Task detail response could not be parsed');
    }
    return normalized;
}

export async function updateTask(
    taskId: string,
    payload: TaskUpdatePayload,
): Promise<TaskItem> {
    const { data } = await api.put<unknown>(`/tasks/${taskId}`, payload);
    const normalized = normalizeTask(extractSingleTask(data));
    if (!normalized) {
        throw new Error('Update task response could not be parsed');
    }
    return normalized;
}

export async function updateTaskStatus(taskId: string, status: string): Promise<TaskItem | null> {
    const { data } = await api.patch<unknown>(`/tasks/${taskId}/status`, { status });
    const normalized = normalizeTask(extractSingleTask(data));
    return normalized;
}
