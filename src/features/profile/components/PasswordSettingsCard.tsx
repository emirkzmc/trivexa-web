import { Lock } from 'lucide-react';

interface PasswordSettingsCardProps {
  passwordForm: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  passwordErrors: string;
  isSaving: boolean;
  onPasswordFormChange: (patch: Partial<PasswordSettingsCardProps['passwordForm']>) => void;
  onSave: () => void;
}

export function PasswordSettingsCard({
  passwordForm,
  passwordErrors,
  isSaving,
  onPasswordFormChange,
  onSave,
}: PasswordSettingsCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Lock size={16} />
        Sifre Guncelle
      </div>
      <div className="grid gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Eski Sifre</label>
          <input
            type="password"
            value={passwordForm.oldPassword}
            onChange={(event) => onPasswordFormChange({ oldPassword: event.target.value })}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Yeni Sifre</label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) => onPasswordFormChange({ newPassword: event.target.value })}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Yeni Sifre (Tekrar)</label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) => onPasswordFormChange({ confirmPassword: event.target.value })}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
          />
        </div>
        {passwordErrors && (
          <p className="text-xs font-semibold text-rose-600">{passwordErrors}</p>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || Boolean(passwordErrors)}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Sifreyi Guncelle
        </button>
      </div>
    </section>
  );
}
