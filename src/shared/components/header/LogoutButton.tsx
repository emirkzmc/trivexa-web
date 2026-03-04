import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
    onLogout: () => void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
    return (
        <button
            onClick={onLogout}
            title="Çıkış Yap"
            aria-label="Çıkış Yap"
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#CBD5E1',
                transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#EF4444';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1';
            }}
        >
            <LogOut size={14} strokeWidth={2} />
        </button>
    );
}
