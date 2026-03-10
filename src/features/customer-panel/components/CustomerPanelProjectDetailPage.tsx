import { useMemo } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, FolderKanban } from 'lucide-react';
import { getCustomerProjectsDashboard, type CustomerProjectItem } from '../api/customerProjects.api';
import { formatDate } from '../../../shared/utils/formatDate';

function formatBudget(value?: number): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
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

function resolveSubtitle(project: CustomerProjectItem): string {
    if (project.deadline) {
        return `Hedef teslim: ${formatDate(project.deadline)}`;
    }
    if (project.startDate) {
        return `Baslangic: ${formatDate(project.startDate)}`;
    }
    return 'Tarih bilgisi bulunamadi';
}

export function CustomerPanelProjectDetailPage() {
    const { projectId } = useParams();
    const location = useLocation();
    const stateProject = (location.state as { project?: CustomerProjectItem } | null)?.project;

    const projectQuery = useQuery({
        queryKey: ['customer-panel', 'projects', 'detail', projectId],
        queryFn: getCustomerProjectsDashboard,
        enabled: !stateProject && Boolean(projectId),
        staleTime: 60_000,
    });

    const project = useMemo(() => {
        if (stateProject) return stateProject;
        const list = projectQuery.data?.projects ?? [];
        return list.find((item) => item.id === projectId);
    }, [projectId, projectQuery.data?.projects, stateProject]);

    return (
        <section className="space-y-5">
            <header className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500">
                            <FolderKanban size={18} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Proje Detayi</p>
                            <h2 className="mt-1 text-xl font-semibold text-slate-900">{project?.name ?? 'Proje'}</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                {project ? resolveSubtitle(project) : 'Proje bilgisi yukleniyor.'}
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/customer-panel/projeler"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft size={12} />
                        Projelere Don
                    </Link>
                </div>
            </header>

            {projectQuery.isLoading && !project ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                    Proje detayi yukleniyor...
                </div>
            ) : projectQuery.isError && !project ? (
                <div className="rounded-lg border border-dashed border-red-300 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
                    Proje detayi yuklenemedi.
                </div>
            ) : !project ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                    Proje bulunamadi.
                </div>
            ) : (
                <>
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Durum</p>
                            <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(project.status)}`}>
                                {project.status}
                            </span>
                        </article>
                        <article className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Butce</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{formatBudget(project.budget)}</p>
                        </article>
                        <article className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Baslangic</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                {project.startDate ? formatDate(project.startDate) : '-'}
                            </p>
                        </article>
                        <article className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Teslim</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                {project.deadline ? formatDate(project.deadline) : '-'}
                            </p>
                        </article>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <CalendarDays size={16} />
                            Proje Aciklamasi
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                            {project.description || 'Proje aciklamasi bulunamadi.'}
                        </p>
                    </section>
                </>
            )}
        </section>
    );
}
