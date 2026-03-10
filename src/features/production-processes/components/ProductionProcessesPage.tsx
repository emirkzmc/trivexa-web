import {useEffect, useMemo, useState, type CSSProperties} from 'react';
import {useQuery} from '@tanstack/react-query';
import {
    Clapperboard,
    Film,
    FolderKanban,
    Headphones,
    MonitorPlay,
    Rocket,
    Video,
} from 'lucide-react';
import {PageHeader} from '../../../shared/components/PageHeader';
import {formatDate} from '../../../shared/utils/formatDate';
import {useAuthStore} from '../../auth/store/authStore';
import {getProjects, type ProjectItem} from '../../projects/api/projects.api';
import {getProjectTasks, type TaskItem} from '../../tasks/api/tasks.api';
import {getFiles, downloadFile, type FileMetadata} from '../../files/api/files.api';
import {ROLES} from '../../../shared/constants/roles';
import {TASK_STATUS_ORDER, type TaskStatus} from '../../tasks/components/tasks.constants';

type StageDefinition = {
    key: TaskStatus;
    label: string;
    hint: string;
    badgeClass: string;
    borderClass: string;
};

const PRODUCTION_SCOPE_ROLES = new Set<string>([
    ROLES.PRODUCTION,
    ROLES.CREATIVE,
    ROLES.MARKETING,
    ROLES.SOCIAL_MEDIA,
]);

const STAGE_DEFINITIONS: StageDefinition[] = [
    {
        key: 'TODO',
        label: 'Planlama',
        hint: 'Cekim brieflari ve hazirlik listesi',
        badgeClass: 'bg-sky-100 text-sky-800',
        borderClass: 'border-sky-200',
    },
    {
        key: 'IN_PROGRESS',
        label: 'Cekim',
        hint: 'Sahada veya uretimde aktif calisma',
        badgeClass: 'bg-violet-100 text-violet-800',
        borderClass: 'border-violet-200',
    },
    {
        key: 'IN_REVIEW',
        label: 'Kurgu & Onay',
        hint: 'Kurgu, ses ve onay akisi',
        badgeClass: 'bg-amber-100 text-amber-800',
        borderClass: 'border-amber-200',
    },
    {
        key: 'BLOCKED',
        label: 'Beklemede',
        hint: 'Onay, cekim izni veya ekipman bekleniyor',
        badgeClass: 'bg-slate-100 text-slate-700',
        borderClass: 'border-slate-200',
    },
    {
        key: 'DONE',
        label: 'Teslim',
        hint: 'Onaylanmis final paketler',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        borderClass: 'border-emerald-200',
    },
];

const PAGE_THEME: CSSProperties = {
    '--prod-bg': '#f8fafc',
    '--prod-card': '#f1f5f9',
    '--prod-border': '#cbd5f5',
    '--prod-ink': '#0f172a',
    '--prod-muted': '#64748b',
    '--prod-accent': '#6366f1',
    '--prod-accent-2': '#f97316',
} as CSSProperties;

function normalizeStatus(status?: string): TaskStatus {
    const normalized = String(status ?? '').toUpperCase();
    if (normalized === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (normalized === 'IN_REVIEW') return 'IN_REVIEW';
    if (normalized === 'DONE') return 'DONE';
    if (normalized === 'BLOCKED') return 'BLOCKED';
    return 'TODO';
}

function taskAssigneesLabel(task: TaskItem): string {
    const assignees = task.assignees ?? [];
    if (assignees.length > 0) {
        const labels = assignees.map((assignee) => {
            const fullName = `${assignee.firstName ?? ''} ${assignee.lastName ?? ''}`.trim();
            return fullName || assignee.email || assignee.userId;
        });
        if (labels.length <= 2) return labels.join(', ');
        return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
    }

    const fallbackName = `${task.assigneeFirstName ?? ''} ${task.assigneeLastName ?? ''}`.trim();
    return fallbackName || task.assigneeEmail || '-';
}

function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;

    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);
    return `${rounded} ${units[unitIndex]}`;
}

export function ProductionProcessesPage() {
    const user = useAuthStore((state) => state.user);
    const role = String(user?.role ?? '').toUpperCase();
    const scopedProjects = PRODUCTION_SCOPE_ROLES.has(role);

    const [selectedProjectId, setSelectedProjectId] = useState('');

    const projectsQuery = useQuery({
        queryKey: ['production-processes', 'projects', role, scopedProjects],
        queryFn: () => getProjects({page: 1, limit: 100, myProjectsOnly: scopedProjects || undefined}),
        staleTime: 60_000,
    });

    const projects = projectsQuery.data?.data ?? [];

    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    const selectedProject = useMemo<ProjectItem | null>(
        () => projects.find((project) => project.id === selectedProjectId) ?? null,
        [projects, selectedProjectId],
    );

    const tasksQuery = useQuery({
        queryKey: ['production-processes', 'tasks', selectedProjectId],
        queryFn: () => getProjectTasks(selectedProjectId, {page: 1, limit: 300}),
        enabled: !!selectedProjectId,
        staleTime: 30_000,
    });

    const filesQuery = useQuery({
        queryKey: ['production-processes', 'files', selectedProjectId],
        queryFn: () => getFiles({page: 1, limit: 200, entityType: 'PROJECT', entityId: selectedProjectId}),
        enabled: !!selectedProjectId,
        staleTime: 30_000,
    });

    const tasks = tasksQuery.data?.data ?? [];
    const files = filesQuery.data ?? [];

    const stageCards = useMemo(() => (
        STAGE_DEFINITIONS.map((stage) => {
            const items = tasks
                .filter((task) => normalizeStatus(task.status) === stage.key)
                .slice(0, 4);
            return {
                ...stage,
                count: tasks.filter((task) => normalizeStatus(task.status) === stage.key).length,
                items,
            };
        })
    ), [tasks]);

    const metrics = useMemo(() => ({
        total: tasks.length,
        inProgress: tasks.filter((task) => normalizeStatus(task.status) === 'IN_PROGRESS').length,
        review: tasks.filter((task) => normalizeStatus(task.status) === 'IN_REVIEW').length,
        blocked: tasks.filter((task) => normalizeStatus(task.status) === 'BLOCKED').length,
        done: tasks.filter((task) => normalizeStatus(task.status) === 'DONE').length,
    }), [tasks]);

    const upcomingTasks = useMemo(() => {
        const today = new Date();
        return tasks
            .filter((task) => task.dueDate && !Number.isNaN(Date.parse(task.dueDate)))
            .map((task) => ({task, dueAt: new Date(task.dueDate ?? '')}))
            .filter((item) => item.dueAt >= today)
            .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime())
            .slice(0, 4);
    }, [tasks]);

    const recentFiles = useMemo(() => (
        [...files]
            .filter((file) => !!file.createdAt)
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
            .slice(0, 6)
    ), [files]);

    const headerActions = (
        <div className="flex min-w-[240px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1">
            <FolderKanban size={14} className="text-gray-500"/>
            <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                disabled={projectsQuery.isLoading || projects.length === 0}
                className="h-8 w-full border-0 bg-transparent text-sm text-gray-700 outline-none"
            >
                {projects.length === 0 && <option value="">Proje bulunamadi</option>}
                {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div
            style={{...PAGE_THEME, fontFamily: "'Space Grotesk', 'Manrope', 'Segoe UI', sans-serif"}}
            className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4"
        >
            <PageHeader
                icon={<Clapperboard size={20} color="var(--prod-accent)"/>}
                title="Produksiyon Surecleri"
                subtitle="Cekim, kurgu ve teslim akislarini proje bazli takip edin."
                actions={headerActions}
            />

            <section
                className="relative mb-4 overflow-hidden rounded-2xl border p-5"
                style={{
                    borderColor: 'var(--prod-border)',
                    background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 45%, #ffedd5 100%)',
                }}
            >
                <div
                    className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
                    style={{backgroundColor: 'var(--prod-accent)'}}/>
                <div
                    className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full opacity-40 blur-2xl"
                    style={{backgroundColor: 'var(--prod-accent-2)'}}/>

                <div className="relative z-10 grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <div>
                        <p className="text-xs uppercase tracking-[0.16em]" style={{color: 'var(--prod-muted)'}}>
                            Production Flow
                        </p>
                        <h2 className="mt-2 text-2xl font-bold" style={{color: 'var(--prod-ink)'}}>
                            {selectedProject?.name ?? 'Produksiyon panosu'}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm" style={{color: 'var(--prod-muted)'}}>
                            Planlama, cekim, kurgu ve teslim adimlarini tek ekranda goruntuleyin. Ekip yukunu ve
                            teslim takvimini netlestirin.
                        </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        <article
                            className="rounded-xl border p-3"
                            style={{borderColor: 'var(--prod-border)', backgroundColor: 'rgba(255, 255, 255, 0.8)'}}
                        >
                            <p className="text-xs" style={{color: 'var(--prod-muted)'}}>Aktif Cekim</p>
                            <p className="mt-1 text-xl font-bold" style={{color: 'var(--prod-ink)'}}>
                                {metrics.inProgress}
                            </p>
                        </article>
                        <article
                            className="rounded-xl border p-3"
                            style={{borderColor: 'var(--prod-border)', backgroundColor: 'rgba(255, 255, 255, 0.8)'}}
                        >
                            <p className="text-xs" style={{color: 'var(--prod-muted)'}}>Onay Bekleyen</p>
                            <p className="mt-1 text-xl font-bold" style={{color: 'var(--prod-ink)'}}>
                                {metrics.review}
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {!selectedProjectId && !projectsQuery.isLoading && (
                <section
                    className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
                    Produksiyon sureclerini gorebilmek icin once bir proje secilmelidir.
                </section>
            )}

            {selectedProjectId && (
                <>
                    <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Toplam Is</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.total}</p>
                            <p className="text-xs text-gray-500">Planli uretim</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Cekimde</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.inProgress}</p>
                            <p className="text-xs text-gray-500">Sahada</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Kurgu/Onay</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.review}</p>
                            <p className="text-xs text-gray-500">Post-production</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Beklemede</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.blocked}</p>
                            <p className="text-xs text-gray-500">Engel var</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Teslim</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.done}</p>
                            <p className="text-xs text-gray-500">Final paket</p>
                        </article>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
                        <div className="space-y-4">
                            <article className="rounded-2xl border border-gray-200 bg-white p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <Film size={15} className="text-indigo-600"/>
                                        Produksiyon Akisi
                                    </h3>
                                    <span className="text-xs text-gray-500">Durum bazli dagilim</span>
                                </div>

                                {tasksQuery.isLoading ? (
                                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                        {Array.from({length: 6}).map((_, index) => (
                                            <div key={index}
                                                 className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-50"/>
                                        ))}
                                    </div>
                                ) : tasksQuery.isError ? (
                                    <div
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-8 text-sm text-rose-700">
                                        Produksiyon gorevleri alinamadi.
                                    </div>
                                ) : (
                                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                        {stageCards.map((stage) => (
                                            <div key={stage.key}
                                                 className={`rounded-xl border p-3 ${stage.borderClass}`}>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-gray-900">{stage.label}</p>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stage.badgeClass}`}>
                                                        {stage.count}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">{stage.hint}</p>
                                                <div className="mt-2 space-y-1">
                                                    {stage.items.length === 0 && (
                                                        <p className="rounded-md border border-dashed border-gray-200 px-2 py-1 text-[11px] text-gray-400">
                                                            Bu asamada kayit yok
                                                        </p>
                                                    )}
                                                    {stage.items.map((task) => (
                                                        <div key={task.id}
                                                             className="rounded-md bg-gray-50 px-2 py-1">
                                                            <p className="truncate text-xs font-semibold text-gray-800">
                                                                {task.title}
                                                            </p>
                                                            <p className="truncate text-[11px] text-gray-500">
                                                                {taskAssigneesLabel(task)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </article>

                            <article className="rounded-2xl border border-gray-200 bg-white p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <Video size={15} className="text-orange-600"/>
                                        Son Teslimler
                                    </h3>
                                    <span className="text-xs text-gray-500">Secili proje dosyalari</span>
                                </div>

                                {filesQuery.isLoading ? (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {Array.from({length: 4}).map((_, index) => (
                                            <div key={index}
                                                 className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-50"/>
                                        ))}
                                    </div>
                                ) : filesQuery.isError ? (
                                    <div
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-8 text-sm text-rose-700">
                                        Dosya listesi alinamadi.
                                    </div>
                                ) : recentFiles.length === 0 ? (
                                    <div
                                        className="rounded-lg border border-dashed border-gray-200 px-3 py-8 text-sm text-gray-500">
                                        Bu proje icin yuklenmis dosya yok.
                                    </div>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {recentFiles.map((file) => (
                                            <button
                                                key={file.id}
                                                type="button"
                                                onClick={() => void downloadFile(file.id, file.fileName)}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <MonitorPlay size={16} className="text-indigo-600"/>
                                                    <div>
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {file.fileName || 'Dosya'}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500">
                                                            {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-semibold text-indigo-600">Indir</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </article>
                        </div>

                        <div className="space-y-4">
                            <article className="rounded-2xl border border-gray-200 bg-white p-4">
                                <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <Rocket size={15} className="text-emerald-600"/>
                                    Yaklasan Teslimler
                                </h3>
                                {tasksQuery.isLoading ? (
                                    <div className="space-y-2">
                                        {Array.from({length: 3}).map((_, index) => (
                                            <div key={index} className="h-10 animate-pulse rounded-md bg-gray-100"/>
                                        ))}
                                    </div>
                                ) : upcomingTasks.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-sm text-gray-500">
                                        Yaklasan teslim tarihi yok.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {upcomingTasks.map(({task}) => (
                                            <li key={task.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {task.dueDate ? formatDate(task.dueDate) : '-'} • {taskAssigneesLabel(task)}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </article>

                            <article className="rounded-2xl border border-gray-200 bg-white p-4">
                                <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <Headphones size={15} className="text-amber-600"/>
                                    Produksiyon Ozeti
                                </h3>
                                <div className="space-y-3">
                                    {TASK_STATUS_ORDER.map((status) => {
                                        const count = tasks.filter((task) => normalizeStatus(task.status) === status).length;
                                        const stage = STAGE_DEFINITIONS.find((item) => item.key === status);
                                        return (
                                            <div key={status} className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {stage?.label ?? status}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{stage?.hint ?? 'Durum'}</p>
                                                </div>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stage?.badgeClass ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
