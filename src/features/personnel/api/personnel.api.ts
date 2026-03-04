import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PersonnelItem {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department: string;
    status: string;
    salary?: number;
    createdAt: string;
    updatedAt: string;
}

export interface PersonnelListParams {
    page?: number;
    limit?: number;
    dept?: string;
    role?: string;
    status?: string;
    search?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface PersonnelCreatePayload {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department: string;
    salary?: number;
}

export type PersonnelUpdatePayload = Partial<PersonnelCreatePayload>;

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getPersonnel(
    params: PersonnelListParams,
): Promise<PaginatedResponse<PersonnelItem>> {
    const { data } = await api.get<PaginatedResponse<PersonnelItem>>(
        '/users',
        { params },
    );
    return data;
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

export async function deletePersonnel(id: string): Promise<void> {
    await api.patch(`/users/${id}/deactivate`);
}

export async function exportPersonnel(
    params: PersonnelListParams,
): Promise<Blob> {
    const { data } = await api.get('/users/export', {
        params,
        responseType: 'blob',
    });
    return data as Blob;
}
