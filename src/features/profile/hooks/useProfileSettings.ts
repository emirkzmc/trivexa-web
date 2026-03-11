import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/store/authStore';
import {
  getMyProfile,
  updateMyProfile,
  uploadProfileAvatar,
  type UpdateProfilePayload,
  type UserProfile,
} from '../api/profile.api';
import { buildAvatarSrc } from '../utils/avatar';

const DEFAULT_PROFILE_FORM: UpdateProfilePayload = {
  phone: '',
  address: '',
  avatarUrl: '',
  avatarFit: 'cover',
  avatarPosition: 'center',
};

export function useProfileSettings() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>(DEFAULT_PROFILE_FORM);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

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

  const avatarSrc = useMemo(() => buildAvatarSrc(profileForm.avatarUrl), [profileForm.avatarUrl]);
  const avatarFit = (profileForm.avatarFit || 'cover') as CSSProperties['objectFit'];
  const avatarPosition = (profileForm.avatarPosition || 'center') as CSSProperties['objectPosition'];

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

  const isProfileSaving = profileMutation.isPending || isAvatarUploading;

  function saveProfile() {
    profileMutation.mutate();
  }

  return {
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
  };
}
