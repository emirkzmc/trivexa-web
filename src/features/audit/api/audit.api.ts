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
    const { data } = await api.get<unknown>('/audit', { params });

    interface AuditApiResponse {
        data?: {
            data?: unknown[];
            meta?: { itemCount?: number; page?: number; take?: number };
        } | unknown[];
    }
    
    // global response wrapper: { success: true, data: { data: [], meta: { itemCount, page, take } } }
    // OR raw pageDto depending on interceptor
    const responseData = (data as AuditApiResponse)?.data;
    const pageDto = responseData && typeof responseData === 'object' && 'data' in (responseData as object)
        ? (responseData as { data?: unknown[]; meta?: { itemCount?: number; page?: number; take?: number } })
        : { data: Array.isArray(responseData) ? responseData : [], meta: {} };

    const rawItems = Array.isArray(pageDto?.data) ? (pageDto.data as Record<string, unknown>[]) : [];
    const items = rawItems.map((item) => ({
        id: String(item.id ?? ''),
        action: String(item.action ?? ''),
        entity: String(item.entityName ?? ''),
        entityId: String(item.entityId ?? ''),
        userId: String(item.userId ?? ''),
        userName: String(item.userName ?? ''),
        metadata: item.details as Record<string, unknown> | undefined,
        createdAt: String(item.timestamp ?? new Date().toISOString()),
    }));
    const meta = pageDto?.meta || {};

    return {
        data: items,
        total: typeof meta.itemCount === 'number' ? meta.itemCount : items.length,
        page: typeof meta.page === 'number' ? meta.page : params.page ?? 1,
        limit: typeof meta.take === 'number' ? meta.take : params.limit ?? 15,
    };
}
