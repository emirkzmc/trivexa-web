import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoleItem {
    id: string;
    name: string;
    description: string;
}

export interface PermissionItem {
    id: string;
    name: string;
    description: string;
}

export interface CreateRolePayload {
    name: string;
    description: string;
}

export interface UpdateRolePayload {
    name?: string;
    description?: string;
}

export interface AssignPermissionsPayload {
    roleId: string;
    permissionIds: string[];
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getRoles(): Promise<RoleItem[]> {
    const { data } = await api.get<{ data: RoleItem[] }>('/roles');
    return data.data;
}

export async function getRoleById(id: string): Promise<RoleItem> {
    const { data } = await api.get<{ data: RoleItem }>(`/roles/${id}`);
    return data.data;
}

export async function createRole(payload: CreateRolePayload): Promise<RoleItem> {
    const { data } = await api.post<{ data: RoleItem }>('/roles', payload);
    return data.data;
}

export async function updateRole(id: string, payload: UpdateRolePayload): Promise<RoleItem> {
    const { data } = await api.put<{ data: RoleItem }>(`/roles/${id}`, payload);
    return data.data;
}

export async function getPermissions(): Promise<PermissionItem[]> {
    const { data } = await api.get<{ data: PermissionItem[] }>('/permissions');
    return data.data;
}

export async function assignPermissions(payload: AssignPermissionsPayload): Promise<void> {
    await api.post('/roles/assign-permissions', payload);
}
