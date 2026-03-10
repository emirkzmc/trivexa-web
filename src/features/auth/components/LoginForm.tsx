import { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '../hooks/useLogin.ts';
import { AuthLayout } from './ui/AuthLayout';
import { AuthCard } from './ui/AuthCard';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import Loading from './ui/Loading.tsx';
import { Modal } from '../../../shared/components/Modal';
import { useAuthStore } from '../store/authStore';
import { FirstLoginForm } from './FirstLoginForm';

const loginSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta girin' }),
  password: z.string().min(1, { message: 'Şifre zorunludur' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const user = useAuthStore((s) => s.user);
  const isFirstLogin = useAuthStore((s) => s.isFirstLogin);
  const logout = useAuthStore((s) => s.logout);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate, isPending } = useLogin({
    onFirstLogin: () => setShowFirstLoginModal(true),
  });

  useEffect(() => {
    if (user && isFirstLogin) {
      setShowFirstLoginModal(true);
    }
  }, [user, isFirstLogin]);

  const onSubmit: SubmitHandler<LoginFormValues> = (values) => {
    mutate(values);
  };

  function handleFirstLoginCancel() {
    logout();
    setShowFirstLoginModal(false);
  }

  return (
    <AuthLayout>
      {isPending ? (
        <div className="py-10">
          <Loading variant="dots" />
        </div>
      ) : (
        <AuthCard>
          <div className="mb-6 flex justify-center">
            <Icon src="PersonIcon.svg" className="h-26 w-26" alt="Personel" />
          </div>

          <h1 className="mb-6 text-center text-2xl font-semibold">
            Personel Giriş
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 px-8">
            <div className="flex flex-col gap-4">
              <div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="E-posta"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Şifre"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Button type="submit" disabled={isPending}>
                GİRİŞ
              </Button>
            </div>
          </form>
        </AuthCard>
      )}
      {showFirstLoginModal && (
        <Modal title="Sifre Yenileme" onClose={handleFirstLoginCancel} width={520}>
          <FirstLoginForm onCancel={handleFirstLoginCancel} showHeader={false} />
        </Modal>
      )}
    </AuthLayout>
  );
}

