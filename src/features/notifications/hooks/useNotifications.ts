import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
} from '../api/notifications.api';
import type { NotificationListParams } from '../api/notifications.api';

const DEFAULT_LIMIT = 20;

/**
 * Bildirim listesi hook'u + mark as read mutation'ları.
 */
export function useNotifications() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const filters: NotificationListParams = {
        page: Number(searchParams.get('page')) || 1,
        limit: Number(searchParams.get('limit')) || DEFAULT_LIMIT,
    };

    const query = useQuery({
        queryKey: ['notifications', filters],
        queryFn: () => getNotifications(filters),
    });

    function setPage(page: number) {
        const next = new URLSearchParams(searchParams);
        next.set('page', String(page));
        setSearchParams(next, { replace: true });
    }

    const markReadMutation = useMutation({
        mutationFn: (id: string) => markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
            toast.success('Tüm bildirimler okundu olarak işaretlendi', { duration: 3_000 });
        },
    });

    return {
        ...query,
        filters,
        setPage,
        markAsRead: markReadMutation.mutate,
        markAllAsRead: markAllReadMutation.mutate,
    };
}
