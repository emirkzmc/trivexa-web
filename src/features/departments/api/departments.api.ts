import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DepartmentItem {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDepartmentPayload {
    name: string;
    description?: string;
}

export interface UpdateDepartmentPayload {
    name?: string;
    description?: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getDepartments(): Promise<DepartmentItem[]> {
    const { data } = await api.get<{ data: DepartmentItem[] }>('/departments');
    return data.data;
}

export async function getDepartmentById(id: string): Promise<DepartmentItem> {
    const { data } = await api.get<{ data: DepartmentItem }>(`/departments/${id}`);
    return data.data;
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<DepartmentItem> {
    const { data } = await api.post<{ data: DepartmentItem }>('/departments', payload);
    return data.data;
}

export async function updateDepartment(
    id: string,
    payload: UpdateDepartmentPayload,
): Promise<DepartmentItem> {
    const { data } = await api.patch<{ data: DepartmentItem }>(
        `/departments/${id}`,
        payload,
    );
    return data.data;
}
