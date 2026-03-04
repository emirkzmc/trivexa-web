interface PageTitleProps {
    title: string;
}

export function PageTitle({ title }: PageTitleProps) {
    return (
        <span
            style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#111827',
            }}
        >
            {title}
        </span>
    );
}
