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
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { formatDate } from '../../../shared/utils/formatDate';
import { getProjects } from '../api/projects.api';
import { ProjectCard } from './ProjectCard';
import { StatsCard } from './StatsCard';
import { STATUS_OPTIONS } from './projectsPage.constants';
import { formatMoney, toMeta } from './projectsPage.utils';
import type { ViewMode } from './projectsPage.types';
import { useProjectCreate } from '../hooks/useProjectCreate';
import { ProjectCreateModal } from './create/ProjectCreateModal';

export function ProjectsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [view, setView] = useState<ViewMode>('grid');

    const projectCreate = useProjectCreate();

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
                onClick={projectCreate.openCreatePanel}
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

            <ProjectCreateModal controller={projectCreate} />
        </div>
    );
}
