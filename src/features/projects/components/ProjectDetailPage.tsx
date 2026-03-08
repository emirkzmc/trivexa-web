import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowLeft, CircleDashed, FolderKanban, GitBranch, GitCommitHorizontal, Github, ListTodo, Link2, Star, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore';
import { getClientById } from '../../clients/api/clients.api';
import { PageHeader } from '../../../shared/components/PageHeader';
import { formatDate } from '../../../shared/utils/formatDate';
import { formatDuration } from '../../../shared/utils/formatDuration';
import { getTimerHistory } from '../../time-tracker/api/timeTracker.api';
import { getProjectTasks } from '../../tasks/api/tasks.api';
import {
    getProjectById,
    getProjectGithubCommits,
    getProjectGithubOverview,
    getProjectMembers,
    updateProjectGithubRepository,
    type ProjectMember,
} from '../api/projects.api';
import { toast } from 'sonner';

type DetailTab = 'overview' | 'tasks' | 'team' | 'activity' | 'github';

const PROJECT_STATUS_META: Record<string, { label: string; badgeClass: string; progress: number }> = {
    DRAFT: { label: 'Taslak', badgeClass: 'bg-slate-100 text-slate-700', progress: 8 },
    PLANNING: { label: 'Planlama', badgeClass: 'bg-sky-100 text-sky-700', progress: 20 },
    IN_PROGRESS: { label: 'Devam Ediyor', badgeClass: 'bg-amber-100 text-amber-700', progress: 60 },
    ON_HOLD: { label: 'Beklemede', badgeClass: 'bg-orange-100 text-orange-700', progress: 42 },
    COMPLETED: { label: 'Tamamlandi', badgeClass: 'bg-emerald-100 text-emerald-700', progress: 100 },
    CANCELLED: { label: 'Iptal', badgeClass: 'bg-rose-100 text-rose-700', progress: 0 },
    ARCHIVED: { label: 'Arsiv', badgeClass: 'bg-zinc-200 text-zinc-700', progress: 100 },
};

const TASK_STATUS_LABELS: Record<string, string> = {
    TODO: 'Yapilacak',
    IN_PROGRESS: 'Devam',
    IN_REVIEW: 'Incelemede',
    DONE: 'Tamamlandi',
    BLOCKED: 'Bloke',
};

function toProjectStatusMeta(status?: string) {
    return PROJECT_STATUS_META[(status ?? '').toUpperCase()] ?? {
        label: status || 'Bilinmiyor',
        badgeClass: 'bg-gray-100 text-gray-700',
        progress: 12,
    };
}

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function memberName(member: ProjectMember) {
    const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
    return fullName || member.email || member.userId;
}

function timerDurationSeconds(startedAt?: string, stoppedAt?: string, duration?: number) {
    if (typeof duration === 'number' && Number.isFinite(duration)) return Math.max(0, Math.floor(duration));
    if (!startedAt || !stoppedAt) return 0;
    const diff = new Date(stoppedAt).getTime() - new Date(startedAt).getTime();
    return Number.isFinite(diff) && diff > 0 ? Math.floor(diff / 1000) : 0;
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </article>
    );
}

function TabButton({
    label,
    icon,
    active,
    onClick,
}: {
    label: string;
    icon: ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

export function ProjectDetailPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const userRole = useAuthStore((state) => state.user?.role ?? '');
    const { projectId = '' } = useParams<{ projectId: string }>();
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const [githubRepoUrl, setGithubRepoUrl] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');

    const projectQuery = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectById(projectId),
        enabled: !!projectId,
    });
    const membersQuery = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => getProjectMembers(projectId),
        enabled: !!projectId,
    });
    const tasksQuery = useQuery({
        queryKey: ['project-tasks', projectId, { page: 1, limit: 200 }],
        queryFn: () => getProjectTasks(projectId, { page: 1, limit: 200 }),
        enabled: !!projectId,
    });
    const activityQuery = useQuery({
        queryKey: ['project-activity', projectId, { page: 1, limit: 100 }],
        queryFn: () => getTimerHistory({ projectId, page: 1, limit: 100 }),
        enabled: !!projectId,
    });

    const canReadClientDetail = userRole === 'ADMIN' || userRole === 'MANAGER';
    const clientQuery = useQuery({
        queryKey: ['project-client', projectQuery.data?.clientId],
        queryFn: () => getClientById(projectQuery.data!.clientId!),
        enabled: canReadClientDetail && !!projectQuery.data?.clientId,
    });

    const githubOverviewQuery = useQuery({
        queryKey: ['project-github-overview', projectId],
        queryFn: () => getProjectGithubOverview(projectId),
        enabled: !!projectId && activeTab === 'github',
    });

    const githubCommitsQuery = useQuery({
        queryKey: ['project-github-commits', projectId, selectedBranch],
        queryFn: () =>
            getProjectGithubCommits(projectId, {
                branch: selectedBranch || undefined,
                page: 1,
                perPage: 25,
            }),
        enabled: !!projectId && activeTab === 'github' && !!githubOverviewQuery.data?.connected && !!selectedBranch,
    });

    const connectGithubMutation = useMutation({
        mutationFn: (repoUrl: string) => updateProjectGithubRepository(projectId, repoUrl),
        onSuccess: async () => {
            toast.success('GitHub repository baglandi.');
            setGithubRepoUrl('');
            await queryClient.invalidateQueries({ queryKey: ['project-github-overview', projectId] });
            await queryClient.invalidateQueries({ queryKey: ['project-github-commits', projectId] });
        },
        onError: () => {
            toast.error('GitHub repository baglanamadi.');
        },
    });

    const project = projectQuery.data;
    const members = membersQuery.data ?? [];
    const tasks = tasksQuery.data?.data ?? [];
    const activities = activityQuery.data?.data ?? [];
    const statusMeta = toProjectStatusMeta(project?.status);

    const memberById = useMemo(
        () => Object.fromEntries(members.map((member) => [member.userId, member])),
        [members],
    );
    const completedTasks = tasks.filter((task) => ['DONE', 'COMPLETED'].includes((task.status ?? '').toUpperCase()));
    const inProgressTasks = tasks.filter((task) => ['IN_PROGRESS', 'IN_REVIEW'].includes((task.status ?? '').toUpperCase()));
    const totalTrackedSeconds = activities.reduce(
        (acc, entry) => acc + timerDurationSeconds(entry.startedAt, entry.stoppedAt, entry.duration),
        0,
    );
    const taskCountByAssignee = useMemo(() => {
        const map: Record<string, number> = {};
        for (const task of tasks) {
            if (!task.assigneeId) continue;
            map[task.assigneeId] = (map[task.assigneeId] ?? 0) + 1;
        }
        return map;
    }, [tasks]);
    const clientLabel = clientQuery.data?.companyName
        || project?.clientId
        || 'Müşteri atanmamis';
    const canManageGithub = userRole === 'ADMIN' || userRole === 'MANAGER';

    useEffect(() => {
        const overview = githubOverviewQuery.data;
        if (!overview?.connected) {
            setSelectedBranch('');
            return;
        }

        const branchNames = overview.branches.map((branch) => branch.name);
        if (branchNames.length === 0) {
            setSelectedBranch('');
            return;
        }

        if (!selectedBranch || !branchNames.includes(selectedBranch)) {
            const defaultBranch = overview.repository?.defaultBranch;
            setSelectedBranch(
                defaultBranch && branchNames.includes(defaultBranch)
                    ? defaultBranch
                    : branchNames[0],
            );
        }
    }, [githubOverviewQuery.data, selectedBranch]);

    if (!projectId) {
        return <div className="px-8 py-6 text-sm text-red-600">Proje kimligi bulunamadı.</div>;
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<FolderKanban size={20} color="#DC2626" />}
                title={project?.name || 'Proje Detayi'}
                subtitle={project ? `${statusMeta.label} - ${members.length} ekip uyesi` : 'Proje detaylari yükleniyor'}
                actions={(
                    <button
                        type="button"
                        onClick={() => navigate('/app/projeler')}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Projelere Don
                    </button>
                )}
            />

            {projectQuery.isLoading ? (
                <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Yükleniyor...</section>
            ) : projectQuery.isError || !project ? (
                <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-700">Proje detayi yüklenemedi.</section>
            ) : (
                <>
                    <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard title="Toplam Görev" value={String(tasks.length)} subtitle="Projeye bağlı gorevler" />
                        <StatCard title="Tamamlanan" value={String(completedTasks.length)} subtitle="Biten görev sayisi" />
                        <StatCard title="Ekip Uyesi" value={String(members.length)} subtitle="Projeye atanan personel" />
                        <StatCard title="Kayitli Süre" value={formatDuration(totalTrackedSeconds)} subtitle="Aktivite gecmisi" />
                    </section>

                    <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <TabButton label="Genel Bakis" icon={<CircleDashed size={14} />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                            <TabButton label="Görevler" icon={<ListTodo size={14} />} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
                            <TabButton label="Atananlar" icon={<Users size={14} />} active={activeTab === 'team'} onClick={() => setActiveTab('team')} />
                            <TabButton label="Aktivite" icon={<Activity size={14} />} active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
                            <TabButton label="GitHub" icon={<Github size={14} />} active={activeTab === 'github'} onClick={() => setActiveTab('github')} />
                        </div>
                    </section>

                    {activeTab === 'overview' && (
                        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                            <article className="rounded-xl border border-gray-200 bg-white p-4">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <h2 className="text-base font-semibold text-gray-900">Proje Ozeti</h2>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
                                </div>
                                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{project.description?.trim() || 'Açıklama bulunmuyor.'}</p>
                                <div className="mt-3 h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-red-500" style={{ width: `${statusMeta.progress}%` }} /></div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                                    <div className="rounded-lg bg-gray-50 px-3 py-2"><p className="text-xs text-gray-500">Baslangic</p><p>{project.startDate ? formatDate(project.startDate) : '-'}</p></div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2"><p className="text-xs text-gray-500">Teslim</p><p>{project.deadline ? formatDate(project.deadline) : '-'}</p></div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2"><p className="text-xs text-gray-500">Butce</p><p>{formatMoney(project.budget)}</p></div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2"><p className="text-xs text-gray-500">Olusturma</p><p>{project.createdAt ? formatDate(project.createdAt) : '-'}</p></div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2"><p className="text-xs text-gray-500">Bağlı Müşteri</p><p>{clientLabel}</p></div>
                                </div>
                            </article>
                            <article className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="text-base font-semibold text-gray-900">Yapilanlar</h2>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                                    <div className="rounded-lg border border-gray-200 px-3 py-2"><p className="text-xs text-gray-500">Devam Eden</p><p className="text-lg font-bold">{inProgressTasks.length}</p></div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-2"><p className="text-xs text-gray-500">Tamamlanan</p><p className="text-lg font-bold">{completedTasks.length}</p></div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-2"><p className="text-xs text-gray-500">Atanmamis</p><p className="text-lg font-bold">{tasks.filter((task) => !task.assigneeId).length}</p></div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-2"><p className="text-xs text-gray-500">Aktivite</p><p className="text-lg font-bold">{activities.length}</p></div>
                                </div>
                            </article>
                        </section>
                    )}

                    {activeTab === 'tasks' && (
                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">Görevler ve Atananlar</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[820px] text-left text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="px-3 py-2.5 font-semibold">Görev</th>
                                            <th className="px-3 py-2.5 font-semibold">Durum</th>
                                            <th className="px-3 py-2.5 font-semibold">Oncelik</th>
                                            <th className="px-3 py-2.5 font-semibold">Atanan Kisi</th>
                                            <th className="px-3 py-2.5 font-semibold">Teslim</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {tasks.map((task) => {
                                            const statusKey = (task.status ?? '').toUpperCase();
                                            const assignee = task.assigneeFirstName || task.assigneeLastName
                                                ? `${task.assigneeFirstName ?? ''} ${task.assigneeLastName ?? ''}`.trim()
                                                : task.assigneeId
                                                    ? memberName(memberById[task.assigneeId] ?? { userId: task.assigneeId, projectId, role: '', joinedAt: '' })
                                                    : 'Atanmamis';
                                            return (
                                                <tr key={task.id}>
                                                    <td className="px-3 py-2.5"><p className="font-semibold text-gray-900">{task.title}</p><p className="text-xs text-gray-500">{task.description || '-'}</p></td>
                                                    <td className="px-3 py-2.5">{TASK_STATUS_LABELS[statusKey] ?? task.status}</td>
                                                    <td className="px-3 py-2.5">{task.priority || '-'}</td>
                                                    <td className="px-3 py-2.5">{assignee}</td>
                                                    <td className="px-3 py-2.5">{task.dueDate ? formatDate(task.dueDate) : '-'}</td>
                                                </tr>
                                            );
                                        })}
                                        {tasks.length === 0 && <tr><td className="px-3 py-8 text-center text-gray-500" colSpan={5}>Görev bulunmadi.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'team' && (
                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">Projeye Atanan Kisiler</h2>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {members.map((member) => (
                                    <article key={member.id ?? member.userId} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                                        <p className="text-sm font-semibold text-gray-900">{memberName(member)}</p>
                                        <p className="text-xs text-gray-500">{member.email || member.userId}</p>
                                        <p className="mt-2 text-xs text-gray-600">Rol: <strong>{member.role}</strong></p>
                                        <p className="text-xs text-gray-600">Atanan görev: <strong>{taskCountByAssignee[member.userId] ?? 0}</strong></p>
                                        <p className="text-xs text-gray-600">Katilim: <strong>{member.joinedAt ? formatDate(member.joinedAt) : '-'}</strong></p>
                                    </article>
                                ))}
                                {members.length === 0 && <p className="text-sm text-gray-500">Atanmis kisi bulunmuyor.</p>}
                            </div>
                        </section>
                    )}

                    {activeTab === 'activity' && (
                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">Proje Aktivitesi</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="px-3 py-2.5 font-semibold">Kisi</th>
                                            <th className="px-3 py-2.5 font-semibold">Görev</th>
                                            <th className="px-3 py-2.5 font-semibold">Açıklama</th>
                                            <th className="px-3 py-2.5 font-semibold">Süre</th>
                                            <th className="px-3 py-2.5 font-semibold">Baslangic</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activities.map((entry) => {
                                            const fullName = `${entry.userFirstName ?? ''} ${entry.userLastName ?? ''}`.trim();
                                            const userLabel = fullName || entry.userEmail || (entry.userId ? memberName(memberById[entry.userId] ?? { userId: entry.userId, projectId, role: '', joinedAt: '' }) : '-');
                                            return (
                                                <tr key={entry.id}>
                                                    <td className="px-3 py-2.5">{userLabel}</td>
                                                    <td className="px-3 py-2.5">{entry.taskTitle || '-'}</td>
                                                    <td className="px-3 py-2.5">{entry.description || '-'}</td>
                                                    <td className="px-3 py-2.5">{formatDuration(timerDurationSeconds(entry.startedAt, entry.stoppedAt, entry.duration))}</td>
                                                    <td className="px-3 py-2.5">{entry.startedAt ? formatDate(entry.startedAt) : '-'}</td>
                                                </tr>
                                            );
                                        })}
                                        {activities.length === 0 && <tr><td className="px-3 py-8 text-center text-gray-500" colSpan={5}>Aktivite kaydı bulunmuyor.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'github' && (
                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">GitHub Entegrasyonu</h2>
                                    <p className="mt-0.5 text-xs text-gray-500">Repository bilgileri, branchler ve commit gecmisi</p>
                                </div>
                                {githubOverviewQuery.data?.connected && (
                                    <a
                                        href={githubOverviewQuery.data.linkedRepositoryUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        <Link2 size={13} />
                                        Repository Ac
                                    </a>
                                )}
                            </div>

                            {!githubOverviewQuery.data?.connected && canManageGithub && (
                                <form
                                    className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        const normalizedUrl = githubRepoUrl.trim();
                                        if (!normalizedUrl) {
                                            toast.error('GitHub repository URL zorunludur.');
                                            return;
                                        }
                                        connectGithubMutation.mutate(normalizedUrl);
                                    }}
                                >
                                    <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="projectGithubUrl">
                                        GitHub Repository URL
                                    </label>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <input
                                            id="projectGithubUrl"
                                            type="url"
                                            value={githubRepoUrl}
                                            onChange={(event) => setGithubRepoUrl(event.target.value)}
                                            placeholder="https://github.com/owner/repo"
                                            className="h-9 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={connectGithubMutation.isPending}
                                            className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                        >
                                            {connectGithubMutation.isPending ? 'Baglaniyor...' : 'Repository Bagla'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {githubOverviewQuery.isLoading ? (
                                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-8 text-center text-sm text-gray-500">
                                    GitHub bilgileri yükleniyor...
                                </p>
                            ) : githubOverviewQuery.isError ? (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-8 text-center text-sm text-red-700">
                                    GitHub bilgileri yüklenemedi.
                                </p>
                            ) : !githubOverviewQuery.data?.connected ? (
                                <p className="rounded-lg border border-dashed border-gray-300 px-3 py-8 text-center text-sm text-gray-500">
                                    Bu proje icin bağlı bir GitHub repository yok.
                                </p>
                            ) : (
                                <>
                                    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <article className="rounded-lg border border-gray-200 bg-white p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500">Repository</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {githubOverviewQuery.data.repository?.fullName || '-'}
                                            </p>
                                        </article>
                                        <article className="rounded-lg border border-gray-200 bg-white p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500">Varsayilan Branch</p>
                                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                                <GitBranch size={13} />
                                                {githubOverviewQuery.data.repository?.defaultBranch || '-'}
                                            </p>
                                        </article>
                                        <article className="rounded-lg border border-gray-200 bg-white p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500">Yildiz</p>
                                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                                <Star size={13} />
                                                {githubOverviewQuery.data.repository?.stars ?? 0}
                                            </p>
                                        </article>
                                        <article className="rounded-lg border border-gray-200 bg-white p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500">Branch Sayisi</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{githubOverviewQuery.data.branches.length}</p>
                                        </article>
                                    </div>

                                    <div className="mb-3 flex flex-wrap items-end gap-2">
                                        <div className="min-w-[220px]">
                                            <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="branchSelect">
                                                Branch Secimi
                                            </label>
                                            <select
                                                id="branchSelect"
                                                value={selectedBranch}
                                                onChange={(event) => setSelectedBranch(event.target.value)}
                                                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            >
                                                {githubOverviewQuery.data.branches.map((branch) => (
                                                    <option key={branch.name} value={branch.name}>
                                                        {branch.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {githubCommitsQuery.isLoading ? (
                                        <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-8 text-center text-sm text-gray-500">
                                            Commit gecmisi yükleniyor...
                                        </p>
                                    ) : githubCommitsQuery.isError ? (
                                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-8 text-center text-sm text-red-700">
                                            Commit gecmisi yüklenemedi.
                                        </p>
                                    ) : (githubCommitsQuery.data?.commits.length ?? 0) === 0 ? (
                                        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-8 text-center text-sm text-gray-500">
                                            Seçili branch icin commit bulunamadı.
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[920px] text-left text-sm">
                                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                                    <tr>
                                                        <th className="px-3 py-2.5 font-semibold">Commit</th>
                                                        <th className="px-3 py-2.5 font-semibold">Mesaj</th>
                                                        <th className="px-3 py-2.5 font-semibold">Yazar</th>
                                                        <th className="px-3 py-2.5 font-semibold">Tarih</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {githubCommitsQuery.data?.commits.map((commit) => (
                                                        <tr key={commit.sha}>
                                                            <td className="px-3 py-2.5">
                                                                {commit.htmlUrl ? (
                                                                    <a
                                                                        href={commit.htmlUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                                                    >
                                                                        <GitCommitHorizontal size={13} />
                                                                        {commit.shortSha || commit.sha.slice(0, 7)}
                                                                    </a>
                                                                ) : (
                                                                    <span>{commit.shortSha || commit.sha.slice(0, 7)}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-700">
                                                                {(commit.message || '-').split('\n')[0]}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-700">{commit.authorName || '-'}</td>
                                                            <td className="px-3 py-2.5 text-gray-700">
                                                                {commit.committedAt ? formatDate(commit.committedAt) : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}


