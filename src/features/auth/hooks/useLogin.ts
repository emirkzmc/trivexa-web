import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login } from "../api/auth.api";
import type { LoginCredentials, LoginResponse } from "../api/auth.api";
import { useAuthStore } from '../store/authStore';
import { ROLE_DASHBOARD_MAP } from '../../../shared/constants/roleDashboardMap';

interface UseLoginOptions {
  onFirstLogin?: () => void;
}

export function useLogin(options?: UseLoginOptions) {
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

      const isFirstLogin = !!(user as Record<string, unknown>)
        .forcePasswordChange;

      setAuth(accessToken, refreshToken, authUser, isFirstLogin);

      if (isFirstLogin) {
        options?.onFirstLogin?.();
        return;
      }

      const targetRoute = ROLE_DASHBOARD_MAP[user.role] || "/app/dashboard";
      navigate(targetRoute, { replace: true });
    },
    onError: () => {
      toast.error("E-posta veya şifre hatalı", { duration: 3_000 });
    },
  });
}
