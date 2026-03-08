import api from '../../../shared/lib/axios';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'OVERDUE';

export interface InvoiceLineItem {
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface InvoiceEntity {
    id: string;
    invoiceNumber: string;
    clientId: string;
    clientName?: string;
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
    items?: InvoiceLineItem[];
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
    const project = toRecord(row.project);
    const client = toRecord(row.client);

    return {
        id: toStringValue(row.id),
        invoiceNumber: toStringValue(row.invoiceNumber ?? row.invoice_number ?? row.id),
        clientId: toStringValue(row.clientId ?? row.client_id ?? client.id),
        clientName: toStringValue(row.clientName ?? row.client_name ?? client.companyName ?? client.company_name) || undefined,
        projectId: toStringValue(row.projectId ?? row.project_id ?? project.id) || undefined,
        projectName: toStringValue(
            row.projectName
            ?? row.project_name
            ?? project.name
            ?? project.projectName
            ?? project.project_name,
        ) || undefined,
        status: (toStringValue(row.status) || 'DRAFT') as InvoiceStatus,
        subtotal: toNumberValue(row.subtotal ?? row.total_amount ?? row.total),
        taxRate: toNumberValue(row.taxRate ?? row.tax_rate),
        taxAmount: toNumberValue(row.taxAmount ?? row.tax_amount),
        total: toNumberValue(row.total ?? row.total_amount),
        issueDate: toStringValue(row.issueDate ?? row.issue_date ?? row.createdAt ?? row.created_at) || undefined,
        dueDate: toStringValue(row.dueDate ?? row.due_date) || undefined,
        notes: toStringValue(row.notes) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at),
        items: Array.isArray(row.items)
            ? row.items.map((itemRaw) => {
                const item = toRecord(itemRaw);
                return {
                    id: toStringValue(item.id),
                    invoiceId: toStringValue(item.invoiceId ?? item.invoice_id),
                    description: toStringValue(item.description),
                    quantity: toNumberValue(item.quantity ?? 1),
                    unitPrice: toNumberValue(item.unitPrice ?? item.unit_price ?? item.total ?? item.amount),
                    total: toNumberValue(item.total ?? item.amount),
                };
            })
            : [],
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
