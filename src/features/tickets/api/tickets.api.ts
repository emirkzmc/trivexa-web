import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TicketItem {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    assigneeId?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface TicketListParams {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assigneeId?: string;
}

export interface PaginatedTicketResponse {
    data: TicketItem[];
    total: number;
    page: number;
    limit: number;
}

export interface TicketCreatePayload {
    title: string;
    description: string;
    priority?: string;
}

export interface AssignTicketPayload {
    assigneeId: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getTickets(
    params?: TicketListParams,
): Promise<PaginatedTicketResponse> {
    const { data } = await api.get<PaginatedTicketResponse>('/tickets', { params });
    return data;
}

export async function getTicketById(id: string): Promise<TicketItem> {
    const { data } = await api.get<{ data: TicketItem }>(`/tickets/${id}`);
    return data.data;
}

export async function createTicket(payload: TicketCreatePayload): Promise<TicketItem> {
    const { data } = await api.post<{ data: TicketItem }>('/tickets', payload);
    return data.data;
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
