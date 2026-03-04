import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export function useLogout() {
    const navigate = useNavigate();
    const refreshToken = useAuthStore((s) => s.refreshToken);
    const logoutStore = useAuthStore((s) => s.logout);

    return useMutation<void, Error>({
        mutationFn: () => {
            if (!refreshToken) return Promise.resolve();
            return logout(refreshToken);
        },
        onSettled: () => {
            // Başarılı veya başarısız, her durumda local state'i temizle
            logoutStore();
            navigate('/login', { replace: true });
        },
        onError: () => {
            toast.error('Çıkış yapılırken bir hata oluştu', { duration: 3_000 });
        },
    });
}
