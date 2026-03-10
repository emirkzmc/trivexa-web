import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageUp, Lock, Mail, Save, Settings, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAuthStore } from '../../auth/store/authStore';
import { changePassword } from '../../auth/api/auth.api';
import {
  getMyProfile,
  updateMyProfile,
  uploadProfileAvatar,
  type UpdateProfilePayload,
} from '../api/profile.api';

export function UserSettingsPage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({
    phone: '',
    address: '',
    avatarUrl: '',
    avatarFit: 'cover',
    avatarPosition: 'center',
  });
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profileQuery.data) {
      setProfileForm({
        phone: profileQuery.data.phone || '',
        address: profileQuery.data.address || '',
        avatarUrl: profileQuery.data.avatarUrl || '',
        avatarFit: profileQuery.data.avatarFit || 'cover',
        avatarPosition: profileQuery.data.avatarPosition || 'center',
      });
    }
  }, [profileQuery.data]);

  const profileMutation = useMutation({
    mutationFn: () => updateMyProfile(profileForm),
    onSuccess: (data) => {
      queryClient.setQueryData(['my-profile'], data);
      setUser({
        id: data.id,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        role: data.role,
        department: data.department ?? '',
        avatarUrl: data.avatarUrl ?? null,
        avatarFit: data.avatarFit ?? null,
        avatarPosition: data.avatarPosition ?? null,
      });
      toast.success('Profil bilgileri guncellendi.');
    },
    onError: () => {
      toast.error('Profil bilgileri guncellenemedi.');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    }),
    onSuccess: () => {
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Sifre guncellendi.');
    },
    onError: () => {
      toast.error('Sifre guncellenemedi.');
    },
  });

  const isProfileSaving = profileMutation.isPending || isAvatarUploading;
  const isPasswordSaving = passwordMutation.isPending;

  const avatarSrc = useMemo(() => {
    const raw = (profileForm.avatarUrl || '').trim();
    if (!raw) return '';
    const normalized = raw.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalized)) return normalized;
    const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
    let base = envBase ? envBase.replace(/\/+$/, '') : '';
    if (base.endsWith('/api/v1')) {
      base = base.replace(/\/api\/v1$/, '');
    } else if (base.endsWith('/api')) {
      base = base.replace(/\/api$/, '');
    }
    if (!base) {
      base = 'http://localhost:3500';
    }
    const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${base}${path}`;
  }, [profileForm.avatarUrl]);

  const passwordErrors = useMemo(() => {
    if (!passwordForm.newPassword && !passwordForm.confirmPassword && !passwordForm.oldPassword) return '';
    if (!passwordForm.oldPassword) return 'Eski sifre zorunludur.';
    if (!passwordForm.newPassword) return 'Yeni sifre zorunludur.';
    if (passwordForm.newPassword.length < 8) return 'Yeni sifre en az 8 karakter olmali.';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return 'Yeni sifreler eslesmiyor.';
    return '';
  }, [passwordForm]);

  async function handleAvatarChange(file: File | null) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profil fotografi 2MB boyutunu asmamali.');
      return;
    }
    setIsAvatarUploading(true);
    try {
      const uploaded = await uploadProfileAvatar(file);
      setAvatarLoadError(false);
      setProfileForm((prev) => ({
        ...prev,
        avatarUrl: uploaded.filePath,
        avatarFit: prev.avatarFit || 'cover',
        avatarPosition: prev.avatarPosition || 'center',
      }));
      if (authUser) {
        setUser({
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          role: authUser.role,
          department: authUser.department ?? '',
          avatarUrl: uploaded.filePath,
          avatarFit: profileForm.avatarFit ?? 'cover',
          avatarPosition: profileForm.avatarPosition ?? 'center',
        });
      }
      toast.success('Profil fotografi yuklendi.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Profil fotografi yuklenemedi.');
    } finally {
      setIsAvatarUploading(false);
    }
  }

  function handleRemoveAvatar() {
    setAvatarLoadError(false);
    setProfileForm((prev) => ({
      ...prev,
      avatarUrl: '',
      avatarFit: 'cover',
      avatarPosition: 'center',
    }));
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        department: authUser.department ?? '',
        avatarUrl: null,
        avatarFit: 'cover',
        avatarPosition: 'center',
      });
    }
    toast.success('Profil fotografi kaldirildi.');
  }

  const avatarFit = (profileForm.avatarFit || 'cover') as CSSProperties['objectFit'];
  const avatarPosition = (profileForm.avatarPosition || 'center') as CSSProperties['objectPosition'];

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

  return (
    <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
      <PageHeader
        icon={<Settings size={20} color="#111827" />}
        title="Hesap Ayarlari"
        subtitle="Kisisel bilgiler ve guvenlik ayarlari"
        actions={(
          <button
            type="button"
            onClick={() => profileMutation.mutate()}
            disabled={isProfileSaving}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={14} />
            Kaydet
          </button>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
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
                      onError={() => setAvatarLoadError(true)}
                      onLoad={() => setAvatarLoadError(false)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                      {authUser?.initials ?? '--'}
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
                      onClick={() => setAvatarLoadError(false)}
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
                    onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                    disabled={isAvatarUploading}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
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
                          onClick={() => setProfileForm((prev) => ({ ...prev, avatarFit: option.value }))}
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
                          onClick={() => setProfileForm((prev) => ({ ...prev, avatarPosition: option.value }))}
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
                value={profileQuery.data?.firstName ?? ''}
                readOnly
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Soyad</label>
              <input
                value={profileQuery.data?.lastName ?? ''}
                readOnly
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">E-posta</label>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <input
                  value={profileQuery.data?.email ?? ''}
                  readOnly
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Telefon</label>
              <input
                value={profileForm.phone || ''}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                placeholder="+90 5xx xxx xx xx"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Adres</label>
              <input
                value={profileForm.address || ''}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, address: event.target.value }))}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                placeholder="Sehir, Ulke"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Rol</label>
              <input
                value={profileQuery.data?.role ?? authUser?.role ?? '-'}
                readOnly
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Departman</label>
              <input
                value={profileQuery.data?.department ?? authUser?.department ?? '-'}
                readOnly
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
              />
            </div>
          </div>
        </section>

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
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Yeni Sifre</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Yeni Sifre (Tekrar)</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
              />
            </div>
            {passwordErrors && (
              <p className="text-xs font-semibold text-rose-600">{passwordErrors}</p>
            )}
            <button
              type="button"
              onClick={() => passwordMutation.mutate()}
              disabled={isPasswordSaving || Boolean(passwordErrors)}
              className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sifreyi Guncelle
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
