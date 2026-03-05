import { Menu } from 'lucide-react';
import { PageTitle } from './header/PageTitle';
import { UserAvatar } from './header/UserAvatar';
import { RoleBadge } from './header/RoleBadge';
import { LogoutButton } from './header/LogoutButton';

interface AppHeaderUser {
    name: string;
    initials: string;
    role: string;
}

interface AppHeaderProps {
    pageName: string;
    user: AppHeaderUser;
    onLogout: () => void;
    onMenuToggle?: () => void;
    showMenuButton?: boolean;
}

export function AppHeader({
    pageName,
    user,
    onLogout,
    onMenuToggle,
    showMenuButton = false,
}: AppHeaderProps) {
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
                        aria-label="Menüyü aç"
                        title="Menüyü aç"
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
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
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
