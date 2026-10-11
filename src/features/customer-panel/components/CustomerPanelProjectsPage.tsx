import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {FolderKanban, Search, ArrowUpRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import {getCustomerProjectsDashboard, type CustomerProjectItem} from '../api/customerProjects.api';
import {formatDate} from '../../../shared/utils/formatDate';

function formatBudget(value?: number): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
    return new Intl.NumberFormat('tr-TR', {style: 'currency', currency: 'TRY'}).format(value);
}

function statusBadge(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === 'ACTIVE' || normalized === 'IN_PROGRESS') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
    if (normalized === 'COMPLETED' || normalized === 'DONE') {
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }
    if (normalized === 'ON_HOLD' || normalized === 'BLOCKED') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
    return 'border-slate-200 bg-slate-50 text-slate-700';
}

function projectSubtitle(project: CustomerProjectItem): string {
    if (project.deadline) {
        return `Hedef teslim: ${formatDate(project.deadline)}`;
    }
    if (project.startDate) {
        return `Baslangic: ${formatDate(project.startDate)}`;
    }
    return 'Tarih bilgisi bulunamadi';
}

export function CustomerPanelProjectsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const dashboardQuery = useQuery({
        queryKey: ['customer-panel', 'projects'],
        queryFn: getCustomerProjectsDashboard,
        staleTime: 60_000,
    });

    const projects = useMemo(() => dashboardQuery.data?.projects || [], [dashboardQuery.data?.projects]);
    const total = projects.length;
    const activeCount = dashboardQuery.data?.activeProjects ?? projects.length;

    const filteredProjects = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('tr');
        const status = statusFilter.trim().toUpperCase();

        return projects.filter((project) => {
            if (status && project.status.toUpperCase() !== status) {
                return false;
            }

            if (!term) return true;
            const haystack = [
                project.name,
                project.description ?? '',
                project.status,
                project.id,
            ]
                .join(' ')
                .toLocaleLowerCase('tr');
            return haystack.includes(term);
        });
    }, [projects, search, statusFilter]);

    const statusOptions = useMemo(() => {
        const unique = Array.from(new Set(projects.map((project) => project.status))).filter(Boolean);
        return unique.sort((a, b) => a.localeCompare(b, 'tr'));
    }, [projects]);

    return (
        <section className="space-y-5">
            <header className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Customer Panel</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Projelerim</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Projelerinizi listeleyin, teslim tarihlerini takip edin ve detaylari inceleyin.
                </p>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Toplam Proje</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{total}</p>
                </article>
                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-emerald-700">Aktif Proje</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-800">{activeCount}</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Teslim Takibi</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {projects.filter((item) => !!item.deadline).length}
                    </p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Arama Sonucu</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{filteredProjects.length}</p>
                </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex min-w-[220px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
                        <FolderKanban size={14} className="text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="h-10 w-full border-0 bg-transparent text-sm text-slate-700 outline-none"
                        >
                            <option value="">Tum Durumlar</option>
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
                        <Search size={14} className="text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Proje adi, ID veya aciklama ara..."
                            className="h-10 w-full border-0 bg-transparent text-sm text-slate-700 outline-none"
                        />
                    </div>
                </div>

                {dashboardQuery.isLoading ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                        Projeler yukleniyor...
                    </div>
                ) : dashboardQuery.isError ? (
                    <div className="rounded-lg border border-dashed border-red-300 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
                        Projeler yuklenemedi.
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                        Gosterilecek proje bulunamadi.
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {filteredProjects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/customer-panel/projeler/${project.id}`}
                                state={{project}}
                                className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                                        <p className="text-xs text-slate-500">{projectSubtitle(project)}</p>
                                    </div>
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(project.status)}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                                    {project.description || 'Proje aciklamasi bulunamadi.'}
                                </p>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                    <span>Butce: {formatBudget(project.budget)}</span>
                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                        Detaylari gor
                                        <ArrowUpRight size={12} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
}
