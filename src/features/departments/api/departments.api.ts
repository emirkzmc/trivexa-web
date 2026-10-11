import api from '../../../shared/lib/axios';

export interface DepartmentModuleItem {
    id: string;
    departmentId: string;
    name: string;
    description?: string;
    teamLeadId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DepartmentItem {
    id: string;
    name: string;
    description?: string;
    managerId?: string;
    modules: DepartmentModuleItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateDepartmentPayload {
    name: string;
    description?: string;
    managerId?: string;
}

export interface UpdateDepartmentPayload {
    name?: string;
    description?: string;
    managerId?: string;
}

export interface CreateDepartmentModulePayload {
    name: string;
    description?: string;
    teamLeadId: string;
}

export interface UpdateDepartmentModulePayload {
    name?: string;
    description?: string;
    teamLeadId?: string;
}

interface ApiEnvelope<T> {
    data: T;
}

interface DepartmentModuleApiItem {
    id: string;
    departmentId?: string;
    department_id?: string;
    name: string;
    description?: string;
    teamLeadId?: string;
    team_lead_id?: string;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
}

interface DepartmentApiItem {
    id: string;
    name: string;
    description?: string;
    managerId?: string;
    manager_id?: string;
    modules?: DepartmentModuleApiItem[];
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
}

function unwrapEnvelope<T>(payload: T | ApiEnvelope<T>): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as ApiEnvelope<T>).data;
    }
    return payload as T;
}

function normalizeDepartmentModule(item: DepartmentModuleApiItem): DepartmentModuleItem {
    const nowIso = new Date().toISOString();

    return {
        id: item.id,
        departmentId: item.departmentId ?? item.department_id ?? '',
        name: item.name,
        description: item.description,
        teamLeadId: item.teamLeadId ?? item.team_lead_id,
        createdAt: item.createdAt ?? item.created_at ?? nowIso,
        updatedAt: item.updatedAt ?? item.updated_at ?? item.createdAt ?? item.created_at ?? nowIso,
    };
}

function normalizeDepartment(item: DepartmentApiItem): DepartmentItem {
    const nowIso = new Date().toISOString();

    return {
        id: item.id,
        name: item.name,
        description: item.description,
        managerId: item.managerId ?? item.manager_id,
        modules: (item.modules ?? []).map(normalizeDepartmentModule),
        createdAt: item.createdAt ?? item.created_at ?? nowIso,
        updatedAt: item.updatedAt ?? item.updated_at ?? item.createdAt ?? item.created_at ?? nowIso,
    };
}

export async function getDepartments(): Promise<DepartmentItem[]> {
    const { data } = await api.get<DepartmentApiItem[] | ApiEnvelope<DepartmentApiItem[]>>('/departments');
    return unwrapEnvelope(data).map(normalizeDepartment);
}

export async function getDepartmentById(id: string): Promise<DepartmentItem> {
    const { data } = await api.get<DepartmentApiItem | ApiEnvelope<DepartmentApiItem>>(`/departments/${id}`);
    return normalizeDepartment(unwrapEnvelope(data));
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<DepartmentItem> {
    const { data } = await api.post<DepartmentApiItem | ApiEnvelope<DepartmentApiItem>>('/departments', payload);
    return normalizeDepartment(unwrapEnvelope(data));
}

export async function updateDepartment(
    id: string,
    payload: UpdateDepartmentPayload,
): Promise<DepartmentItem> {
    const { data } = await api.patch<DepartmentApiItem | ApiEnvelope<DepartmentApiItem>>(
        `/departments/${id}`,
        payload,
    );
    return normalizeDepartment(unwrapEnvelope(data));
}

export async function createDepartmentModule(
    departmentId: string,
    payload: CreateDepartmentModulePayload,
): Promise<DepartmentModuleItem> {
    const { data } = await api.post<DepartmentModuleApiItem | ApiEnvelope<DepartmentModuleApiItem>>(
        `/departments/${departmentId}/modules`,
        payload,
    );
    return normalizeDepartmentModule(unwrapEnvelope(data));
}

export async function updateDepartmentModule(
    moduleId: string,
    payload: UpdateDepartmentModulePayload,
): Promise<DepartmentModuleItem> {
    const { data } = await api.patch<DepartmentModuleApiItem | ApiEnvelope<DepartmentModuleApiItem>>(
        `/departments/modules/${moduleId}`,
        payload,
    );
    return normalizeDepartmentModule(unwrapEnvelope(data));
}

export async function deleteDepartmentModule(moduleId: string): Promise<void> {
    await api.delete(`/departments/modules/${moduleId}`);
}
