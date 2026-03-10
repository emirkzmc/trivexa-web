import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PersonnelItem {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    department: string;
    subDepartmentId?: string | null;
    subDepartmentName?: string | null;
    status: string;
    isActive: boolean;
    salary?: number;
    createdAt: string;
    updatedAt: string;
}

export interface PersonnelListParams {
    page?: number;
    limit?: number;
    department?: string;
    subDepartmentId?: string;
    role?: string;
    isActive?: string;
    search?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export interface PersonnelCreatePayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    subDepartmentId?: string;
}

export type PersonnelUpdatePayload =
    Omit<Partial<PersonnelCreatePayload>, 'subDepartmentId'>
    & { subDepartmentId?: string | null };

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getPersonnel(
    params: PersonnelListParams,
): Promise<PaginatedResponse<PersonnelItem>> {
    const { data } = await api.get<{ data: PaginatedResponse<PersonnelItem> }>(
        '/users',
        { params },
    );
    return data.data;
}

export async function getPersonnelById(id: string): Promise<PersonnelItem> {
    const { data } = await api.get<{ data: PersonnelItem }>(`/users/${id}`);
    return data.data;
}

export async function createPersonnel(
    payload: PersonnelCreatePayload,
): Promise<PersonnelItem> {
    const { data } = await api.post<{ data: PersonnelItem }>('/users', payload);
    return data.data;
}

export async function updatePersonnel(
    id: string,
    payload: PersonnelUpdatePayload,
): Promise<PersonnelItem> {
    const { data } = await api.put<{ data: PersonnelItem }>(
        `/users/${id}`,
        payload,
    );
    return data.data;
}

export async function deactivatePersonnel(id: string): Promise<void> {
    await api.patch(`/users/${id}/deactivate`);
}

export async function activatePersonnel(id: string): Promise<void> {
    await api.patch(`/users/${id}/activate`);
}

export async function exportPersonnel(
    params: PersonnelListParams,
): Promise<Blob> {
    const { data } = await api.get('/users/export/csv', {
        params,
        responseType: 'blob',
    });
    return data as Blob;
}
