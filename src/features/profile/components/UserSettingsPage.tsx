import { Save, Settings } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { usePasswordChange } from '../hooks/usePasswordChange';
import { useProfileSettings } from '../hooks/useProfileSettings';
import { PasswordSettingsCard } from './PasswordSettingsCard';
import { ProfileSettingsCard } from './ProfileSettingsCard';

export function UserSettingsPage() {
  const {
    profileQuery,
    profileForm,
    setProfileForm,
    avatarSrc,
    avatarFit,
    avatarPosition,
    avatarLoadError,
    setAvatarLoadError,
    isAvatarUploading,
    isProfileSaving,
    handleAvatarChange,
    handleRemoveAvatar,
    saveProfile,
    authUser,
  } = useProfileSettings();

  const {
    passwordForm,
    setPasswordForm,
    passwordErrors,
    isPasswordSaving,
    savePassword,
  } = usePasswordChange();

  return (
    <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
      <PageHeader
        icon={<Settings size={20} color="#111827" />}
        title="Hesap Ayarlari"
        subtitle="Kisisel bilgiler ve guvenlik ayarlari"
        actions={(
          <button
            type="button"
            onClick={saveProfile}
            disabled={isProfileSaving}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={14} />
            Kaydet
          </button>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ProfileSettingsCard
          profile={profileQuery.data}
          profileForm={profileForm}
          onProfileFormChange={(patch) => setProfileForm((prev) => ({ ...prev, ...patch }))}
          avatarSrc={avatarSrc}
          avatarFit={avatarFit}
          avatarPosition={avatarPosition}
          avatarLoadError={avatarLoadError}
          onAvatarError={() => setAvatarLoadError(true)}
          onAvatarLoad={() => setAvatarLoadError(false)}
          onAvatarRetry={() => setAvatarLoadError(false)}
          onAvatarChange={handleAvatarChange}
          onAvatarRemove={handleRemoveAvatar}
          isAvatarUploading={isAvatarUploading}
          initials={authUser?.initials ?? '--'}
        />

        <PasswordSettingsCard
          passwordForm={passwordForm}
          passwordErrors={passwordErrors}
          isSaving={isPasswordSaving}
          onPasswordFormChange={(patch) => setPasswordForm((prev) => ({ ...prev, ...patch }))}
          onSave={savePassword}
        />
      </div>
    </div>
  );
}
