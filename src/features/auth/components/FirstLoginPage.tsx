import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { AuthLayout } from './ui/AuthLayout';
import { AuthCard } from './ui/AuthCard';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useAuthStore } from '../store/authStore';
import { useChangePassword } from '../hooks/useChangePassword';

// ─── Validation ──────────────────────────────────────────────────────────────

const firstLoginSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: 'Mevcut şifre zorunludur',
    }),
    newPassword: z.string().min(8, {
      message: 'Yeni şifre en az 8 karakter olmalıdır',
    }),
    confirmPassword: z.string().min(1, {
      message: 'Şifre tekrar zorunludur',
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Yeni şifre mevcut şifreden farklı olmalıdır',
    path: ['newPassword'],
  });

type FirstLoginFormValues = z.infer<typeof firstLoginSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export function FirstLoginPage() {
  const user = useAuthStore((s) => s.user);
  const isFirstLogin = useAuthStore((s) => s.isFirstLogin);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FirstLoginFormValues>({
    resolver: zodResolver(firstLoginSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { mutate, isPending } = useChangePassword();

  const onSubmit: SubmitHandler<FirstLoginFormValues> = (values) => {
    mutate({
      oldPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  // İlk giriş değilse bu sayfaya erişim yok
  if (!user || !isFirstLogin) {
    return null;
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="mb-2 text-center text-2xl font-semibold">
          İlk Giriş - Şifre Belirleme
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Devam edebilmek için yeni bir şifre belirlemeniz gerekir.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="current-password">Mevcut şifre</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              placeholder="Geçici şifreniz"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="new-password">Yeni şifre</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Yeni şifreniz"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="new-password-confirm">Yeni şifre (tekrar)</Label>
            <Input
              id="new-password-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Yeni şifrenizi tekrar girin"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'ŞİFREYİ GÜNCELLE'}
            </Button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
