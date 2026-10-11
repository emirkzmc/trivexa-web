import api from '../../../shared/lib/axios';

type MaybeWrapped<T> = { data?: T } | T;

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
export type ExpenseCategory = 'OFFICE' | 'TRAVEL' | 'SOFTWARE' | 'MEALS' | 'OTHER';
export type ExpenseCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

export interface ExpenseItem {
    id: string;
    description: string;
    amount: number;
    currency: ExpenseCurrency | string;
    category: ExpenseCategory | string;
    status: ExpenseStatus | string;
    department: string;
    expenseDate: string;
    requestedBy: string;
    approvedBy?: string;
    receiptUrl?: string;
    requesterName?: string;
    approverName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExpensePayload {
    description: string;
    amount: number;
    currency?: ExpenseCurrency;
    category: ExpenseCategory;
    department: string;
    expenseDate?: string;
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

function normalizeExpense(raw: unknown): ExpenseItem {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        description: toStringValue(row.description),
        amount: toNumberValue(row.amount),
        currency: (toStringValue(row.currency) || 'TRY') as ExpenseCurrency,
        category: (toStringValue(row.category) || 'OTHER') as ExpenseCategory,
        status: (toStringValue(row.status) || 'PENDING') as ExpenseStatus,
        department: toStringValue(row.department),
        expenseDate: toStringValue(row.expenseDate ?? row.expense_date ?? row.createdAt ?? row.created_at),
        requestedBy: toStringValue(row.requestedBy ?? row.requested_by),
        approvedBy: toStringValue(row.approvedBy ?? row.approved_by) || undefined,
        receiptUrl: toStringValue(row.receiptUrl ?? row.receipt_url) || undefined,
        requesterName: toStringValue(row.requesterName ?? row.requester_name) || undefined,
        approverName: toStringValue(row.approverName ?? row.approver_name) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at ?? row.expenseDate ?? row.expense_date),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at),
    };
}

export async function getExpenses(): Promise<ExpenseItem[]> {
    const { data } = await api.get<MaybeWrapped<ExpenseItem[]>>('/expenses');
    const payload = unwrapData<ExpenseItem[]>(data);
    return Array.isArray(payload) ? payload.map(normalizeExpense) : [];
}

export async function getExpenseById(id: string): Promise<ExpenseItem> {
    const { data } = await api.get<MaybeWrapped<ExpenseItem>>(`/expenses/${id}`);
    const payload = unwrapData<ExpenseItem>(data);
    return normalizeExpense(payload);
}

export async function createExpense(payload: CreateExpensePayload): Promise<ExpenseItem> {
    const request: CreateExpensePayload = {
        ...payload,
        currency: payload.currency ?? 'TRY',
    };
    const { data } = await api.post<MaybeWrapped<ExpenseItem>>('/expenses', request);
    const response = unwrapData<ExpenseItem>(data);
    return normalizeExpense(response);
}

export async function approveExpense(id: string): Promise<ExpenseItem> {
    const { data } = await api.patch<MaybeWrapped<ExpenseItem>>(`/expenses/${id}/approve`);
    const response = unwrapData<ExpenseItem>(data);
    return normalizeExpense(response);
}

export async function rejectExpense(id: string): Promise<ExpenseItem> {
    const { data } = await api.patch<MaybeWrapped<ExpenseItem>>(`/expenses/${id}/reject`);
    const response = unwrapData<ExpenseItem>(data);
    return normalizeExpense(response);
}

export async function updateExpenseReceipt(id: string, receiptUrl?: string): Promise<ExpenseItem> {
    const { data } = await api.patch<MaybeWrapped<ExpenseItem>>(`/expenses/${id}/receipt`, {
        receiptUrl,
    });
    const response = unwrapData<ExpenseItem>(data);
    return normalizeExpense(response);
}
