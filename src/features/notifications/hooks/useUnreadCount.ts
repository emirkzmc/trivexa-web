import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '../api/notifications.api';

/**
 * Okunmamış bildirim sayısı hook'u.
 * 30 saniyede bir polling yapar.
 * Sidebar badge bu hook'tan beslenir.
 */
export function useUnreadCount() {
    return useQuery({
        queryKey: ['unread-count'],
        queryFn: getUnreadCount,
        refetchInterval: 30_000,
    });
}
