import api from '../../../shared/lib/axios';

export interface ContractItem {
    id: string;
    title: string;
    clientId: string;
    status: string;
    startDate: string;
    endDate?: string;
    value?: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ContractListParams {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
}

export interface PaginatedContractResponse {
    data: ContractItem[];
    total: number;
    page: number;
    limit: number;
}

export interface ContractCreatePayload {
    title: string;
    clientId: string;
    projectId?: string;
    startDate: string;
    endDate: string;
    totalAmount?: number;
}

export interface UpdateContractStatusPayload {
    status: string;
}

type MaybeWrapped<T> = { data?: T } | T;

function unwrapData<T>(payload: unknown): T {
    if (
        typeof payload === 'object'
        && payload !== null
        && 'data' in payload
        && (payload as { data?: unknown }).data !== undefined
    ) {
        return (payload as { data: unknown }).data as T;
    }

    return payload as T;
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

function toNumberValue(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function normalizeContract(raw: unknown): ContractItem {
    const row = toRecord(raw);

    return {
        id: toStringValue(row.id),
        title: toStringValue(row.title),
        clientId: toStringValue(row.clientId ?? row.client_id),
        status: toStringValue(row.status) || 'DRAFT',
        startDate: toStringValue(row.startDate ?? row.start_date),
        endDate: toStringValue(row.endDate ?? row.end_date) || undefined,
        value: toNumberValue(row.value ?? row.totalAmount ?? row.total_amount),
        description: toStringValue(row.description) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at),
    };
}

export async function getContracts(
    params?: ContractListParams,
): Promise<PaginatedContractResponse> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/contracts', { params });
    const payload = unwrapData<unknown>(data);

    const payloadRecord = toRecord(payload);
    const rowsRaw = Array.isArray(payload)
        ? payload
        : Array.isArray(payloadRecord.data)
            ? payloadRecord.data
            : Array.isArray(payloadRecord.items)
                ? payloadRecord.items
                : [];
    const meta = toRecord(payloadRecord.meta);

    return {
        data: rowsRaw.map((row) => normalizeContract(row)),
        total: Number(meta.total ?? payloadRecord.total ?? rowsRaw.length) || rowsRaw.length,
        page: Number(meta.page ?? payloadRecord.page ?? params?.page ?? 1) || 1,
        limit: Number(meta.limit ?? payloadRecord.limit ?? params?.limit ?? 20) || 20,
    };
}

export async function getContractById(id: string): Promise<ContractItem> {
    const { data } = await api.get<MaybeWrapped<unknown>>(`/contracts/${id}`);
    const payload = unwrapData<unknown>(data);
    return normalizeContract(payload);
}

export async function createContract(payload: ContractCreatePayload): Promise<ContractItem> {
    const { data } = await api.post<MaybeWrapped<unknown>>('/contracts', payload);
    const response = unwrapData<unknown>(data);
    return normalizeContract(response);
}

export async function updateContractStatus(
    id: string,
    payload: UpdateContractStatusPayload,
): Promise<ContractItem> {
    const { data } = await api.patch<MaybeWrapped<unknown>>(
        `/contracts/${id}/status`,
        payload,
    );
    const response = unwrapData<unknown>(data);
    return normalizeContract(response);
}
