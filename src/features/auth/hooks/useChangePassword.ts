import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { changePassword } from '../api/auth.api';
import type { ChangePasswordPayload } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export function useChangePassword() {
    const navigate = useNavigate();
    const setFirstLoginDone = () =>
        useAuthStore.setState({ isFirstLogin: false });

    return useMutation<void, Error, ChangePasswordPayload>({
        mutationFn: changePassword,
        onSuccess: () => {
            setFirstLoginDone();
            toast.success('Şifreniz başarıyla güncellendi', { duration: 3_000 });
            navigate('/app/dashboard', { replace: true });
        },
        onError: () => {
            toast.error('Şifre güncelleme sırasında bir hata oluştu', {
                duration: 4_000,
            });
        },
    });
}
