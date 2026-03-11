import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { login } from "../api/auth.api";
import type { LoginCredentials, LoginResponse } from "../api/auth.api";
import { useAuthStore } from '../store/authStore';
import { ROLE_DASHBOARD_MAP } from '../../../shared/constants/roleDashboardMap';
import { normalizeRoleKey } from '../../../shared/utils/roleUtils';
import { ERROR_MESSAGES, resolveErrorMessage } from "../../../shared/constants/errorMessages";

interface UseLoginOptions {
  onFirstLogin?: () => void;
  onInvalidCredentials?: (message: string) => void;
}

function extractInvalidCredentialsMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  const err = error as AxiosError;
  const response = err.response as
    | { status?: number; data?: Record<string, unknown> }
    | undefined;
  const status = response?.status;
  const data = response?.data ?? {};
  const code = data.errorCode ?? data.code;
  const message = typeof data.message === "string" ? data.message.trim() : "";

  if (status === 401 || code === "INVALID_CREDENTIALS") {
    return message || ERROR_MESSAGES.INVALID_CREDENTIALS;
  }

  return null;
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
        avatarUrl: user.avatarUrl ?? null,
        avatarFit: user.avatarFit ?? null,
        avatarPosition: user.avatarPosition ?? null,
      };

      const isFirstLogin = !!(user as Record<string, unknown>)
        .forcePasswordChange;

      setAuth(accessToken, refreshToken, authUser, isFirstLogin);

      if (isFirstLogin) {
        options?.onFirstLogin?.();
        return;
      }

      const normalizedRole = normalizeRoleKey(user.role);
      const targetRoute = ROLE_DASHBOARD_MAP[user.role]
        || ROLE_DASHBOARD_MAP[normalizedRole]
        || "/app/dashboard";
      navigate(targetRoute, { replace: true });
    },
    onError: (error) => {
      const invalidMessage = extractInvalidCredentialsMessage(error);
      if (invalidMessage) {
        if (options?.onInvalidCredentials) {
          options.onInvalidCredentials(invalidMessage);
          return;
        }
        toast.error(invalidMessage, { duration: 3_000 });
        return;
      }
      toast.error(resolveErrorMessage(error), { duration: 3_000 });
    },
  });
}
