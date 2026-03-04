import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../features/auth/store/authStore';

function isHttpError(error: unknown, status: number): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const resp = (error as Record<string, unknown>).response;
    if (typeof resp !== 'object' || resp === null) return false;
    return (resp as Record<string, unknown>).status === status;
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1_000,       // 5 dakika
            gcTime: 10 * 60 * 1_000,          // 10 dakika
            retry: (failureCount, error) => {
                // 401 ve 403 hatasında retry yapma
                if (isHttpError(error, 401) || isHttpError(error, 403)) return false;
                return failureCount < 1;
            },
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false,
        },
    },
});

// ─── Global Error Handler ────────────────────────────────────────────────────

queryClient.getQueryCache().config.onError = (error) => {
    if (isHttpError(error, 401)) {
        useAuthStore.getState().logout();
        return;
    }
    if (isHttpError(error, 500)) {
        toast.error('Sunucu hatası, lütfen tekrar deneyin', { duration: 3_000 });
    }
};
