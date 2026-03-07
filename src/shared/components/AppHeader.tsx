import { useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { PageTitle } from './header/PageTitle';
import { UserAvatar } from './header/UserAvatar';
import { RoleBadge } from './header/RoleBadge';
import { LogoutButton } from './header/LogoutButton';
import { NotificationsDropdown } from './header/NotificationsDropdown';

interface AppHeaderUser {
    name: string;
    initials: string;
    role: string;
}

interface PresenceUser {
    userId: string;
    email: string;
}

interface AppHeaderProps {
    pageName: string;
    user: AppHeaderUser;
    onLogout: () => void;
    onMenuToggle?: () => void;
    showMenuButton?: boolean;
    hasFreshNotification?: boolean;
    onClearFreshNotification?: () => void;
    activePresenceUsers?: PresenceUser[];
    isPresenceConnected?: boolean;
    currentUserId?: string;
}

export function AppHeader({
    pageName,
    user,
    onLogout,
    onMenuToggle,
    showMenuButton = false,
    hasFreshNotification = false,
    onClearFreshNotification,
    activePresenceUsers = [],
    isPresenceConnected = false,
    currentUserId,
}: AppHeaderProps) {
    const [showPresenceDetails, setShowPresenceDetails] = useState(false);

    const sortedPresenceUsers = useMemo(
        () => [...activePresenceUsers].sort((a, b) => a.email.localeCompare(b.email, 'tr')),
        [activePresenceUsers],
    );

    return (
        <header
            style={{
                height: 56,
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #F1F5F9',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {showMenuButton && onMenuToggle && (
                    <button
                        onClick={onMenuToggle}
                        aria-label="Menuyu ac"
                        title="Menuyu ac"
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                        }}
                    >
                        <Menu size={16} color="#374151" />
                    </button>
                )}
                <PageTitle title={pageName} />

                <div
                    onMouseEnter={() => setShowPresenceDetails(true)}
                    onMouseLeave={() => setShowPresenceDetails(false)}
                    style={{ position: 'relative' }}
                >
                    <button
                        type="button"
                        onFocus={() => setShowPresenceDetails(true)}
                        onBlur={() => setShowPresenceDetails(false)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
                        style={{ cursor: 'default' }}
                    >
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${isPresenceConnected ? 'animate-pulse bg-emerald-500' : 'bg-gray-400'}`}
                        />
                        <span>Aktif Personel: {activePresenceUsers.length}</span>
                    </button>

                    {showPresenceDetails && (
                        <div
                            className="absolute left-0 z-30 mt-2 w-[min(320px,85vw)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
                            style={{ top: '100%' }}
                        >
                            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                Aktiflik Detayi
                            </p>
                            <p className="mb-2 text-[11px] text-gray-500">
                                {isPresenceConnected ? 'Canli oturum takibi acik.' : 'Baglanti kuruluyor...'}
                            </p>

                            {sortedPresenceUsers.length === 0 ? (
                                <p className="rounded-lg bg-gray-50 px-2.5 py-2 text-xs text-gray-600">
                                    Su anda aktif personel yok.
                                </p>
                            ) : (
                                <div className="max-h-56 space-y-1.5 overflow-auto">
                                    {sortedPresenceUsers.map((presenceUser) => (
                                        <div
                                            key={presenceUser.userId}
                                            className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2"
                                        >
                                            <p className="text-xs font-semibold text-gray-900">
                                                {presenceUser.email}
                                                {presenceUser.userId === currentUserId ? ' (Sen)' : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
                <NotificationsDropdown
                    hasFreshNotification={hasFreshNotification}
                    onClearFreshNotification={onClearFreshNotification}
                />
                <UserAvatar initials={user.initials} />

                {!showMenuButton && (
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#111827',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {user.name}
                    </span>
                )}

                {!showMenuButton && <RoleBadge role={user.role} />}
                <LogoutButton onLogout={onLogout} />
            </div>
        </header>
    );
}
