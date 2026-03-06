import type { ReactNode } from 'react';

interface PageHeaderProps {
    icon: ReactNode;
    iconBg?: string;
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function PageHeader({ icon, iconBg = 'var(--role-accent-soft)', title, subtitle, actions }: PageHeaderProps) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 24,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, backgroundColor: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {icon}
                </div>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
    );
}
