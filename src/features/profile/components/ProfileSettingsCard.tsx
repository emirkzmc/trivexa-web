import type { CSSProperties } from 'react';
import { ImageUp, Mail, Trash2, User } from 'lucide-react';
import type { UpdateProfilePayload, UserProfile } from '../api/profile.api';

interface ProfileSettingsCardProps {
  profile: UserProfile | undefined;
  profileForm: UpdateProfilePayload;
  onProfileFormChange: (patch: Partial<UpdateProfilePayload>) => void;
  avatarSrc: string;
  avatarFit: CSSProperties['objectFit'];
  avatarPosition: CSSProperties['objectPosition'];
  avatarLoadError: boolean;
  onAvatarError: () => void;
  onAvatarLoad: () => void;
  onAvatarRetry: () => void;
  onAvatarChange: (file: File | null) => void;
  onAvatarRemove: () => void;
  isAvatarUploading: boolean;
  initials: string;
}

const avatarFitOptions = [
  { value: 'cover', label: 'Kapla' },
  { value: 'contain', label: 'Sigdir' },
];

const avatarPositionOptions = [
  { value: 'top left', label: 'Sol Ust' },
  { value: 'top', label: 'Ust' },
  { value: 'top right', label: 'Sag Ust' },
  { value: 'left', label: 'Sol' },
  { value: 'center', label: 'Merkez' },
  { value: 'right', label: 'Sag' },
  { value: 'bottom left', label: 'Sol Alt' },
  { value: 'bottom', label: 'Alt' },
  { value: 'bottom right', label: 'Sag Alt' },
];

export function ProfileSettingsCard({
  profile,
  profileForm,
  onProfileFormChange,
  avatarSrc,
  avatarFit,
  avatarPosition,
  avatarLoadError,
  onAvatarError,
  onAvatarLoad,
  onAvatarRetry,
  onAvatarChange,
  onAvatarRemove,
  isAvatarUploading,
  initials,
}: ProfileSettingsCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <User size={16} />
        Profil Bilgileri
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 flex flex-wrap items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100 shadow-sm">
                  {avatarSrc && !avatarLoadError ? (
                <img
                  src={avatarSrc}
                  alt="Profil fotografi"
                  className="h-full w-full"
                  style={{ objectFit: avatarFit, objectPosition: avatarPosition }}
                  onError={onAvatarError}
                  onLoad={onAvatarLoad}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                  {initials}
                </div>
              )}
            </div>
            {avatarSrc && avatarLoadError && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-rose-600">
                  Goruntu yuklenemedi.
                </span>
                <button
                  type="button"
                  onClick={onAvatarRetry}
                  className="text-[11px] font-semibold text-gray-600 underline"
                >
                  Tekrar dene
                </button>
              </div>
            )}
          </div>
          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600">Profil Fotografi</label>
              <label
                htmlFor="profile-avatar-upload"
                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-left transition hover:border-gray-400 hover:bg-gray-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                  <ImageUp size={18} className="text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">
                    Dosya sec
                  </span>
                  <span className="text-xs text-gray-500">PNG veya JPG, max 2MB</span>
                </div>
                <span className="ml-auto text-xs font-semibold text-gray-500">
                  Tikla
                </span>
              </label>
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                onChange={(event) => onAvatarChange(event.target.files?.[0] ?? null)}
                disabled={isAvatarUploading}
                className="sr-only"
              />
              <button
                type="button"
                onClick={onAvatarRemove}
                disabled={!profileForm.avatarUrl || isAvatarUploading}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={12} />
                Fotografi kaldir
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600">Goruntuleme</label>
                <div className="grid grid-cols-2 gap-2">
                  {avatarFitOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onProfileFormChange({ avatarFit: option.value })}
                      className={`h-9 rounded-lg border text-xs font-semibold transition ${
                        avatarFit === option.value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600">Konum</label>
                <div className="grid grid-cols-3 gap-2">
                  {avatarPositionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onProfileFormChange({ avatarPosition: option.value })}
                      className={`h-8 rounded-lg border text-[11px] font-semibold transition ${
                        avatarPosition === option.value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Ad</label>
          <input
            value={profile?.firstName ?? ''}
            readOnly
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Soyad</label>
          <input
            value={profile?.lastName ?? ''}
            readOnly
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-gray-600">E-posta</label>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-gray-400" />
            <input
              value={profile?.email ?? ''}
              readOnly
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Telefon</label>
          <input
            value={profileForm.phone || ''}
            onChange={(event) => onProfileFormChange({ phone: event.target.value })}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
            placeholder="+90 5xx xxx xx xx"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Adres</label>
          <input
            value={profileForm.address || ''}
            onChange={(event) => onProfileFormChange({ address: event.target.value })}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
            placeholder="Sehir, Ulke"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Rol</label>
          <input
            value={profile?.role ?? '-'}
            readOnly
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Departman</label>
          <input
            value={profile?.department ?? '-'}
            readOnly
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
          />
        </div>
      </div>
    </section>
  );
}
