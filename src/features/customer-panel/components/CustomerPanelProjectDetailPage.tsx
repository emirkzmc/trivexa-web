import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, Calendar, ClipboardList, FolderKanban, Target} from 'lucide-react';
import {Link, useLocation, useParams} from 'react-router-dom';
import {getProjectById, type ProjectItem} from '../../projects/api/projects.api';
import {formatDate} from '../../../shared/utils/formatDate';
import {type CustomerProjectItem} from '../api/customerProjects.api';

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

function infoRow(label: string, value?: string) {
    return (
        <div className="flex items-center justify-between text-sm text-slate-600">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-900">{value || '-'}</span>
        </div>
    );
}

export function CustomerPanelProjectDetailPage() {
    const {projectId} = useParams();
    const location = useLocation();
    const fallbackProject = (location.state as { project?: CustomerProjectItem } | null)?.project;

    const projectQuery = useQuery({
        queryKey: ['customer-panel', 'project', projectId],
        queryFn: () => {
            if (!projectId) {
                throw new Error('Project id missing');
            }
            return getProjectById(projectId);
        },
        enabled: !!projectId,
        staleTime: 60_000,
    });

    const project = projectQuery.data as ProjectItem | undefined;
    const resolvedProject = project ?? fallbackProject;

    const timeline = useMemo(() => ({
        startDate: resolvedProject?.startDate ? formatDate(resolvedProject.startDate) : '-',
        deadline: resolvedProject?.deadline ? formatDate(resolvedProject.deadline) : '-',
        updatedAt: resolvedProject?.updatedAt ? formatDate(resolvedProject.updatedAt) : '-',
    }), [resolvedProject]);

    return (
        <section className="space-y-5">
            <div className="flex items-center justify-between">
                <Link
                    to="/customer-panel/projeler"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                    <ArrowLeft size={14} />
                    Projelerim
                </Link>
                {project?.status && (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(project.status)}`}>
                        {project.status}
                    </span>
                )}
            </div>

            {projectQuery.isLoading && !resolvedProject ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-600">
                    Proje detaylari yukleniyor...
                </div>
            ) : projectQuery.isError && !resolvedProject ? (
                <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 px-4 py-12 text-center text-sm text-red-700">
                    Proje detaylari alinamadi.
                </div>
            ) : (
                <>
                    {projectQuery.isError && resolvedProject && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Proje detaylari sunucudan alinamadi. Gosterilen bilgiler son bilinen kayittir.
                        </div>
                    )}
                    <header className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Proje Detayi</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{resolvedProject?.name}</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            {resolvedProject?.description || 'Bu proje icin aciklama bulunamadi.'}
                        </p>
                    </header>

                    <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                        <article className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FolderKanban size={16} />
                                Proje Genel Bilgileri
                            </div>
                            <div className="space-y-3">
                                {infoRow('Proje ID', resolvedProject?.id)}
                                {infoRow('Durum', resolvedProject?.status)}
                                {infoRow('Butce', formatBudget(resolvedProject?.budget))}
                            </div>
                        </article>

                        <article className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Calendar size={16} />
                                Zamanlama
                            </div>
                            <div className="space-y-3">
                                {infoRow('Baslangic', timeline.startDate)}
                                {infoRow('Hedef Teslim', timeline.deadline)}
                                {infoRow('Guncellenme', timeline.updatedAt)}
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <article className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <ClipboardList size={16} />
                                Proje Aciklamasi
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {resolvedProject?.description || 'Aciklama bilgisi girilmemis.'}
                            </p>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Target size={16} />
                                Teslim Notlari
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p>Bu alanda proje teslim basliklari ve onay surecleri gosterilecektir.</p>
                                <p>Talep uzerine ek rapor, dosya veya teslim checklisti ekleyebiliriz.</p>
                            </div>
                        </article>
                    </section>
                </>
            )}
        </section>
    );
}
