interface StatusBadgeProps {
    active: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}

const STYLES = {
    active: { bg: '#DCFCE7', text: '#166534' },
    inactive: { bg: '#FEE2E2', text: '#991B1B' },
};

export function StatusBadge({
    active,
    activeLabel = 'Aktif',
    inactiveLabel = 'Pasif',
}: StatusBadgeProps) {
    const style = active ? STYLES.active : STYLES.inactive;

    return (
        <span style={{
            display: 'inline-block', padding: '2px 10px',
            borderRadius: 100, fontSize: 11, fontWeight: 600,
            backgroundColor: style.bg, color: style.text,
        }}>
            {active ? activeLabel : inactiveLabel}
        </span>
    );
}
