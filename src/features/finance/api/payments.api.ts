import api from '../../../shared/lib/axios';

type MaybeWrapped<T> = { data?: T } | T;

export type PaymentCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';
export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'OTHER';

export interface PaymentItem {
    id: string;
    invoiceId: string;
    amount: number;
    paymentDate: string;
    method?: PaymentMethod | string;
    currency?: PaymentCurrency | string;
    reference?: string;
    notes?: string;
    receiptUrl?: string;
    recordedBy?: string;
    recordedByName?: string;
    invoiceNumber?: string;
    clientName?: string;
    createdAt: string;
}

export interface PaymentAuditItem {
    id: string;
    paymentId?: string;
    invoiceId?: string;
    action: string;
    userId?: string;
    userName?: string;
    details?: Record<string, unknown>;
    createdAt: string;
}

export interface PaymentAuditPage {
    data: PaymentAuditItem[];
    total: number;
    page: number;
    limit: number;
}

export interface PaymentAuditQueryParams {
    page?: number;
    limit?: number;
    sortDirection?: 'ASC' | 'DESC';
    eventType?: 'PAYMENT_CREATED' | 'PAYMENT_UPDATED' | 'PAYMENT_DELETED' | 'PAYMENT_REFUND_CREATED' | 'OTHER';
    startDate?: string;
    endDate?: string;
    userId?: string;
}

export interface CreatePaymentPayload {
    invoiceId: string;
    amount: number;
    currency?: PaymentCurrency;
    method: PaymentMethod;
    paymentDate?: string;
    reference?: string;
    notes?: string;
    receiptUrl?: string;
}

export interface UpdatePaymentPayload {
    amount?: number;
    method?: PaymentMethod;
    paymentDate?: string;
    reference?: string;
    notes?: string;
    receiptUrl?: string;
}

export interface RefundPaymentPayload {
    amount?: number;
    reason?: string;
    paymentDate?: string;
    receiptUrl?: string;
}

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

function toNumberValue(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function normalizePayment(raw: unknown): PaymentItem {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        invoiceId: toStringValue(row.invoiceId ?? row.invoice_id),
        amount: toNumberValue(row.amount),
        paymentDate: toStringValue(row.paymentDate ?? row.payment_date ?? row.createdAt ?? row.created_at),
        method: toStringValue(row.method) as PaymentMethod,
        currency: toStringValue(row.currency) as PaymentCurrency,
        reference: toStringValue(row.reference) || undefined,
        notes: toStringValue(row.notes) || undefined,
        receiptUrl: toStringValue(row.receiptUrl ?? row.receipt_url) || undefined,
        recordedBy: toStringValue(row.recordedBy ?? row.recorded_by) || undefined,
        recordedByName: toStringValue(row.recordedByName ?? row.recorded_by_name) || undefined,
        invoiceNumber: toStringValue(row.invoiceNumber ?? row.invoice_number) || undefined,
        clientName: toStringValue(row.clientName ?? row.client_name) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at ?? row.paymentDate ?? row.payment_date),
    };
}

function normalizePaymentAudit(raw: unknown): PaymentAuditItem {
    const row = toRecord(raw);
    const detailsRaw = row.details;
    const details = typeof detailsRaw === 'object' && detailsRaw !== null
        ? detailsRaw as Record<string, unknown>
        : undefined;

    return {
        id: toStringValue(row.id),
        paymentId: toStringValue(row.paymentId ?? row.payment_id) || undefined,
        invoiceId: toStringValue(row.invoiceId ?? row.invoice_id) || undefined,
        action: toStringValue(row.action) || 'OTHER',
        userId: toStringValue(row.userId ?? row.user_id) || undefined,
        userName: toStringValue(row.userName ?? row.user_name) || undefined,
        details,
        createdAt: toStringValue(row.createdAt ?? row.created_at ?? row.timestamp ?? new Date().toISOString()),
    };
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentItem> {
    const request: CreatePaymentPayload = {
        ...payload,
        currency: payload.currency ?? 'TRY',
    };
    const { data } = await api.post<MaybeWrapped<PaymentItem>>('/payments', request);
    const response = unwrapData<PaymentItem>(data);
    return normalizePayment(response);
}

export async function getPaymentsByInvoice(invoiceId: string): Promise<PaymentItem[]> {
    const { data } = await api.get<MaybeWrapped<PaymentItem[]>>(`/payments/invoice/${invoiceId}`);
    const payload = unwrapData<PaymentItem[]>(data);
    return Array.isArray(payload) ? payload.map(normalizePayment) : [];
}

export async function updatePayment(
    paymentId: string,
    payload: UpdatePaymentPayload,
): Promise<PaymentItem> {
    const { data } = await api.patch<MaybeWrapped<PaymentItem>>(`/payments/${paymentId}`, payload);
    const response = unwrapData<PaymentItem>(data);
    return normalizePayment(response);
}

export async function deletePayment(paymentId: string): Promise<void> {
    await api.delete(`/payments/${paymentId}`);
}

export async function refundPayment(
    paymentId: string,
    payload: RefundPaymentPayload,
): Promise<PaymentItem> {
    const { data } = await api.post<MaybeWrapped<PaymentItem>>(
        `/payments/${paymentId}/refund`,
        payload,
    );
    const response = unwrapData<PaymentItem>(data);
    return normalizePayment(response);
}

export async function getPaymentAuditByInvoice(
    invoiceId: string,
    params?: PaymentAuditQueryParams,
): Promise<PaymentAuditPage> {
    const { data } = await api.get<MaybeWrapped<PaymentAuditPage>>(
        `/payments/invoice/${invoiceId}/audit`,
        { params },
    );
    const payload = unwrapData<PaymentAuditPage>(data);
    const rows = Array.isArray(payload?.data) ? payload.data.map(normalizePaymentAudit) : [];
    return {
        data: rows,
        total: typeof payload?.total === 'number' ? payload.total : rows.length,
        page: typeof payload?.page === 'number' ? payload.page : params?.page ?? 1,
        limit: typeof payload?.limit === 'number' ? payload.limit : params?.limit ?? 20,
    };
}
