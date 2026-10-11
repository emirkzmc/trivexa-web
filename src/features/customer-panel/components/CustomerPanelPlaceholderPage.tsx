interface CustomerPanelPlaceholderPageProps {
    title: string;
    description: string;
}

export function CustomerPanelPlaceholderPage({ title, description }: CustomerPanelPlaceholderPageProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Customer Panel</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">{description}</p>
        </section>
    );
}
