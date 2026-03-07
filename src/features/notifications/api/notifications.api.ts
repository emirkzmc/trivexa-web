import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationListParams {
    page?: number;
    limit?: number;
}

export interface PaginatedNotificationResponse {
    data: NotificationItem[];
    total: number;
    page: number;
    limit: number;
}

type MaybeWrapped<T> = { data?: T } | T;

type BackendNotificationItem = Partial<{
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    is_read: boolean;
    createdAt: string;
    created_at: string;
}>;

type BackendPagePayload = Partial<{
    data: BackendNotificationItem[];
    items: BackendNotificationItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    meta: Partial<{
        itemCount: number;
        page: number;
        limit: number;
        total: number;
    }>;
}>;

type BackendUnreadPayload = Partial<{
    count: number;
    unreadCount: number;
}> &
    Partial<{
        data: Partial<{
            count: number;
            unreadCount: number;
        }>;
    }>;

function unwrapData<T>(payload: MaybeWrapped<T>): T {
    if (typeof payload === 'object' && payload !== null && 'data' in payload && payload.data !== undefined) {
        return payload.data as T;
    }
    return payload as T;
}

function normalizeNotificationItem(item: BackendNotificationItem | null | undefined): NotificationItem | null {
    if (!item || !item.id) return null;

    return {
        id: item.id,
        title: item.title ?? '-',
        message: item.message ?? '',
        type: item.type ?? 'SYSTEM',
        isRead: item.isRead ?? item.is_read ?? false,
        createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    };
}

function normalizeNotificationPage(
    payload: BackendPagePayload | null | undefined,
    params: NotificationListParams,
): PaginatedNotificationResponse {
    if (!payload) {
        return {
            data: [],
            total: 0,
            page: params.page ?? 1,
            limit: params.limit ?? 20,
        };
    }

    const rows = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.items)
            ? payload.items
            : [];

    const data = rows
        .map((row) => normalizeNotificationItem(row))
        .filter((row): row is NotificationItem => !!row);

    const total = typeof payload.total === 'number'
        ? payload.total
        : (typeof payload.meta?.itemCount === 'number'
            ? payload.meta.itemCount
            : (typeof payload.meta?.total === 'number' ? payload.meta.total : data.length));

    const page = typeof payload.page === 'number'
        ? payload.page
        : (typeof payload.meta?.page === 'number' ? payload.meta.page : (params.page ?? 1));

    const limit = typeof payload.limit === 'number'
        ? payload.limit
        : (typeof payload.meta?.limit === 'number' ? payload.meta.limit : (params.limit ?? 20));

    return {
        data,
        total,
        page,
        limit,
    };
}

function normalizeUnreadCount(payload: BackendUnreadPayload | number | string | null | undefined): number {
    if (!payload) return 0;
    if (typeof payload === 'number') return Number.isFinite(payload) ? payload : 0;
    if (typeof payload === 'string') {
        const parsed = Number(payload);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof payload.count === 'number') return payload.count;
    if (typeof payload.unreadCount === 'number') return payload.unreadCount;
    if (typeof payload.data?.count === 'number') return payload.data.count;
    if (typeof payload.data?.unreadCount === 'number') return payload.data.unreadCount;
    return 0;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getNotifications(
    params: NotificationListParams,
): Promise<PaginatedNotificationResponse> {
    const { data } = await api.get<MaybeWrapped<BackendPagePayload>>(
        '/notifications',
        { params },
    );
    return normalizeNotificationPage(unwrapData(data), params);
}

export async function getUnreadCount(): Promise<number> {
    const { data } = await api.get<MaybeWrapped<BackendUnreadPayload | number | string>>(
        '/notifications/unread-count',
    );
    return normalizeUnreadCount(unwrapData(data));
}

export async function markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
}
