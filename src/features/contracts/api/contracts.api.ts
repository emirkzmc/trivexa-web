import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContractItem {
    id: string;
    title: string;
    clientId: string;
    projectId?: string;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount?: number;
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

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getContracts(
    params?: ContractListParams,
): Promise<PaginatedContractResponse> {
    const { data } = await api.get<PaginatedContractResponse>('/contracts', { params });
    return data;
}

export async function getContractById(id: string): Promise<ContractItem> {
    const { data } = await api.get<{ data: ContractItem }>(`/contracts/${id}`);
    return data.data;
}

export async function createContract(payload: ContractCreatePayload): Promise<ContractItem> {
    const { data } = await api.post<{ data: ContractItem }>('/contracts', payload);
    return data.data;
}

export async function updateContractStatus(
    id: string,
    payload: UpdateContractStatusPayload,
): Promise<ContractItem> {
    const { data } = await api.patch<{ data: ContractItem }>(
        `/contracts/${id}/status`,
        payload,
    );
    return data.data;
}
