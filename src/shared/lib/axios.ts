import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../../features/auth/store/authStore';
import { resolveErrorMessage } from '../constants/errorMessages';

// ─── Instance ────────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 15_000,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
    pendingQueue.forEach((p) => {
        if (token) p.resolve(token);
        else p.reject(error);
    });
    pendingQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const status = error.response?.status;

        // ── 401 — Token refresh ──────────────────────────────────
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({
                        resolve: (newToken: string) => {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            resolve(api(originalRequest));
                        },
                        reject,
                    });
                });
            }

            isRefreshing = true;

            try {
                const { refreshToken } = useAuthStore.getState();
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    { refreshToken },
                );

                const newToken: string = data.data?.accessToken ?? data.accessToken;
                const newRefreshToken: string | undefined =
                    data.data?.refreshToken ?? data.refreshToken;

                useAuthStore.getState().setToken(newToken);
                if (newRefreshToken) {
                    useAuthStore.setState({ refreshToken: newRefreshToken });
                }

                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ── 403 — Yetkisiz erişim → 404 sayfasına yönlendir ─────
        if (status === 403) {
            window.location.href = '/404';
            return Promise.reject(error);
        }

        // ── 429 — Rate limit → Retry-After süresini bekle ───────
        if (status === 429) {
            const retryAfter = Number(error.response?.headers?.['retry-after'] ?? 5);
            toast.error('Çok fazla istek gönderdiniz, lütfen biraz bekleyin', {
                duration: retryAfter * 1_000,
            });

            await new Promise((r) => setTimeout(r, retryAfter * 1_000));
            return api(originalRequest);
        }

        // ── Diğer hatalar → Sonner toast ─────────────────────────
        const shouldSkipToast = Boolean(originalRequest?.headers?.['x-skip-error-toast']);
        if (!shouldSkipToast) {
            const message = resolveErrorMessage(error);
            toast.error(message, { duration: 3_000 });
        }

        return Promise.reject(error);
    },
);

export default api;
