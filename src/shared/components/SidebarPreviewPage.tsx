/**
 * ⚠️  GEÇİCİ PREVIEW SAYFASI — production'a alınmadan önce silinmeli.
 *
 * Erişim: /app/sidebar-preview
 *
 * Sidebar'ı görmek için Zustand store'a geçici olarak bir role set eder.
 * Dropdown'dan role seçilince Sidebar hemen güncellenir.
 */

import { type ChangeEvent } from 'react';
import { type UserRole, useAuthStore } from '../../features/auth/store/authStore';
import { Sidebar } from './Sidebar';

type AuthUser = { role: UserRole; displayName: string };
type AuthState = {
    user: AuthUser | null;
    setAuth: (args: { token: string; user: AuthUser }) => void;
};

const ALL_ROLES: UserRole[] = [
    'CEO', 'MANAGER', 'ACCOUNTANT', 'ACCOUNT_MANAGER',
    'DEVELOPER', 'SOCIAL_MEDIA', 'CREATIVE', 'MARKETING',
    'PRODUCTION', 'HR', 'CLIENT',
];

export function SidebarPreviewPage() {
    const user = useAuthStore((state: AuthState) => state.user);
    const setAuth = useAuthStore((state: AuthState) => state.setAuth);

    const currentRole = user?.role ?? '';

    function handleRoleChange(e: ChangeEvent<HTMLSelectElement>) {
        setAuth({ token: 'preview-token', user: { role: e.target.value as UserRole, displayName: 'Preview User' } });
    }

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Poppins, system-ui, sans-serif', backgroundColor: '#F9FAFB' }}>
            {/* Sidebar */}
            <div style={{ flexShrink: 0, height: '100%' }}>
                <Sidebar />
            </div>

            {/* Preview kontrol paneli */}
            <div style={{ padding: 32, flex: 1, backgroundColor: '#F9FAFB' }}>
                <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 16 }}>
                    ⚠️ Bu sayfa geçicidir — üretim öncesi silinecek.
                </p>

                <h2 style={{ marginBottom: 16 }}>Sidebar Preview</h2>

                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Rol seç:
                </label>
                <select
                    value={currentRole}
                    onChange={handleRoleChange}
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                >
                    <option value="" disabled>— bir rol seç —</option>
                    {ALL_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>

                {currentRole && (
                    <p style={{ marginTop: 16, color: '#6b7280', fontSize: 13 }}>
                        Aktif rol: <strong>{currentRole}</strong>
                    </p>
                )}
            </div>
        </div>
    );
}
