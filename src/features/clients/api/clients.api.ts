import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClientItem {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    status: string;
    accountManagerId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClientListParams {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    accountManagerId?: string;
}

export interface PaginatedClientResponse {
    data: ClientItem[];
    total: number;
    page: number;
    limit: number;
}

export interface ClientCreatePayload {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
}

export type ClientUpdatePayload = Partial<ClientCreatePayload>;

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getClients(
    params: ClientListParams,
): Promise<PaginatedClientResponse> {
    const { data } = await api.get<PaginatedClientResponse>('/clients', { params });
    return data;
}

export async function getClientById(id: string): Promise<ClientItem> {
    const { data } = await api.get<{ data: ClientItem }>(`/clients/${id}`);
    return data.data;
}

export async function createClient(payload: ClientCreatePayload): Promise<ClientItem> {
    const { data } = await api.post<{ data: ClientItem }>('/clients', payload);
    return data.data;
}

export async function updateClient(
    id: string,
    payload: ClientUpdatePayload,
): Promise<ClientItem> {
    const { data } = await api.put<{ data: ClientItem }>(
        `/clients/${id}`,
        payload,
    );
    return data.data;
}

export async function deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
}


export async function generatePortalAccess(email: string): Promise<{ portalUrl: string }> {
    const { data } = await api.post<{ data: { portalUrl: string } }>(
        `/clients/users/access-link`,
        { email },
    );
    return data.data;
}
