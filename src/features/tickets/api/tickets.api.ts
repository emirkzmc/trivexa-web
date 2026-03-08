import api from '../../../shared/lib/axios';

type MaybeWrapped<T> = { data?: T } | T;

export interface TicketItem {
    id: string;
    subject: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    createdBy: string;
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
    creatorEmail?: string;
    assigneeEmail?: string;
}

export interface SupportRequestItem {
    id: string;
    clientId: string;
    clientUserId: string;
    clientCompanyName: string;
    requesterEmail: string;
    subject: string;
    description: string;
    priority: string;
    type: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface TicketListParams {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    type?: string;
}

export interface SupportRequestListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    type?: string;
    clientId?: string;
}

export interface PaginatedTicketResponse {
    data: TicketItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface SupportRequestListResponse {
    data: SupportRequestItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface TicketCreatePayload {
    subject: string;
    description: string;
    type?: string;
    priority?: string;
}

export interface AssignTicketPayload {
    assigneeId: string;
}

function toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
    }
    return {};
}

function toStringValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return '';
}

function toNumberValue(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function unwrapData<T>(payload: MaybeWrapped<T>): T {
    if (
        typeof payload === 'object'
        && payload !== null
        && 'data' in payload
        && (payload as { data?: unknown }).data !== undefined
    ) {
        return (payload as { data: T }).data;
    }
    return payload as T;
}

function extractRowsAndMeta(payload: unknown): {
    rows: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
} {
    const first = unwrapData(payload as MaybeWrapped<unknown>);
    const firstRecord = toRecord(first);

    const rows = Array.isArray(firstRecord.data)
        ? firstRecord.data
        : Array.isArray(firstRecord.items)
            ? firstRecord.items
            : Array.isArray(first)
                ? first
                : [];

    const meta = toRecord(firstRecord.meta);
    const fallbackLimit = rows.length > 0 ? rows.length : 20;
    const total = toNumberValue(meta.total ?? firstRecord.total ?? rows.length);
    const page = Math.max(1, toNumberValue(meta.page ?? firstRecord.page ?? 1));
    const limit = Math.max(1, toNumberValue(meta.limit ?? firstRecord.limit ?? fallbackLimit));
    const totalPagesRaw = toNumberValue(meta.totalPages ?? firstRecord.totalPages);
    const totalPages = totalPagesRaw > 0 ? totalPagesRaw : Math.max(1, Math.ceil(total / limit));

    return { rows, total, page, limit, totalPages };
}

function normalizeTicket(raw: unknown): TicketItem {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        subject: toStringValue(row.subject),
        description: toStringValue(row.description),
        type: toStringValue(row.type).toUpperCase() || 'SUPPORT',
        priority: toStringValue(row.priority).toUpperCase() || 'MEDIUM',
        status: toStringValue(row.status).toUpperCase() || 'OPEN',
        createdBy: toStringValue(row.createdBy ?? row.created_by),
        assignedTo: toStringValue(row.assignedTo ?? row.assigned_to) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at),
        creatorEmail: toStringValue(row.creatorEmail ?? row.creator_email) || undefined,
        assigneeEmail: toStringValue(row.assigneeEmail ?? row.assignee_email) || undefined,
    };
}

function normalizeSupportRequest(raw: unknown): SupportRequestItem {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        clientId: toStringValue(row.clientId ?? row.client_id),
        clientUserId: toStringValue(row.clientUserId ?? row.client_user_id),
        clientCompanyName: toStringValue(row.clientCompanyName ?? row.client_company_name),
        requesterEmail: toStringValue(row.requesterEmail ?? row.requester_email),
        subject: toStringValue(row.subject),
        description: toStringValue(row.description),
        priority: toStringValue(row.priority).toUpperCase() || 'MEDIUM',
        type: toStringValue(row.type).toUpperCase() || 'SUPPORT',
        status: toStringValue(row.status).toUpperCase() || 'OPEN',
        createdAt: toStringValue(row.createdAt ?? row.created_at),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at),
    };
}

export async function getTickets(params: TicketListParams = {}): Promise<PaginatedTicketResponse> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/tickets', { params });
    const { rows, total, page, limit, totalPages } = extractRowsAndMeta(data);

    return {
        data: rows.map((row) => normalizeTicket(row)),
        total,
        page,
        limit,
        totalPages,
    };
}

export async function getSupportRequests(
    params: SupportRequestListParams = {},
): Promise<SupportRequestListResponse> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/clients/portal-requests', { params });
    const { rows, total, page, limit, totalPages } = extractRowsAndMeta(data);

    return {
        data: rows.map((row) => normalizeSupportRequest(row)),
        total,
        page,
        limit,
        totalPages,
    };
}

export async function getTicketById(id: string): Promise<TicketItem> {
    const { data } = await api.get<MaybeWrapped<unknown>>(`/tickets/${id}`);
    const payload = unwrapData(data);
    return normalizeTicket(payload);
}

export async function createTicket(payload: TicketCreatePayload): Promise<TicketItem> {
    const { data } = await api.post<MaybeWrapped<unknown>>('/tickets', payload);
    const responsePayload = unwrapData(data);
    return normalizeTicket(responsePayload);
}

export async function updateTicketStatus(id: string, status: string): Promise<void> {
    await api.patch(`/tickets/${id}/status`, { status });
}

export async function assignTicket(id: string, payload: AssignTicketPayload): Promise<void> {
    await api.patch(`/tickets/${id}/assign`, payload);
}

export async function approveTicket(id: string): Promise<void> {
    await api.patch(`/tickets/${id}/approve`);
}
