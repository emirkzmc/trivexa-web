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
    deadline?: string;
    budget?: number;
}

export type ProjectUpdatePayload = Partial<ProjectCreatePayload>;

export interface ProjectMember {
    id?: string;
    userId: string;
    projectId: string;
    role: string;
    joinedAt: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}

type MaybeWrapped<T> = { data?: T } | T;

export interface ProjectGithubRepository {
    fullName: string;
    htmlUrl: string;
    description: string | null;
    defaultBranch: string;
    isPrivate: boolean;
    stars: number;
    forks: number;
    openIssues: number;
    pushedAt: string | null;
    language: string | null;
    ownerLogin?: string;
    ownerAvatarUrl?: string;
    ownerHtmlUrl?: string;
}

export interface ProjectGithubBranch {
    name: string;
    latestCommitSha: string | null;
    isProtected: boolean;
}

export interface ProjectGithubOverview {
    connected: boolean;
    linkedRepositoryUrl?: string | null;
    linkedRepositoryFullName?: string | null;
    hasCustomToken?: boolean;
    error?: string | null;
    repository: ProjectGithubRepository | null;
    branches: ProjectGithubBranch[];
}

export interface ProjectGithubCommit {
    sha: string;
    shortSha: string | null;
    htmlUrl: string | null;
    message: string;
    authorName: string;
    authorEmail: string | null;
    authorAvatarUrl: string | null;
    committedAt: string | null;
}

export interface ProjectGithubCommitsResponse {
    connected: boolean;
    linkedRepositoryUrl?: string | null;
    linkedRepositoryFullName?: string | null;
    branch: string | null;
    page: number;
    perPage: number;
    commits: ProjectGithubCommit[];
    error?: string | null;
}

export interface ProjectGithubCommitsParams {
    branch?: string;
    page?: number;
    perPage?: number;
}

export interface ProjectCodeProcessTaskSummary {
    total: number;
    byStatus: {
        TODO: number;
        IN_PROGRESS: number;
        IN_REVIEW: number;
        BLOCKED: number;
        DONE: number;
    };
    doneThisWeek: number;
}

export interface ProjectCodeProcessRecentTask {
    id: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: string;
    dueDate?: string | null;
    assignee?: {
        id: string;
        email?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    } | null;
}

export interface ProjectCodeProcessTaskSnapshot {
    summary: ProjectCodeProcessTaskSummary;
    recentTasks: ProjectCodeProcessRecentTask[];
}

export interface ProjectCodeProcessesQuality {
    reviewQueue: { count: number; state: 'OK' | 'WARNING' | 'CRITICAL' };
    blockers: { count: number; state: 'OK' | 'WARNING' | 'CRITICAL' };
    weeklyThroughput: { doneThisWeek: number; state: 'OK' | 'WARNING' | 'CRITICAL' };
    completion: { total: number; done: number; ratio: number };
}

export interface ProjectCodeProcessesResponse {
    project: { id: string; name: string; status: string };
    generatedAt: string;
    tasks: ProjectCodeProcessTaskSnapshot;
    github: {
        overview: ProjectGithubOverview;
        commits: ProjectGithubCommitsResponse;
        errors?: {
            overview?: string | null;
            commits?: string | null;
        };
    };
    quality: ProjectCodeProcessesQuality;
}

export interface ProjectCodeProcessesParams {
    branch?: string;
    commitsPerPage?: number;
    recentTaskLimit?: number;
}

export interface UpdateProjectGithubRepositoryPayload {
    githubUrl: string;
    accessToken?: string;
    clearAccessToken?: boolean;
}

export interface UpdateProjectGithubRepositoryResponse {
    projectId?: string;
    repositoryUrl: string;
    repositoryFullName: string;
    hasCustomToken?: boolean;
    updatedAt?: string;
}

type BackendProject = Partial<{
    id: string;
    name: string;
    project_name: string;
    title: string;
    description: string | null;
    clientId: string | null;
    client_id: string | null;
    status: string;
    startDate: string | null;
    start_date: string | null;
    endDate: string | null;
    end_date: string | null;
    deadline: string | null;
    budget: number | string | null;
    createdAt: string;
    created_at: string;
    updatedAt: string;
    updated_at: string;
}>;

type BackendProjectMember = Partial<{
    id: string;
    userId: string;
    user_id: string;
    projectId: string;
    project_id: string;
    role: string;
    joinedAt: string;
    joined_at: string;
    email: string | null;
    firstName: string | null;
    first_name: string | null;
    lastName: string | null;
    last_name: string | null;
}>;

function unwrapData<T>(payload: MaybeWrapped<T>): T {
    if (typeof payload === 'object' && payload !== null && 'data' in payload && payload.data !== undefined) {
        return payload.data as T;
    }
    return payload as T;
}

function normalizeProject(project: BackendProject | null | undefined): ProjectItem | null {
    const projectName = project?.name ?? project?.project_name ?? project?.title;
    if (!project?.id || !projectName) {
        return null;
    }

    const budget = typeof project.budget === 'string'
        ? Number(project.budget)
        : project.budget;

    return {
        id: project.id,
        name: projectName,
        description: project.description ?? null,
        clientId: project.clientId ?? project.client_id ?? null,
        status: project.status ?? 'DRAFT',
        startDate: project.startDate ?? project.start_date ?? null,
        endDate: project.endDate ?? project.end_date ?? null,
        deadline: project.deadline ?? null,
        budget: typeof budget === 'number' && Number.isFinite(budget) ? budget : undefined,
        createdAt: project.createdAt ?? project.created_at,
        updatedAt: project.updatedAt ?? project.updated_at,
    };
}

function normalizeProjectMember(member: BackendProjectMember | null | undefined): ProjectMember | null {
    if (!member) {
        return null;
    }

    const userId = member.userId ?? member.user_id;
    const projectId = member.projectId ?? member.project_id;
    const joinedAt = member.joinedAt ?? member.joined_at;

    if (!userId || !projectId || !joinedAt) {
        return null;
    }

    return {
        id: member.id,
        userId,
        projectId,
        role: member.role ?? 'MEMBER',
        joinedAt,
        email: member.email ?? undefined,
        firstName: member.firstName ?? member.first_name ?? undefined,
        lastName: member.lastName ?? member.last_name ?? undefined,
    };
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getProjects(
    params?: ProjectListParams,
): Promise<PaginatedProjectResponse> {
    const safeParams: ProjectListParams | undefined = params
        ? {
            ...params,
            limit: typeof params.limit === 'number'
                ? Math.min(Math.max(params.limit, 1), 100)
                : params.limit,
        }
        : params;

    const { data } = await api.get<{ data?: ProjectsPayload } | ProjectsPayload>('/projects', { params: safeParams });
    const payload = toProjectsPayload(data);

    const rows = Array.isArray(payload.data)
        ? payload.data
            .map((item) => normalizeProject(item as BackendProject))
            .filter((item): item is ProjectItem => !!item)
        : [];
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
    const { data } = await api.get<MaybeWrapped<unknown>>(`/projects/${id}`);
    const payload = unwrapData<unknown>(data);
    const candidate = (
        typeof payload === 'object'
        && payload !== null
        && 'project' in payload
    )
        ? (payload as { project: BackendProject }).project
        : (payload as BackendProject);
    const normalized = normalizeProject(candidate);
    if (!normalized) {
        throw new Error('Project response could not be parsed');
    }
    return normalized;
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
    const { data } = await api.get<MaybeWrapped<unknown>>(`/projects/${projectId}/members`);
    const payload = unwrapData(data);

    const rows = Array.isArray(payload)
        ? payload
        : (
            typeof payload === 'object' &&
            payload !== null &&
            'data' in payload &&
            Array.isArray((payload as Record<string, unknown>).data)
        )
            ? (payload as { data: unknown[] }).data
            : [];

    return rows
        .map((row) => normalizeProjectMember(row as BackendProjectMember))
        .filter((row): row is ProjectMember => !!row);
}

export async function addProjectMember(
    projectId: string,
    userId: string,
    role?: string,
): Promise<ProjectMember> {
    const { data } = await api.post<MaybeWrapped<BackendProjectMember>>(`/projects/${projectId}/members`, {
        userId,
        role,
    });
    const normalized = normalizeProjectMember(unwrapData(data));
    if (!normalized) {
        throw new Error('Project member response could not be parsed');
    }
    return normalized;
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`);
}

export async function updateProjectGithubRepository(
    projectId: string,
    payload: string | UpdateProjectGithubRepositoryPayload,
): Promise<UpdateProjectGithubRepositoryResponse> {
    const requestBody: UpdateProjectGithubRepositoryPayload = typeof payload === 'string'
        ? { githubUrl: payload }
        : payload;

    const { data } = await api.patch<MaybeWrapped<UpdateProjectGithubRepositoryResponse>>(
        `/projects/${projectId}/github`,
        requestBody,
    );
    return unwrapData(data);
}

export async function getProjectGithubOverview(
    projectId: string,
): Promise<ProjectGithubOverview> {
    const { data } = await api.get<MaybeWrapped<ProjectGithubOverview>>(
        `/projects/${projectId}/github`,
    );
    return unwrapData(data);
}

export async function getProjectGithubCommits(
    projectId: string,
    params?: ProjectGithubCommitsParams,
): Promise<ProjectGithubCommitsResponse> {
    const { data } = await api.get<MaybeWrapped<ProjectGithubCommitsResponse>>(
        `/projects/${projectId}/github/commits`,
        { params },
    );
    return unwrapData(data);
}

export async function getProjectCodeProcesses(
    projectId: string,
    params?: ProjectCodeProcessesParams,
): Promise<ProjectCodeProcessesResponse> {
    const { data } = await api.get<MaybeWrapped<ProjectCodeProcessesResponse>>(
        `/projects/${projectId}/code-processes`,
        { params },
    );
    return unwrapData(data);
}
