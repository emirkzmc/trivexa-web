import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDays,
    CircleDashed,
    Filter,
    FolderKanban,
    LayoutGrid,
    Plus,
    Rows3,
    Search,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { formatDate } from '../../../shared/utils/formatDate';
import { getProjects, type ProjectItem } from '../api/projects.api';

type ViewMode = 'grid' | 'list';

const STATUS_META: Record<string, { label: string; badgeClass: string; progress: number }> = {
    DRAFT: { label: 'Taslak', badgeClass: 'bg-slate-100 text-slate-700', progress: 8 },
    PLANNING: { label: 'Planlama', badgeClass: 'bg-sky-100 text-sky-700', progress: 20 },
    IN_PROGRESS: { label: 'Devam Ediyor', badgeClass: 'bg-amber-100 text-amber-700', progress: 58 },
    ON_HOLD: { label: 'Beklemede', badgeClass: 'bg-orange-100 text-orange-700', progress: 42 },
    COMPLETED: { label: 'Tamamlandi', badgeClass: 'bg-emerald-100 text-emerald-700', progress: 100 },
    CANCELLED: { label: 'Iptal', badgeClass: 'bg-rose-100 text-rose-700', progress: 0 },
    ARCHIVED: { label: 'Arsiv', badgeClass: 'bg-zinc-200 text-zinc-700', progress: 100 },
};

const STATUS_OPTIONS = [
    { value: '', label: 'Tum Durumlar' },
    { value: 'DRAFT', label: STATUS_META.DRAFT.label },
    { value: 'PLANNING', label: STATUS_META.PLANNING.label },
    { value: 'IN_PROGRESS', label: STATUS_META.IN_PROGRESS.label },
    { value: 'ON_HOLD', label: STATUS_META.ON_HOLD.label },
    { value: 'COMPLETED', label: STATUS_META.COMPLETED.label },
    { value: 'CANCELLED', label: STATUS_META.CANCELLED.label },
    { value: 'ARCHIVED', label: STATUS_META.ARCHIVED.label },
];

function toMeta(status: string) {
    return STATUS_META[status?.toUpperCase()] ?? {
        label: status || 'Bilinmiyor',
        badgeClass: 'bg-gray-100 text-gray-700',
        progress: 12,
    };
}

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function StatsCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </article>
    );
}

function ProjectCard({ project, onOpen }: { project: ProjectItem; onOpen: () => void }) {
    const meta = toMeta(project.status);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">{project.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {project.description?.trim() || 'Aciklama eklenmedi.'}
                    </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClass}`}>
                    {meta.label}
                </span>
            </div>

            <div className="mb-3 h-2 rounded-full bg-gray-100">
                <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${Math.max(0, Math.min(100, meta.progress))}%` }}
                />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Baslangic</p>
                    <p className="font-medium text-gray-700">{project.startDate ? formatDate(project.startDate) : '-'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Teslim</p>
                    <p className="font-medium text-gray-700">{project.deadline ? formatDate(project.deadline) : '-'}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-gray-50 px-2.5 py-2">
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Butce</p>
                    <p className="font-medium text-gray-700">{formatMoney(project.budget)}</p>
                </div>
            </div>
        </button>
    );
}

export function ProjectsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [view, setView] = useState<ViewMode>('grid');

    const projectsQuery = useQuery({
        queryKey: ['projects', { page, limit, status, search }],
        queryFn: () =>
            getProjects({
                page,
                limit,
                status: status || undefined,
                search: search.trim() || undefined,
            }),
    });

    const rows = projectsQuery.data?.data ?? [];
    const total = projectsQuery.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const stats = useMemo(() => {
        const inProgress = rows.filter((item) => item.status === 'IN_PROGRESS').length;
        const completed = rows.filter((item) => item.status === 'COMPLETED').length;
        const totalBudget = rows.reduce((sum, item) => sum + (item.budget ?? 0), 0);

        return {
            inProgress,
            completed,
            totalBudget,
        };
    }, [rows]);

    function handleStatusChange(nextStatus: string) {
        setStatus(nextStatus);
        setPage(1);
    }

    function handleSearchChange(nextSearch: string) {
        setSearch(nextSearch);
        setPage(1);
    }

    const actions = (
        <>
            <button
                type="button"
                onClick={() => setView((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
                {view === 'grid' ? <Rows3 size={14} /> : <LayoutGrid size={14} />}
                {view === 'grid' ? 'Liste Gorunumu' : 'Kart Gorunumu'}
            </button>

            <button
                type="button"
                onClick={() => toast.info('Yeni proje formu bir sonraki adimda eklenecek.')}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
            >
                <Plus size={14} />
                Yeni Proje
            </button>
        </>
    );

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<FolderKanban size={20} color="#DC2626" />}
                title="Projeler"
                subtitle={`Toplam ${total} proje kaydi`}
                actions={actions}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard title="Toplam Proje" value={String(total)} subtitle="Filtrelenmis toplam kayit" />
                <StatsCard title="Devam Eden" value={String(stats.inProgress)} subtitle="Aktif operasyon surecinde" />
                <StatsCard title="Tamamlanan" value={String(stats.completed)} subtitle="Tamamlanmis proje adedi" />
                <StatsCard title="Sayfa Butcesi" value={formatMoney(stats.totalBudget)} subtitle="Gorunen kayitlara gore" />
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder="Proje adi veya aciklama ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2">
                        <Filter size={13} className="text-gray-400" />
                        <select
                            value={status}
                            onChange={(event) => handleStatusChange(event.target.value)}
                            className="h-9 min-w-[160px] border-0 bg-transparent text-sm text-gray-700 outline-none"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
                {projectsQuery.isLoading ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-44 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
                        ))}
                    </div>
                ) : projectsQuery.isError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-10 text-center text-sm font-medium text-red-600">
                        Proje listesi yuklenemedi.
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                        Eslesen proje bulunamadi.
                    </div>
                ) : view === 'grid' ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {rows.map((project) => (
                            <ProjectCard key={project.id} project={project} onOpen={() => navigate(`/app/projeler/${project.id}`)} />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-3 py-2.5 font-semibold">Proje</th>
                                    <th className="px-3 py-2.5 font-semibold">Durum</th>
                                    <th className="px-3 py-2.5 font-semibold">Tarih</th>
                                    <th className="px-3 py-2.5 font-semibold">Butce</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((project) => {
                                    const meta = toMeta(project.status);

                                    return (
                                        <tr
                                            key={project.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => navigate(`/app/projeler/${project.id}`)}
                                        >
                                            <td className="px-3 py-2.5">
                                                <p className="font-semibold text-gray-900">{project.name}</p>
                                                <p className="text-xs text-gray-500">{project.description?.trim() || '-'}</p>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClass}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarDays size={13} className="text-gray-400" />
                                                    <span>{project.startDate ? formatDate(project.startDate) : '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-700">
                                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5">
                                                    <Wallet size={13} className="text-gray-400" />
                                                    <span className="font-medium">{formatMoney(project.budget)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!projectsQuery.isLoading && !projectsQuery.isError && rows.length > 0 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        total={total}
                        limit={limit}
                        onPageChange={setPage}
                        onLimitChange={(nextLimit) => {
                            setLimit(nextLimit);
                            setPage(1);
                        }}
                        limitOptions={[10, 20, 50, 100]}
                    />
                )}
            </section>

            <section className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-xs text-gray-500">
                <p className="flex items-center gap-1.5">
                    <CircleDashed size={13} />
                    Proje karti veya satirina tiklayarak detay ekranini acabilirsiniz.
                </p>
            </section>
        </div>
    );
}

