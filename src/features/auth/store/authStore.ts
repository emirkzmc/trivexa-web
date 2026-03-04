import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    initials: string;
}

export interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: AuthUser | null;
    isFirstLogin: boolean;
}

export interface AuthActions {
    setAuth: (
        token: string,
        refreshToken: string,
        user: Omit<AuthUser, 'initials'>,
        isFirstLogin?: boolean,
    ) => void;
    setToken: (token: string) => void;
    setUser: (user: Omit<AuthUser, 'initials'>) => void;
    logout: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function enrichUser(user: Omit<AuthUser, 'initials'>): AuthUser {
    return { ...user, initials: deriveInitials(user.name) };
}

// ─── Initial State ───────────────────────────────────────────────────────────

const INITIAL_STATE: AuthState = {
    token: null,
    refreshToken: null,
    user: null,
    isFirstLogin: false,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set) => ({
            ...INITIAL_STATE,

            setAuth: (token, refreshToken, user, isFirstLogin = false) =>
                set({
                    token,
                    refreshToken,
                    user: enrichUser(user),
                    isFirstLogin,
                }),

            setToken: (token) => set({ token }),

            setUser: (user) => set({ user: enrichUser(user) }),

            logout: () => set(INITIAL_STATE),
        }),
        {
            name: 'trivexa-auth',
            partialize: (state) => ({
                token: state.token,
                refreshToken: state.refreshToken,
                user: state.user,
                isFirstLogin: state.isFirstLogin,
            }),
        },
    ),
);
