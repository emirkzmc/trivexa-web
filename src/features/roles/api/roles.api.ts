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
    group?: string;
    description: string;
}

export interface CreateRolePayload {
    name: string;
    description?: string;
}

export interface UpdateRolePayload {
    name?: string;
    description?: string;
}

export interface AssignPermissionsPayload {
    roleId: string;
    permissionIds: string[];
}

interface ApiEnvelope<T> {
    data: T;
}

function unwrapApiEnvelope<T>(payload: T | ApiEnvelope<T>): T {
    if (
        payload
        && typeof payload === 'object'
        && 'data' in payload
    ) {
        return (payload as ApiEnvelope<T>).data;
    }

    return payload as T;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getRoles(): Promise<RoleItem[]> {
    const { data } = await api.get<RoleItem[] | ApiEnvelope<RoleItem[]>>('/roles');
    return unwrapApiEnvelope(data);
}

export async function getRoleById(id: string): Promise<RoleItem> {
    const { data } = await api.get<RoleItem | ApiEnvelope<RoleItem>>(`/roles/${id}`);
    return unwrapApiEnvelope(data);
}

export async function createRole(payload: CreateRolePayload): Promise<RoleItem> {
    const { data } = await api.post<RoleItem | ApiEnvelope<RoleItem>>('/roles', payload);
    return unwrapApiEnvelope(data);
}

export async function updateRole(id: string, payload: UpdateRolePayload): Promise<RoleItem> {
    const { data } = await api.put<RoleItem | ApiEnvelope<RoleItem>>(`/roles/${id}`, payload);
    return unwrapApiEnvelope(data);
}

export async function getPermissions(): Promise<PermissionItem[]> {
    const { data } = await api.get<PermissionItem[] | ApiEnvelope<PermissionItem[]>>('/permissions');
    return unwrapApiEnvelope(data);
}

export async function getRolePermissions(roleId: string): Promise<PermissionItem[]> {
    const { data } = await api.get<PermissionItem[] | ApiEnvelope<PermissionItem[]>>(`/roles/${roleId}/permissions`);
    return unwrapApiEnvelope(data);
}

export async function getMyPermissions(): Promise<PermissionItem[]> {
    const { data } = await api.get<PermissionItem[] | ApiEnvelope<PermissionItem[]>>('/users/me/permissions');
    return unwrapApiEnvelope(data);
}

export async function assignPermissions(payload: AssignPermissionsPayload): Promise<void> {
    await api.post('/roles/assign-permissions', payload);
}

export async function deleteRole(roleId: string): Promise<void> {
    await api.delete(`/roles/${roleId}`);
}
