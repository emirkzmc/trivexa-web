import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '../api/notifications.api';
import { useAuthStore } from '../../auth/store/authStore';

interface UseUnreadCountOptions {
    refetchInterval?: number;
}

/**
 * Okunmamış bildirim sayısı hook'u.
 * 30 saniyede bir polling yapar.
 * Sidebar badge bu hook'tan beslenir.
 */
export function useUnreadCount(options?: UseUnreadCountOptions) {
    const userId = useAuthStore((state) => state.user?.id);
    const token = useAuthStore((state) => state.token);

    return useQuery({
        queryKey: ['unread-count', userId],
        queryFn: getUnreadCount,
        enabled: Boolean(userId && token),
        placeholderData: 0,
        refetchOnMount: 'always',
        refetchOnReconnect: true,
        refetchInterval: options?.refetchInterval ?? 30_000,
    });
}
