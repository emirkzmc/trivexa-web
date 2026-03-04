interface RoleBadgeProps {
    role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
    return (
        <span
            style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#6B7280',
                backgroundColor: '#F1F5F9',
                borderRadius: 5,
                padding: '2px 8px',
                whiteSpace: 'nowrap',
            }}
        >
            {role}
        </span>
    );
}
