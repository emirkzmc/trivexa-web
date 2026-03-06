interface RoleBadgeProps {
    role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
    return (
        <span
            style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--role-accent-700)',
                backgroundColor: 'var(--role-accent-soft)',
                borderRadius: 5,
                padding: '2px 8px',
                whiteSpace: 'nowrap',
            }}
        >
            {role}
        </span>
    );
}
