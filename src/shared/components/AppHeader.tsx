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
}

export function AppHeader({ pageName, user, onLogout }: AppHeaderProps) {
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
            <PageTitle title={pageName} />

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
                <UserAvatar initials={user.initials} />

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

                <RoleBadge role={user.role} />
                <LogoutButton onLogout={onLogout} />
            </div>
        </header>
    );
}
