import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '../api/auth.api';
import type { LoginCredentials, LoginResponse } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: login,
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data;

      const authUser = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        department: user.department,
      };

      const isFirstLogin = !!(response.data as Record<string, unknown>).isFirstLogin;

      setAuth(accessToken, refreshToken, authUser, isFirstLogin);

      if (isFirstLogin) {
        navigate('/app/first-login', { replace: true });
        return;
      }

      navigate('/app/dashboard', { replace: true });
    },
    onError: () => {
      toast.error('E-posta veya şifre hatalı', { duration: 3_000 });
    },
  });
}
