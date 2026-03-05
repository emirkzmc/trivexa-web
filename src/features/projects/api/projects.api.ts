import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectItem {
    id: string;
    name: string;
    description: string | null;
    clientId: string | null;
    status: string;
    startDate: string | null;
    endDate?: string | null;
    deadline?: string | null;
    budget?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectListParams {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
    search?: string;
    myProjectsOnly?: boolean | string;
}

export interface PaginatedProjectResponse {
    data: ProjectItem[];
    total: number;
    page: number;
    limit: number;
}

type ProjectsPayload = {
    data?: ProjectItem[];
    total?: number;
    page?: number;
    limit?: number;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
};

function toProjectsPayload(value: unknown): ProjectsPayload {
    if (typeof value !== 'object' || value === null) return {};

    const raw = value as Record<string, unknown>;
    const nested = raw.data;

    if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
        return nested as ProjectsPayload;
    }

    return value as ProjectsPayload;
}

export interface ProjectCreatePayload {
    name: string;
    description: string;
    clientId: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
}

export type ProjectUpdatePayload = Partial<ProjectCreatePayload>;

export interface ProjectMember {
    userId: string;
    projectId: string;
    role: string;
    joinedAt: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getProjects(
    params?: ProjectListParams,
): Promise<PaginatedProjectResponse> {
    const { data } = await api.get<{ data?: ProjectsPayload } | ProjectsPayload>('/projects', { params });
    const payload = toProjectsPayload(data);

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const meta = (
        typeof payload.meta === 'object' &&
        payload.meta !== null
    )
        ? payload.meta
        : {};

    return {
        data: rows,
        total: typeof payload.total === 'number'
            ? payload.total
            : typeof meta.total === 'number'
                ? meta.total
                : rows.length,
        page: typeof payload.page === 'number'
            ? payload.page
            : typeof meta.page === 'number'
                ? meta.page
                : params?.page ?? 1,
        limit: typeof payload.limit === 'number'
            ? payload.limit
            : typeof meta.limit === 'number'
                ? meta.limit
                : params?.limit ?? 10,
    };
}

export async function getProjectById(id: string): Promise<ProjectItem> {
    const { data } = await api.get<{ data: ProjectItem }>(`/projects/${id}`);
    return data.data;
}

export async function createProject(payload: ProjectCreatePayload): Promise<ProjectItem> {
    const { data } = await api.post<{ data: ProjectItem }>('/projects', payload);
    return data.data;
}

export async function updateProject(
    id: string,
    payload: ProjectUpdatePayload,
): Promise<ProjectItem> {
    const { data } = await api.put<{ data: ProjectItem }>(`/projects/${id}`, payload);
    return data.data;
}

export async function updateProjectStatus(id: string, status: string): Promise<void> {
    await api.patch(`/projects/${id}/status`, { status });
}

export async function assignClientToProject(
    projectId: string,
    clientId: string,
): Promise<void> {
    await api.patch(`/projects/${projectId}/client`, { clientId });
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const { data } = await api.get<{ data: ProjectMember[] }>(`/projects/${projectId}/members`);
    return data.data;
}

export async function addProjectMember(
    projectId: string,
    userId: string,
    role?: string,
): Promise<ProjectMember> {
    const { data } = await api.post<{ data: ProjectMember }>(`/projects/${projectId}/members`, {
        userId,
        role,
    });
    return data.data;
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`);
}
