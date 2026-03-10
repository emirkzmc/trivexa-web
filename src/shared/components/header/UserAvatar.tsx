import { useMemo, useState, type CSSProperties } from 'react';

interface UserAvatarProps {
    initials: string;
    size?: number;
    avatarUrl?: string | null;
    avatarFit?: string | null;
    avatarPosition?: string | null;
}

function resolveAvatarSrc(rawValue: string | null | undefined): string {
    const raw = (rawValue || '').trim();
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
}

export function UserAvatar({
    initials,
    size = 32,
    avatarUrl,
    avatarFit,
    avatarPosition,
}: UserAvatarProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const avatarSrc = useMemo(() => resolveAvatarSrc(avatarUrl), [avatarUrl]);
    const fit = (avatarFit || 'cover') as CSSProperties['objectFit'];
    const position = (avatarPosition || 'center') as CSSProperties['objectPosition'];
    const hasError = failedSrc === avatarSrc;

    if (!avatarSrc || hasError) {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: 9,
                    backgroundColor: '#1A1A1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 800,
                    flexShrink: 0,
                }}
            >
                {initials}
            </div>
        );
    }

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 9,
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                backgroundColor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <img
                src={avatarSrc}
                alt="Profil fotografi"
                style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: position }}
                onError={() => setFailedSrc(avatarSrc)}
                onLoad={() => {
                    if (failedSrc) {
                        setFailedSrc(null);
                    }
                }}
            />
        </div>
    );
}
