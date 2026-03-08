const STATS = [
    { label: 'Aktif Proje', value: '3', detail: '2 proje planlandigi gibi ilerliyor' },
    { label: 'Acik Talep', value: '4', detail: '1 talep yuksek oncelikli' },
    { label: 'Onay Bekleyen', value: '2', detail: 'Bugun geri donus bekleniyor' },
    { label: 'Bu Ay Toplanti', value: '5', detail: 'Siradaki toplanti: Pazartesi 10:00' },
];

const RECENT_ITEMS = [
    { title: 'Web Sitesi Revizyonu', status: 'Devam ediyor', date: '06.03.2026' },
    { title: 'Sosyal Medya Kreatif Onayi', status: 'Onay bekliyor', date: '05.03.2026' },
    { title: 'Aylik Performans Raporu', status: 'Tamamlandi', date: '04.03.2026' },
];

export function CustomerPanelDashboardPage() {
    return (
        <section className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white md:p-8">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Customer Dashboard</p>
                <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Proje ve talep durumlarinizi tek ekranda izleyin</h2>
                <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                    Bu panel, musteri tarafi takip surecini uygulama panelinden ayri bir route altinda sunar.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {STATS.map((item) => (
                    <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
                        <p className="mt-3 text-xs text-slate-500">{item.detail}</p>
                    </article>
                ))}
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">Son Guncellemeler</h3>
                <div className="mt-4 divide-y divide-slate-100">
                    {RECENT_ITEMS.map((item) => (
                        <div key={item.title} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="font-medium text-slate-900">{item.title}</p>
                                <p className="text-xs text-slate-500">{item.date}</p>
                            </div>
                            <span className="inline-flex w-fit rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </section>
    );
}
