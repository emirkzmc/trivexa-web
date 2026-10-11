import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { changePassword } from '../api/auth.api';
import type { ChangePasswordPayload } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { ROLE_DASHBOARD_MAP } from '../../../shared/constants/roleDashboardMap';

interface UseChangePasswordOptions {
  onSuccess?: () => void;
}

export function useChangePassword(options?: UseChangePasswordOptions) {
  const navigate = useNavigate();
  const setFirstLoginDone = () =>
    useAuthStore.setState({ isFirstLogin: false });
  const user = useAuthStore((s) => s.user);

  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: changePassword,
    onSuccess: () => {
      setFirstLoginDone();
      toast.success('Sifreniz basariyla guncellendi', { duration: 3_000 });
      options?.onSuccess?.();
      const targetRoute =
        (user?.role && ROLE_DASHBOARD_MAP[user.role]) || '/app/dashboard';
      navigate(targetRoute, { replace: true });
    },
    onError: () => {
      toast.error('Sifre guncelleme sirasinda bir hata olustu', {
        duration: 4_000,
      });
    },
  });
}
