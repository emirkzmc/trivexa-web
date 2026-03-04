import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponseData {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        department: string;
    };
}

export interface LoginResponse {
    success: boolean;
    data: LoginResponseData;
}

export interface RefreshResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken?: string;
    };
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface MeResponse {
    success: boolean;
    data: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        department: string;
    };
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
}

export async function refreshToken(token: string): Promise<RefreshResponse> {
    const { data } = await api.post<RefreshResponse>('/auth/refresh', {
        refreshToken: token,
    });
    return data;
}

export async function logout(token: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken: token });
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.post('/auth/change-password', payload);
}

export async function getMe(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>('/auth/me');
    return data;
}
