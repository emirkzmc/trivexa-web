import {useEffect, useMemo, useState, type CSSProperties} from 'react';
import {useQuery} from '@tanstack/react-query';
import {

    Code2,
    FolderKanban,
    GitBranch,
    GitCommitHorizontal,
    GitPullRequest,
    Rocket,
    ShieldCheck,
} from 'lucide-react';
import {PageHeader} from '../../../shared/components/PageHeader';
import {useAuthStore} from '../../auth/store/authStore';
import {
    getProjectCodeProcesses,
    getProjects,
    type ProjectGithubCommit,
    type ProjectItem,
} from '../../projects/api/projects.api';
import {ROLES} from '../../../shared/constants/roles';

type StageStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';
type CheckTone = 'ok' | 'warn' | 'alert';

interface StageDefinition {
    key: StageStatus;
    label: string;
    hint: string;
    toneClass: string;
    borderClass: string;
}

interface QualityCheck {
    key: string;
    label: string;
    description: string;
    tone: CheckTone;
}

const PERSONAL_PROJECT_SCOPE_ROLES = new Set<string>([
    ROLES.DEVELOPER,
    ROLES.SOCIAL_MEDIA,
    ROLES.CREATIVE,
    ROLES.MARKETING,
    ROLES.PRODUCTION,
]);

const STAGE_DEFINITIONS: StageDefinition[] = [
    {
        key: 'TODO',
        label: 'Backlog',
        hint: 'Sprinte alinmayi bekleyen isler',
        toneClass: 'bg-slate-100 text-slate-800',
        borderClass: 'border-slate-200',
    },
    {
        key: 'IN_PROGRESS',
        label: 'Development',
        hint: 'Aktif implementasyon asamasinda',
        toneClass: 'bg-cyan-100 text-cyan-800',
        borderClass: 'border-cyan-200',
    },
    {
        key: 'IN_REVIEW',
        label: 'Code Review',
        hint: 'PR kontrolu ve iyilestirme asamasi',
        toneClass: 'bg-amber-100 text-amber-800',
        borderClass: 'border-amber-200',
    },
    {
        key: 'BLOCKED',
        label: 'Blocked',
        hint: 'Bagimlilik veya teknik engel var',
        toneClass: 'bg-rose-100 text-rose-800',
        borderClass: 'border-rose-200',
    },
    {
        key: 'DONE',
        label: 'Release Ready',
        hint: 'Deploy veya release adimina hazir',
        toneClass: 'bg-emerald-100 text-emerald-800',
        borderClass: 'border-emerald-200',
    },
];

const PAGE_THEME: CSSProperties = {
    '--code-bg': '#060b16',
    '--code-bg-soft': '#0f172a',
    '--code-card': '#111d33',
    '--code-card-soft': '#16243d',
    '--code-border': '#233a62',
    '--code-text': '#e2e8f0',
    '--code-muted': '#94a3b8',
    '--code-accent': '#22d3ee',
    '--code-accent-2': '#f59e0b',
} as CSSProperties;

function normalizeTaskStatus(task: { status?: string }): StageStatus {
    const normalized = String(task.status ?? '').toUpperCase();
    if (normalized === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (normalized === 'IN_REVIEW') return 'IN_REVIEW';
    if (normalized === 'DONE') return 'DONE';
    if (normalized === 'BLOCKED') return 'BLOCKED';
    return 'TODO';
}

function toReadableDate(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function shortMessage(message: string): string {
    const trimmed = message.trim();
    if (!trimmed) return 'Mesaj yok';
    return trimmed.length > 72 ? `${trimmed.slice(0, 72)}...` : trimmed;
}

function shortSha(sha: string | null): string {
    if (!sha) return '---';
    return sha.slice(0, 7);
}

function getToneClasses(tone: CheckTone): string {
    if (tone === 'ok') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }
    if (tone === 'warn') {
        return 'border-amber-200 bg-amber-50 text-amber-800';
    }
    return 'border-rose-200 bg-rose-50 text-rose-800';
}

function buildQualityChecks(
    connected: boolean,
    branchCount: number,
    reviewCount: number,
    blockedCount: number,
    doneThisWeek: number,
): QualityCheck[] {
    return [
        {
            key: 'repo',
            label: 'Repo baglantisi',
            description: connected
                ? `Depo baglantisi aktif, ${branchCount} branch izlendi.`
                : 'Bu proje icin GitHub baglantisi henuz tanimlanmamis.',
            tone: connected ? 'ok' : 'alert',
        },
        {
            key: 'review',
            label: 'Review kuyrugu',
            description: reviewCount > 0
                ? `${reviewCount} is code review bekliyor.`
                : 'Review bekleyen is yok, kuyruk temiz.',
            tone: reviewCount > 5 ? 'alert' : reviewCount > 0 ? 'warn' : 'ok',
        },
        {
            key: 'blocked',
            label: 'Blokaj durumu',
            description: blockedCount > 0
                ? `${blockedCount} blokajli task var, teknik temizleme gerekli.`
                : 'Aktif blokaj yok.',
            tone: blockedCount > 0 ? 'alert' : 'ok',
        },
        {
            key: 'flow',
            label: 'Haftalik cikis hizi',
            description: `${doneThisWeek} task son 7 gunde DONE durumuna gecti.`,
            tone: doneThisWeek >= 6 ? 'ok' : doneThisWeek >= 3 ? 'warn' : 'alert',
        },
    ];
}

function buildReleaseWindows(baseDate: Date): Array<{ title: string; date: string; focus: string }> {
    return [2, 4, 7].map((offset, index) => {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + offset);

        return {
            title: index === 0 ? 'Hotfix Penceresi' : index === 1 ? 'Minor Release' : 'Sprint Release',
            date: new Intl.DateTimeFormat('tr-TR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
            }).format(nextDate),
            focus: index === 0 ? 'Bugfix + stabilization' : index === 1 ? 'Feature batch' : 'Full deploy',
        };
    });
}

export function CodeProcessesPage() {
    const user = useAuthStore((state) => state.user);
    const role = String(user?.role ?? '').toUpperCase();
    const scopedProjects = PERSONAL_PROJECT_SCOPE_ROLES.has(role);

    const [selectedProjectId, setSelectedProjectId] = useState('');

    const projectsQuery = useQuery({
        queryKey: ['code-processes', 'projects', role, scopedProjects],
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

    const codeProcessQuery = useQuery({
        queryKey: ['code-processes', selectedProjectId],
        queryFn: () => getProjectCodeProcesses(selectedProjectId, {commitsPerPage: 6, recentTaskLimit: 18}),
        enabled: !!selectedProjectId,
        staleTime: 30_000,
    });

    const codeProcess = codeProcessQuery.data;
    const overview = codeProcess?.github.overview;
    const commits = codeProcess?.github.commits.commits ?? [];
    const tasksSnapshot = codeProcess?.tasks;
    const recentTasks = tasksSnapshot?.recentTasks ?? [];
    const summary = tasksSnapshot?.summary;
    const githubErrors = codeProcess?.github.errors;

    const stageCards = useMemo(
        () => STAGE_DEFINITIONS.map((stage) => {
            const items = recentTasks
                .filter((task) => normalizeTaskStatus(task) === stage.key)
                .slice(0, 4);
            return {
                ...stage,
                count: summary?.byStatus?.[stage.key] ?? 0,
                items,
            };
        }),
        [recentTasks, summary],
    );

    const metrics = useMemo(() => ({
        reviewCount: summary?.byStatus?.IN_REVIEW ?? 0,
        blockedCount: summary?.byStatus?.BLOCKED ?? 0,
        inProgressCount: summary?.byStatus?.IN_PROGRESS ?? 0,
        doneThisWeek: summary?.doneThisWeek ?? 0,
    }), [summary]);

    const qualityChecks = useMemo(
        () => buildQualityChecks(
            Boolean(overview?.connected),
            overview?.branches?.length ?? 0,
            metrics.reviewCount,
            metrics.blockedCount,
            metrics.doneThisWeek,
        ),
        [metrics.blockedCount, metrics.doneThisWeek, metrics.reviewCount, overview],
    );

    const releaseWindows = useMemo(() => buildReleaseWindows(new Date()), []);

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
                icon={<Code2 size={20} color="#22D3EE"/>}
                title="Kod Surecleri"
                subtitle="Gelistirme akisi, review kuyrugu ve release plani"
                actions={headerActions}
            />

            <section
                className="relative mb-4 overflow-hidden rounded-2xl border p-5"
                style={{
                    borderColor: 'var(--code-border)',
                    background: 'linear-gradient(130deg, var(--code-bg) 0%, #091224 45%, #112a3d 100%)',
                }}
            >
                <div
                    className="pointer-events-none absolute -right-16 -top-14 h-44 w-44 rounded-full opacity-40 blur-3xl"
                    style={{backgroundColor: 'var(--code-accent)'}}/>
                <div
                    className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full opacity-30 blur-2xl"
                    style={{backgroundColor: 'var(--code-accent-2)'}}/>

                <div className="relative z-10 grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <div>
                        <p className="text-xs uppercase tracking-[0.16em]" style={{color: 'var(--code-muted)'}}>
                            Engineering Flow
                        </p>
                        <h2 className="mt-2 text-2xl font-bold" style={{color: 'var(--code-text)'}}>
                            {selectedProject?.name ?? 'Kod sureci panosu'}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm" style={{color: 'var(--code-muted)'}}>
                            Bu alan proje bazli kod surecini tek ekranda toplar: backlog yogunlugu, review kuyrugu,
                            commit akis hizi ve release pencereleri.
                        </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        <article className="rounded-xl border p-3"
                                 style={{borderColor: 'var(--code-border)', backgroundColor: 'rgba(22, 36, 61, 0.76)'}}>
                            <p className="text-xs" style={{color: 'var(--code-muted)'}}>Aktif Implementasyon</p>
                            <p className="mt-1 text-xl font-bold" style={{color: 'var(--code-text)'}}>
                                {metrics.inProgressCount}
                            </p>
                        </article>
                        <article className="rounded-xl border p-3"
                                 style={{borderColor: 'var(--code-border)', backgroundColor: 'rgba(22, 36, 61, 0.76)'}}>
                            <p className="text-xs" style={{color: 'var(--code-muted)'}}>Son 7 Gun Cikis</p>
                            <p className="mt-1 text-xl font-bold" style={{color: 'var(--code-text)'}}>
                                {metrics.doneThisWeek}
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {!selectedProjectId && !projectsQuery.isLoading && (
                <section
                    className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
                    Kod sureclerini gorebilmek icin once bir proje secilmelidir.
                </section>
            )}

            {selectedProjectId && (
                <>
                    <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Review Kuyrugu</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.reviewCount}</p>
                            <p className="text-xs text-gray-500">Inceleme bekleyen PR/task</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Blocked Isler</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.blockedCount}</p>
                            <p className="text-xs text-gray-500">Bagimlilik veya teknik engel</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Branch Sayisi</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{overview?.branches?.length ?? 0}</p>
                            <p className="text-xs text-gray-500">Aktif olarak izlenen dal</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Son Commit</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{commits.length}</p>
                            <p className="text-xs text-gray-500">Gorunen commit adedi</p>
                        </article>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
                        <div className="space-y-4">
                            <article className="rounded-2xl border border-gray-200 bg-white p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <GitPullRequest size={15} className="text-cyan-600"/>
                                        Akis Panosu
                                    </h3>
                                    <span className="text-xs text-gray-500">Task durumuna gore canli dagilim</span>
                                </div>

                                {codeProcessQuery.isLoading ? (
                                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                        {Array.from({length: 6}).map((_, index) => (
                                            <div key={index}
                                                 className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-50"/>
                                        ))}
                                    </div>
                                ) : codeProcessQuery.isError ? (
                                    <div
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-8 text-sm text-rose-700">
                                        Task verileri alinamadi.
                                    </div>
                                ) : (
                                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                        {stageCards.map((stage) => (
                                            <div key={stage.key}
                                                 className={`rounded-xl border p-3 ${stage.borderClass}`}>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-gray-900">{stage.label}</p>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stage.toneClass}`}>
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
                                                        <p key={task.id}
                                                           className="truncate rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                                            {task.title}
                                                        </p>
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
                                        <GitCommitHorizontal size={15} className="text-amber-600"/>
                                        Commit AkiSi
                                    </h3>
                                    <span className="text-xs text-gray-500">Son commit hareketleri</span>
                                </div>

                                {codeProcessQuery.isLoading ? (
                                    <div className="space-y-2">
                                        {Array.from({length: 4}).map((_, index) => (
                                            <div key={index}
                                                 className="h-14 animate-pulse rounded-lg border border-gray-200 bg-gray-50"/>
                                        ))}
                                    </div>
                                ) : codeProcessQuery.isError ? (
                                    <div
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-8 text-sm text-rose-700">
                                        Commit listesi alinamadi.
                                    </div>
                                ) : githubErrors?.commits ? (
                                    <div
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-8 text-sm text-rose-700">
                                        {githubErrors.commits}
                                    </div>
                                ) : commits.length === 0 ? (
                                    <div
                                        className="rounded-lg border border-dashed border-gray-200 px-3 py-8 text-sm text-gray-500">
                                        Bu proje icin commit verisi bulunamadi.
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {commits.map((commit: ProjectGithubCommit) => (
                                            <li key={commit.sha}
                                                className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-gray-900">{shortMessage(commit.message)}</p>
                                                    <span
                                                        className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-100">
                                                        {shortSha(commit.shortSha ?? commit.sha)}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {commit.authorName} • {toReadableDate(commit.committedAt)}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </article>
                        </div>

                        <div className="space-y-4">
                            <article className="rounded-2xl border border-gray-200 bg-white p-4">
                                <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <GitBranch size={15} className="text-cyan-600"/>
                                    Repo Durumu
                                </h3>

                                {codeProcessQuery.isLoading ? (
                                    <div className="space-y-2">
                                        {Array.from({length: 3}).map((_, index) => (
                                            <div key={index} className="h-10 animate-pulse rounded-md bg-gray-100"/>
                                        ))}
                                    </div>
                                ) : codeProcessQuery.isError ? (
                                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                                        Repo ozeti alinamadi.
                                    </p>
                                ) : githubErrors?.overview ? (
                                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                                        {githubErrors.overview}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500">Baglanti</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {overview?.connected ? 'GitHub bagli' : 'GitHub baglantisi yok'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500">Repository</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {overview?.repository?.fullName ?? 'Tanimli degil'}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                <p className="text-xs text-gray-500">Open Issues</p>
                                                <p className="mt-1 text-sm font-bold text-gray-900">
                                                    {overview?.repository?.openIssues ?? 0}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                <p className="text-xs text-gray-500">Default Branch</p>
                                                <p className="mt-1 text-sm font-bold text-gray-900">
                                                    {overview?.repository?.defaultBranch ?? '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </article>

                            <article className="rounded-2xl border border-gray-200 bg-white p-4">
                                <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <Rocket size={15} className="text-amber-600"/>
                                    Release Takvimi
                                </h3>
                                <ul className="space-y-2">
                                    {releaseWindows.map((window) => (
                                        <li key={window.title}
                                            className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-sm font-semibold text-gray-900">{window.title}</p>
                                            <p className="text-xs text-gray-500">{window.date}</p>
                                            <p className="mt-1 text-xs font-medium text-gray-700">{window.focus}</p>
                                        </li>
                                    ))}
                                </ul>
                            </article>

                            <article className="rounded-2xl border border-gray-200 bg-white p-4">
                                <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <ShieldCheck size={15} className="text-emerald-600"/>
                                    Kalite Kontrol
                                </h3>
                                <ul className="space-y-2">
                                    {qualityChecks.map((check) => (
                                        <li key={check.key}
                                            className={`rounded-lg border px-3 py-2 ${getToneClasses(check.tone)}`}>
                                            <p className="text-sm font-semibold">{check.label}</p>
                                            <p className="text-xs">{check.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </div>
                    </section>

                    <section className="mt-4"/>
                </>
            )}
        </div>
    );
}

