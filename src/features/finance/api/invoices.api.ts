import api from '../../../shared/lib/axios';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'OVERDUE';

export interface InvoiceEntity {
    id: string;
    invoiceNumber: string;
    clientId: string;
    projectId?: string;
    projectName?: string;
    status: InvoiceStatus | string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceListParams {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    clientId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
}

export interface InvoiceCreateItemPayload {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface InvoiceCreatePayload {
    clientId: string;
    projectId?: string;
    items: InvoiceCreateItemPayload[];
    taxRate?: number;
    currency?: 'TRY' | 'USD' | 'EUR';
    issueDate?: string;
    dueDate?: string;
    notes?: string;
}

export interface UpdateInvoiceStatusPayload {
    status: InvoiceStatus;
    notes?: string;
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

function toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
    }
    return {};
}

function normalizeInvoice(raw: unknown): InvoiceEntity {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        invoiceNumber: toStringValue(row.invoiceNumber),
        clientId: toStringValue(row.clientId),
        projectId: toStringValue(row.projectId) || undefined,
        projectName: toStringValue(row.projectName) || undefined,
        status: (toStringValue(row.status) || 'DRAFT') as InvoiceStatus,
        subtotal: toNumberValue(row.subtotal),
        taxRate: toNumberValue(row.taxRate),
        taxAmount: toNumberValue(row.taxAmount),
        total: toNumberValue(row.total),
        issueDate: toStringValue(row.issueDate) || undefined,
        dueDate: toStringValue(row.dueDate) || undefined,
        notes: toStringValue(row.notes) || undefined,
        createdAt: toStringValue(row.createdAt),
        updatedAt: toStringValue(row.updatedAt),
    };
}

export async function getInvoices(params?: InvoiceListParams): Promise<InvoiceEntity[]> {
    const { data } = await api.get<MaybeWrapped<InvoiceEntity[]>>('/invoices', { params });
    const payload = unwrapData<InvoiceEntity[]>(data);
    return Array.isArray(payload) ? payload.map(normalizeInvoice) : [];
}

export async function getInvoiceById(id: string): Promise<InvoiceEntity> {
    const { data } = await api.get<MaybeWrapped<InvoiceEntity>>(`/invoices/${id}`);
    const payload = unwrapData<InvoiceEntity>(data);
    return normalizeInvoice(payload);
}

export async function createInvoice(payload: InvoiceCreatePayload): Promise<InvoiceEntity> {
    const request: InvoiceCreatePayload = {
        ...payload,
        taxRate: payload.taxRate ?? 20,
        currency: payload.currency ?? 'TRY',
    };
    const { data } = await api.post<MaybeWrapped<InvoiceEntity>>('/invoices', request);
    const response = unwrapData<InvoiceEntity>(data);
    return normalizeInvoice(response);
}

export async function updateInvoiceStatus(
    id: string,
    payload: UpdateInvoiceStatusPayload,
): Promise<InvoiceEntity> {
    const { data } = await api.patch<MaybeWrapped<InvoiceEntity>>(`/invoices/${id}/status`, payload);
    const response = unwrapData<InvoiceEntity>(data);
    return normalizeInvoice(response);
}
