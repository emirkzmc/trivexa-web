import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuditLogItem {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    userId: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface AuditLogParams {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    userId?: string;
}

export interface PaginatedAuditResponse {
    data: AuditLogItem[];
    total: number;
    page: number;
    limit: number;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getAuditLogs(
    params: AuditLogParams,
): Promise<PaginatedAuditResponse> {
    const { data } = await api.get<PaginatedAuditResponse>('/audit', { params });
    return data;
}
