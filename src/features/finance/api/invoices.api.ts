import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InvoiceItem {
    id: string;
    invoiceNumber: string;
    clientId: string;
    projectId?: string;
    amount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceListParams {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
}

export interface PaginatedInvoiceResponse {
    data: InvoiceItem[];
    total: number;
    page: number;
    limit: number;
}

export interface InvoiceCreatePayload {
    clientId: string;
    projectId?: string;
    amount: number;
    dueDate: string;
}

export interface UpdateInvoiceStatusPayload {
    status: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getInvoices(
    params?: InvoiceListParams,
): Promise<PaginatedInvoiceResponse> {
    const { data } = await api.get<PaginatedInvoiceResponse>('/invoices', { params });
    return data;
}

export async function getInvoiceById(id: string): Promise<InvoiceItem> {
    const { data } = await api.get<{ data: InvoiceItem }>(`/invoices/${id}`);
    return data.data;
}

export async function createInvoice(payload: InvoiceCreatePayload): Promise<InvoiceItem> {
    const { data } = await api.post<{ data: InvoiceItem }>('/invoices', payload);
    return data.data;
}

export async function updateInvoiceStatus(
    id: string,
    payload: UpdateInvoiceStatusPayload,
): Promise<void> {
    await api.patch(`/invoices/${id}/status`, payload);
}
