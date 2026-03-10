import api from '../../../shared/lib/axios';

interface ApiEnvelope<T> {
  data: T;
}

function unwrapEnvelope<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string | null;
  subDepartmentId?: string | null;
  subDepartmentName?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  avatarFit?: string | null;
  avatarPosition?: string | null;
}

export interface UpdateProfilePayload {
  phone?: string;
  address?: string;
  avatarUrl?: string;
  avatarFit?: string;
  avatarPosition?: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile | ApiEnvelope<UserProfile>>('/users/me');
  return unwrapEnvelope(data);
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile | ApiEnvelope<UserProfile>>('/users/me', payload);
  return unwrapEnvelope(data);
}

export interface UploadedFilePayload {
  id: string;
  fileName: string;
  filePath: string;
  mimeType?: string;
  size?: number;
}

export async function uploadProfileAvatar(file: File): Promise<UploadedFilePayload> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadedFilePayload | ApiEnvelope<UploadedFilePayload>>(
    '/files/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrapEnvelope(data);
}
