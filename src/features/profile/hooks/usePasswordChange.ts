import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changePassword } from '../../auth/api/auth.api';

interface PasswordFormState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const DEFAULT_PASSWORD_FORM: PasswordFormState = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function usePasswordChange() {
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(DEFAULT_PASSWORD_FORM);

  const passwordErrors = useMemo(() => {
    if (!passwordForm.newPassword && !passwordForm.confirmPassword && !passwordForm.oldPassword) return '';
    if (!passwordForm.oldPassword) return 'Eski sifre zorunludur.';
    if (!passwordForm.newPassword) return 'Yeni sifre zorunludur.';
    if (passwordForm.newPassword.length < 8) return 'Yeni sifre en az 8 karakter olmali.';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return 'Yeni sifreler eslesmiyor.';
    return '';
  }, [passwordForm]);

  const passwordMutation = useMutation({
    mutationFn: () => changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    }),
    onSuccess: () => {
      setPasswordForm(DEFAULT_PASSWORD_FORM);
      toast.success('Sifre guncellendi.');
    },
    onError: () => {
      toast.error('Sifre guncellenemedi.');
    },
  });

  function savePassword() {
    passwordMutation.mutate();
  }

  return {
    passwordForm,
    setPasswordForm,
    passwordErrors,
    isPasswordSaving: passwordMutation.isPending,
    savePassword,
  };
}
