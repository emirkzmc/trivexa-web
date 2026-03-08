import { useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { PageTitle } from './header/PageTitle';
import { NotificationsDropdown } from './header/NotificationsDropdown';
import { UserMenuDropdown } from './header/UserMenuDropdown';

interface AppHeaderUser {
    name: string;
    initials: string;
    role: string;
    email?: string;
}

interface PresenceUser {
    userId: string;
    email: string;
    displayName?: string;
    currentPath: string;
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
    currentPath?: string;
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
    currentPath = '',
}: AppHeaderProps) {
    const [showPresenceDetails, setShowPresenceDetails] = useState(false);

    const sortedPresenceUsers = useMemo(
        () =>
            [...activePresenceUsers].sort((a, b) => {
                const left = (a.displayName || a.email).trim();
                const right = (b.displayName || b.email).trim();
                return left.localeCompare(right, 'tr');
            }),
        [activePresenceUsers],
    );
    const usersOnThisPage = useMemo(
        () => sortedPresenceUsers.filter((presenceUser) => presenceUser.currentPath === currentPath),
        [currentPath, sortedPresenceUsers],
    );
    const usersOnOtherPages = useMemo(
        () => sortedPresenceUsers.filter((presenceUser) => presenceUser.currentPath !== currentPath),
        [currentPath, sortedPresenceUsers],
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
                                <div className="max-h-64 space-y-2 overflow-auto">
                                    <div>
                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                            Bu Sayfadaki Kisiler ({usersOnThisPage.length})
                                        </p>
                                        {usersOnThisPage.length === 0 ? (
                                            <p className="rounded-md bg-gray-50 px-2.5 py-2 text-xs text-gray-500">
                                                Bu sayfada aktif kisi yok.
                                            </p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {usersOnThisPage.map((presenceUser) => (
                                                    <div
                                                        key={presenceUser.userId}
                                                        className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-semibold text-gray-900">
                                                                {presenceUser.displayName || presenceUser.email}
                                                                {presenceUser.userId === currentUserId ? ' (Sen)' : ''}
                                                            </p>
                                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                Burada
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                            Diger Sayfalardaki Kisiler ({usersOnOtherPages.length})
                                        </p>
                                        {usersOnOtherPages.length === 0 ? (
                                            <p className="rounded-md bg-gray-50 px-2.5 py-2 text-xs text-gray-500">
                                                Diger sayfalarda aktif kisi yok.
                                            </p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {usersOnOtherPages.map((presenceUser) => (
                                                    <div
                                                        key={presenceUser.userId}
                                                        className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2"
                                                    >
                                                        <p className="text-xs font-semibold text-gray-900">
                                                            {presenceUser.displayName || presenceUser.email}
                                                            {presenceUser.userId === currentUserId ? ' (Sen)' : ''}
                                                        </p>
                                                        <p className="mt-0.5 text-[11px] text-gray-500">
                                                            Sayfa: {presenceUser.currentPath}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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
                <UserMenuDropdown user={user} onLogout={onLogout} compact={showMenuButton} />
            </div>
        </header>
    );
}
