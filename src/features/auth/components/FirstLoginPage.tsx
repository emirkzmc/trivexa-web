import { AuthLayout } from './ui/AuthLayout';
import { AuthCard } from './ui/AuthCard';
import { useAuthStore } from '../store/authStore';
import { FirstLoginForm } from './FirstLoginForm';

export function FirstLoginPage() {
  const user = useAuthStore((s) => s.user);
  const isFirstLogin = useAuthStore((s) => s.isFirstLogin);

  if (!user || !isFirstLogin) {
    return null;
  }

  return (
    <AuthLayout>
      <AuthCard>
        <FirstLoginForm />
      </AuthCard>
    </AuthLayout>
  );
}
