import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoleBadge } from './RoleBadge';
import { UserAvatar } from './UserAvatar';

interface UserMenuDropdownUser {
    name: string;
    initials: string;
    role: string;
    email?: string;
    avatarUrl?: string | null;
    avatarFit?: string | null;
    avatarPosition?: string | null;
}

interface UserMenuDropdownProps {
    user: UserMenuDropdownUser;
    onLogout: () => void;
    compact?: boolean;
}

interface MenuItem {
    key: string;
    label: string;
    description: string;
    icon: ReactNode;
    path?: string;
    action?: () => void;
    isDanger?: boolean;
}

export function UserMenuDropdown({ user, onLogout, compact = false }: UserMenuDropdownProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);

    const menuItems: MenuItem[] = [
        {
            key: 'notifications',
            label: 'Bildirimler',
            description: 'Tum bildirimleri gor',
            icon: <Bell size={14} />,
            path: '/app/notifications',
        },
        {
            key: 'settings',
            label: 'Kullanıcı Ayarları',
            description: 'Hesap ve panel ayarlari',
            icon: <Settings size={14} />,
            path: '/app/hesabim',
        },
        {
            key: 'logout',
            label: 'Cikis yap',
            description: 'Guvenli cikis',
            icon: <LogOut size={14} />,
            action: onLogout,
            isDanger: true,
        },
    ];

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;
            if (wrapperRef.current?.contains(target)) return;
            setOpen(false);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(false);
    }, [location.pathname]);

    function handleSelect(item: MenuItem) {
        setOpen(false);
        if (item.action) {
            item.action();
            return;
        }
        if (item.path) {
            navigate(item.path);
        }
    }

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Kullanici menusu"
                title="Kullanici menusu"
                style={{
                    height: 38,
                    borderRadius: 10,
                    border: open ? '1px solid var(--role-accent-300)' : '1px solid #E5E7EB',
                    backgroundColor: open ? 'var(--role-accent-50)' : '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: compact ? '0 8px 0 4px' : '0 10px 0 4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                }}
            >
                <UserAvatar
                    initials={user.initials}
                    avatarUrl={user.avatarUrl ?? null}
                    avatarFit={user.avatarFit ?? null}
                    avatarPosition={user.avatarPosition ?? null}
                />
                {!compact && (
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 12,
                                lineHeight: 1.2,
                                fontWeight: 700,
                                color: '#111827',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 160,
                            }}
                        >
                            {user.name || 'Kullanici'}
                        </p>
                        <p
                            style={{
                                margin: '2px 0 0',
                                fontSize: 10,
                                lineHeight: 1.2,
                                color: '#6B7280',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 160,
                            }}
                        >
                            {user.role || '-'}
                        </p>
                    </div>
                )}
                <ChevronDown
                    size={15}
                    color="#6B7280"
                    style={{
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                        flexShrink: 0,
                    }}
                />
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: 280,
                        maxWidth: 'min(280px, calc(100vw - 16px))',
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.14)',
                        zIndex: 95,
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ padding: '11px 12px', borderBottom: '1px solid #F1F5F9' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>
                            {user.name || 'Kullanici'}
                        </p>
                        <p
                            style={{
                                margin: '3px 0 0',
                                fontSize: 11,
                                color: '#6B7280',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {user.email || 'E-posta bilgisi yok'}
                        </p>
                        <div style={{ marginTop: 8 }}>
                            <RoleBadge role={user.role || '-'} />
                        </div>
                    </div>

                    <div style={{ padding: 8 }}>
                        {menuItems.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handleSelect(item)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: 9,
                                    backgroundColor: '#FFFFFF',
                                    color: item.isDanger ? '#B91C1C' : '#111827',
                                    padding: '8px 10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                    marginBottom: 7,
                                }}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 7,
                                            border: `1px solid ${item.isDanger ? '#FECACA' : '#E5E7EB'}`,
                                            backgroundColor: item.isDanger ? '#FEF2F2' : '#F8FAFC',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                    <span>
                                        <span style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>
                                            {item.label}
                                        </span>
                                        <span style={{ display: 'block', fontSize: 10, color: '#6B7280' }}>
                                            {item.description}
                                        </span>
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
