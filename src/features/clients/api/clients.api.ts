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

type ClientsPayload = {
    data?: unknown;
    total?: unknown;
    page?: unknown;
    limit?: unknown;
    meta?: {
        total?: unknown;
        page?: unknown;
        limit?: unknown;
    };
};

type MaybeWrapped<T> = { data?: T } | T;

function unwrapData<T>(payload: MaybeWrapped<T>): T {
    if (typeof payload === 'object' && payload !== null && 'data' in payload && payload.data !== undefined) {
        return payload.data as T;
    }
    return payload as T;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getClients(
    params: ClientListParams,
): Promise<PaginatedClientResponse> {
    const { data } = await api.get<MaybeWrapped<ClientsPayload>>('/clients', { params });
    const payload = unwrapData(data);
    const rows = Array.isArray(payload?.data) ? (payload.data as ClientItem[]) : [];
    const meta = (typeof payload?.meta === 'object' && payload.meta !== null) ? payload.meta : {};

    return {
        data: rows,
        total: typeof payload?.total === 'number'
            ? payload.total
            : typeof meta.total === 'number'
                ? meta.total
                : rows.length,
        page: typeof payload?.page === 'number'
            ? payload.page
            : typeof meta.page === 'number'
                ? meta.page
                : params.page ?? 1,
        limit: typeof payload?.limit === 'number'
            ? payload.limit
            : typeof meta.limit === 'number'
                ? meta.limit
                : params.limit ?? 20,
    };
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
