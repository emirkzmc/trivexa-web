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

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getNotifications(
    params: NotificationListParams,
): Promise<PaginatedNotificationResponse> {
    const { data } = await api.get<PaginatedNotificationResponse>(
        '/notifications',
        { params },
    );
    return data;
}

export async function getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ data: { count: number } }>(
        '/notifications/unread-count',
    );
    return data.data.count;
}

export async function markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
}
