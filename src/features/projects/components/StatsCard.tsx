export function StatsCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </article>
    );
}
