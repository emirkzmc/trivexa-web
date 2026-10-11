import api from '../../../shared/lib/axios';

export interface CustomerProjectItem {
    id: string;
    name: string;
    description?: string;
    status: string;
    budget?: number;
    startDate?: string;
    deadline?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomerProjectsDashboard {
    clientId?: string;
    activeProjects?: number;
    pendingInvoices?: number;
    unreadTickets?: number;
    projects: CustomerProjectItem[];
}

type MaybeWrapped<T> = { data?: T } | T;

function toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
    }
    return {};
}

function unwrapData<T>(payload: MaybeWrapped<T>): T {
    if (typeof payload === 'object' && payload !== null && 'data' in payload && payload.data !== undefined) {
        return payload.data as T;
    }
    return payload as T;
}

function toStringValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return '';
}

function toNumberValue(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function normalizeProject(raw: unknown): CustomerProjectItem {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id ?? row.projectId ?? row.project_id),
        name: toStringValue(row.name ?? row.project_name ?? row.title),
        description: toStringValue(row.description) || undefined,
        status: toStringValue(row.status) || 'DRAFT',
        budget: toNumberValue(row.budget),
        startDate: toStringValue(row.startDate ?? row.start_date) || undefined,
        deadline: toStringValue(row.deadline) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at) || undefined,
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at) || undefined,
    };
}

function resolveProjects(payload: Record<string, unknown>): unknown[] {
    if (Array.isArray(payload.projects)) return payload.projects;
    const nested = toRecord(payload.data);
    if (Array.isArray(nested.projects)) return nested.projects;
    if (Array.isArray(nested.data)) return nested.data;
    return [];
}

export async function getCustomerProjectsDashboard(): Promise<CustomerProjectsDashboard> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/portal/dashboard');
    const payload = unwrapData<unknown>(data);
    const record = toRecord(payload);

    const projectsRaw = resolveProjects(record);
    const projects = projectsRaw
        .map((item) => normalizeProject(item))
        .filter((item) => item.id && item.name);

    const activeProjects = toNumberValue(record.activeProjects ?? record.active_projects) ?? projects.length;
    const pendingInvoices = toNumberValue(record.pendingInvoices ?? record.pending_invoices);
    const unreadTickets = toNumberValue(record.unreadTickets ?? record.unread_tickets);
    const clientId = toStringValue(record.clientId ?? record.client_id) || undefined;

    return {
        clientId,
        activeProjects,
        pendingInvoices,
        unreadTickets,
        projects,
    };
}
