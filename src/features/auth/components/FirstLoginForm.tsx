import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useChangePassword } from '../hooks/useChangePassword';

const firstLoginSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: 'Mevcut sifre zorunludur',
    }),
    newPassword: z.string().min(8, {
      message: 'Yeni sifre en az 8 karakter olmali',
    }),
    confirmPassword: z.string().min(1, {
      message: 'Sifre tekrar zorunludur',
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Sifreler eslesmiyor',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Yeni sifre mevcut sifreden farkli olmali',
    path: ['newPassword'],
  });

type FirstLoginFormValues = z.infer<typeof firstLoginSchema>;

interface FirstLoginFormProps {
  onCancel?: () => void;
  showHeader?: boolean;
}

export function FirstLoginForm({
  onCancel,
  showHeader = true,
}: FirstLoginFormProps) {
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

  return (
    <>
      {showHeader && (
        <>
          <h1 className="mb-2 text-center text-2xl font-semibold">
            Ilk Giris - Sifre Belirleme
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Devam edebilmek icin yeni bir sifre belirlemeniz gerekir.
          </p>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="current-password">Mevcut Sifre</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            placeholder="Gecici sifreniz"
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="new-password">Yeni Sifre</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="Yeni sifreniz"
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="new-password-confirm">Yeni Sifre (tekrar)</Label>
          <Input
            id="new-password-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Yeni sifrenizi tekrar girin"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} fullWidth={false}>
              Vazgec
            </Button>
          )}
          <Button type="submit" disabled={isPending} fullWidth={false}>
            {isPending ? 'Kaydediliyor...' : 'SIFREYI GUNCELLE'}
          </Button>
        </div>
      </form>
    </>
  );
}
