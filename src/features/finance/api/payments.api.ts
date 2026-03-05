import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentItem {
    id: string;
    invoiceId: string;
    amount: number;
    paymentDate: string;
    method?: string;
    createdAt: string;
}

export interface CreatePaymentPayload {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    method?: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentItem> {
    const { data } = await api.post<{ data: PaymentItem }>('/payments', payload);
    return data.data;
}

export async function getPaymentsByInvoice(invoiceId: string): Promise<PaymentItem[]> {
    const { data } = await api.get<{ data: PaymentItem[] }>(
        `/payments/invoice/${invoiceId}`,
    );
    return data.data;
}
