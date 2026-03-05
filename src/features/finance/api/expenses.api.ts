import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExpenseItem {
    id: string;
    description: string;
    amount: number;
    category?: string;
    status: string;
    createdBy: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExpensePayload {
    description: string;
    amount: number;
    category?: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getExpenses(): Promise<ExpenseItem[]> {
    const { data } = await api.get<{ data: ExpenseItem[] }>('/expenses');
    return data.data;
}

export async function getExpenseById(id: string): Promise<ExpenseItem> {
    const { data } = await api.get<{ data: ExpenseItem }>(`/expenses/${id}`);
    return data.data;
}

export async function createExpense(payload: CreateExpensePayload): Promise<ExpenseItem> {
    const { data } = await api.post<{ data: ExpenseItem }>('/expenses', payload);
    return data.data;
}

export async function approveExpense(id: string): Promise<void> {
    await api.patch(`/expenses/${id}/approve`);
}

export async function rejectExpense(id: string): Promise<void> {
    await api.patch(`/expenses/${id}/reject`);
}
