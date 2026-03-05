import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuditLogItem {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    userId: string;
    userName?: string;
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
    const { data } = await api.get<any>('/audit', { params });
    
    // global response wrapper: { success: true, data: { data: [], meta: { itemCount, page, take } } }
    // OR raw pageDto depending on interceptor
    const pageDto = data?.data && typeof data.data === 'object' && 'data' in data.data 
        ? data.data 
        : data?.data ?? data;

    const rawItems = Array.isArray(pageDto?.data) ? pageDto.data : [];
    const items = rawItems.map((item: any) => ({
        id: item.id,
        action: item.action || '',
        entity: item.entityName || '',
        entityId: item.entityId || '',
        userId: item.userId || '',
        userName: item.userName || '',
        metadata: item.details,
        createdAt: item.timestamp || new Date().toISOString(),
    }));
    const meta = pageDto?.meta || {};

    return {
        data: items,
        total: typeof meta.itemCount === 'number' ? meta.itemCount : items.length,
        page: typeof meta.page === 'number' ? meta.page : params.page ?? 1,
        limit: typeof meta.take === 'number' ? meta.take : params.limit ?? 15,
    };
}
