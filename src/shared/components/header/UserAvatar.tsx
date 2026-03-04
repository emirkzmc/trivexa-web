interface UserAvatarProps {
    initials: string;
    size?: number;
}

export function UserAvatar({ initials, size = 32 }: UserAvatarProps) {
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
