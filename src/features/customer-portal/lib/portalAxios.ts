import axios from 'axios';
import { toast } from 'sonner';
import { usePortalStore } from '../store/portalStore';
import { resolveErrorMessage } from '../../../shared/constants/errorMessages';

/**
 * Müşteri Portalı için izole edilmiş Axios instance.
 * Ana sistemin authStore'u veya token'ları ile ilgisi yoktur.
 */
const portalApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
        ? `${import.meta.env.VITE_API_BASE_URL}/portal`
        : '/api/portal',
    timeout: 15_000,
});

portalApi.interceptors.request.use((config) => {
    const token = usePortalStore.getState().portalToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

portalApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        // Portal token geçersizse direkt 404 sayfasına (veya portal hata sayfasına) at
        if (status === 401 || status === 403) {
            usePortalStore.getState().logout();
            window.location.href = '/404';
            return Promise.reject(error);
        }

        const message = resolveErrorMessage(error);
        toast.error(message, { duration: 3_000 });

        return Promise.reject(error);
    },
);

export default portalApi;
