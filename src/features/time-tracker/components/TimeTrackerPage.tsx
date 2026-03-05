import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {
    Clock3,
    FolderOpen,
    History,
    ListFilter,
    Play,
    Square,
    Timer,
    XCircle,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import {PageHeader} from '../../../shared/components/PageHeader';
import {Pagination} from '../../../shared/components/Pagination';
import {formatDate} from '../../../shared/utils/formatDate';
import {formatDuration} from '../../../shared/utils/formatDuration';
import {getProjects} from '../../projects/api/projects.api';
import {getProjectTasks} from '../../tasks/api/tasks.api';
import {getTimerHistory, type StartTimerPayload, type TimerEntry} from '../api/timeTracker.api';
import {useActiveTimer} from '../hooks/useActiveTimer';
import {useCancelTimer, useStartTimer, useStopTimer} from '../hooks/useTimerMutations';

const HISTORY_LIMIT_OPTIONS = [10, 20, 50];

function formatClock(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

function getStatusLabel(status: TimerEntry['status']): string {
    if (status === 'ACTIVE') return 'Calisiyor';
    if (status === 'STOPPED') return 'Tamamlandi';
    return 'Iptal';
}

function getStatusChipClass(status: TimerEntry['status']): string {
    if (status === 'ACTIVE') return 'bg-red-100 text-red-700';
    if (status === 'STOPPED') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-600';
}

function SortIcon({ field, currentSortField, currentSortDirection }: { field: keyof TimerEntry | 'projectName', currentSortField: keyof TimerEntry | 'projectName', currentSortDirection: 'asc' | 'desc' }) {
    if (currentSortField !== field) return <ArrowUp size={12} className="text-gray-300 opacity-0 group-hover:opacity-50" />;
    return currentSortDirection === 'asc' ? <ArrowUp size={12} className="text-red-500" /> : <ArrowDown size={12} className="text-red-500" />;
}

export function TimeTrackerPage() {
    const [formData, setFormData] = useState<StartTimerPayload>({projectId: '', taskId: '', description: ''});
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortField, setSortField] = useState<keyof TimerEntry | 'projectName'>('updatedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const activeTimerQuery = useActiveTimer();
    const startMutation = useStartTimer();
    const stopMutation = useStopTimer();
    const cancelMutation = useCancelTimer();

    const historyQuery = useQuery({
        queryKey: ['timer-history', page, limit],
        queryFn: () =>
            getTimerHistory({
                page,
                limit,
            }),
    });

    const projectQuery = useQuery({
        queryKey: ['projects', 'timer-select', 'my-projects'],
        queryFn: () => getProjects({page: 1, limit: 100, myProjectsOnly: true}),
    });

    const taskQuery = useQuery({
        queryKey: ['project-tasks', 'timer-select', formData.projectId],
        queryFn: () => getProjectTasks(formData.projectId, {page: 1, limit: 100}),
        enabled: !!formData.projectId,
    });

    const projects = projectQuery.data?.data;
    const tasks = taskQuery.data?.data;
    const historyRows = historyQuery.data?.data;
    const filteredHistoryRows = useMemo(
        () => (historyRows ?? []).filter((row) => !statusFilter || row.status === statusFilter),
        [historyRows, statusFilter],
    );
    const total = historyQuery.data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const projectNameMap = useMemo(
        () => new Map((projects ?? []).map((project) => [project.id, project.name])),
        [projects],
    );

    const filteredAndSortedHistoryRows = useMemo(() => {
        const sorted = [...filteredHistoryRows].sort((a, b) => {
            let aVal: unknown = a[sortField as keyof TimerEntry];
            let bVal: unknown = b[sortField as keyof TimerEntry];

            if (sortField === 'projectName') {
                aVal = projectNameMap.get(a.projectId) ?? a.projectId;
                bVal = projectNameMap.get(b.projectId) ?? b.projectId;
            } else if (sortField === 'startedAt' || sortField === 'stoppedAt' || sortField === 'updatedAt') {
                aVal = aVal ? new Date(aVal as string).getTime() : 0;
                bVal = bVal ? new Date(bVal as string).getTime() : 0;
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if ((aVal as string | number) < (bVal as string | number)) return sortDirection === 'asc' ? -1 : 1;
            if ((aVal as string | number) > (bVal as string | number)) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredHistoryRows, sortField, sortDirection, projectNameMap]);

    const activeTimer = activeTimerQuery.timer;
    const activeProjectName = activeTimer?.projectId
        ? (projectNameMap.get(activeTimer.projectId) ?? activeTimer.projectId)
        : 'Proje secilmedi';

    const trackedSecondsInList = useMemo(
        () => filteredAndSortedHistoryRows.reduce((sum, row) => sum + (row.duration ?? 0), 0),
        [filteredAndSortedHistoryRows],
    );

    const completedCountInList = useMemo(
        () => filteredAndSortedHistoryRows.filter((row) => row.status === 'STOPPED').length,
        [filteredAndSortedHistoryRows],
    );

    const handleSort = (field: keyof TimerEntry | 'projectName') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    function handleStartSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!formData.projectId) return;

        startMutation.mutate(
            {
                projectId: formData.projectId,
                taskId: formData.taskId?.trim() ? formData.taskId : undefined,
                description: (formData.description ?? '').trim() || undefined,
            },
            {
                onSuccess: () => {
                    setFormData((prev) => ({...prev, description: ''}));
                },
            },
        );
    }

    function handleStopTimer() {
        if (activeTimerQuery.isActive) {
            stopMutation.mutate();
        }
    }

    function handleCancelActiveTimer() {
        if (!activeTimer?.id) return;
        const isConfirmed = window.confirm('Aktif kayit iptal edilsin mi?');
        if (isConfirmed) {
            cancelMutation.mutate(activeTimer.id);
        }
    }

    function handleStatusFilterChange(value: string) {
        setStatusFilter(value);
        setPage(1);
    }

    function handleLimitChange(nextLimit: number) {
        setLimit(nextLimit);
        setPage(1);
    }

    const isFormDisabled = activeTimerQuery.isActive || startMutation.isPending;

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-[18px]">
            <PageHeader
                icon={<Timer size={20} color="#DC2626"/>}
                title="Time Tracker"
                subtitle="Calisma suresini baslat, durdur ve gecmisi takip et"
            />

            <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
                <article
                    className="box-border rounded-xl border border-gray-200 bg-gradient-to-br from-red-500 to-orange-500 p-[22px] text-white shadow-[0_10px_24px_rgba(220,38,38,0.2)]">
                    <div className="mb-[10px] flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-90">
                            Aktif sayac
                        </span>
                        <span
                            className={`inline-flex items-center justify-center rounded-full px-[10px] py-1 text-[11px] font-bold ${
                                activeTimerQuery.isActive
                                    ? 'bg-white/25 text-white'
                                    : 'bg-white/15 text-red-50'
                            }`}
                        >
                            {activeTimerQuery.isActive ? 'Calisiyor' : 'Hazir'}
                        </span>
                    </div>

                    <h2 className="mb-3 leading-none tracking-[0.05em] [font-size:clamp(2.1rem,4vw,3.2rem)]">
                        {activeTimerQuery.isActive ? formatClock(activeTimerQuery.elapsed) : '00:00:00'}
                    </h2>

                    <p className="m-0 inline-flex items-center gap-1.5 text-[13px] font-medium">
                        <FolderOpen size={14}/>
                        <span>{activeProjectName}</span>
                    </p>

                    <p className="mt-3 mb-0 max-w-[52ch] text-[13px] leading-[1.45] opacity-90">
                        {activeTimer?.description || 'Timer baslatmak icin sagdaki formu doldurun.'}
                    </p>

                    <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                        <button
                            type="button"
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[13px] font-semibold text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            onClick={handleStopTimer}
                            disabled={!activeTimerQuery.isActive || stopMutation.isPending}
                        >
                            <Square size={14}/>
                            Durdur
                        </button>
                        <button
                            type="button"
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-[13px] font-semibold text-orange-50 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            onClick={handleCancelActiveTimer}
                            disabled={!activeTimerQuery.isActive || cancelMutation.isPending}
                        >
                            <XCircle size={14}/>
                            Iptal Et
                        </button>
                    </div>
                </article>

                <article className="box-border rounded-xl border border-gray-200 bg-white p-[18px]">
                    <div className="mb-[10px] flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-700">
                            Yeni kayit
                        </span>
                    </div>

                    <form className="flex flex-col gap-2" onSubmit={handleStartSubmit}>
                        <label htmlFor="projectId" className="text-xs font-semibold text-gray-700">Proje</label>
                        <select
                            id="projectId"
                            value={formData.projectId}
                            onChange={(event) => {
                                const nextProjectId = event.target.value;
                                setFormData((prev) => ({
                                    ...prev,
                                    projectId: nextProjectId,
                                    taskId: '',
                                }));
                            }}
                            disabled={isFormDisabled || projectQuery.isLoading}
                            required
                            className="h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900"
                        >
                            <option value="">
                                {projectQuery.isLoading
                                    ? 'Projeler yukleniyor...'
                                    : projectQuery.isError
                                        ? 'Projeler alinamadi'
                                        : (projects?.length ?? 0) === 0
                                            ? 'Proje bulunamadi'
                                            : 'Proje secin'}
                            </option>
                            {(projects ?? []).map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>

                        <label htmlFor="taskId" className="text-xs font-semibold text-gray-700">Task</label>
                        <select
                            id="taskId"
                            value={formData.taskId ?? ''}
                            onChange={(event) =>
                                setFormData((prev) => ({...prev, taskId: event.target.value}))
                            }
                            disabled={isFormDisabled || !formData.projectId || taskQuery.isLoading}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900"
                        >
                            <option value="">
                                {!formData.projectId
                                    ? 'Once proje secin'
                                    : taskQuery.isLoading
                                        ? 'Tasklar yukleniyor...'
                                        : taskQuery.isError
                                            ? 'Tasklar alinamadi'
                                            : (tasks?.length ?? 0) === 0
                                                ? 'Task bulunamadi'
                                                : 'Task secin (opsiyonel)'}
                            </option>
                            {(tasks ?? []).map((task) => (
                                <option key={task.id} value={task.id}>
                                    {task.title}
                                </option>
                            ))}
                        </select>

                        <label htmlFor="description" className="text-xs font-semibold text-gray-700">Aciklama</label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(event) =>
                                setFormData((prev) => ({...prev, description: event.target.value}))
                            }
                            placeholder="Bugun ne uzerinde calisiyorsunuz?"
                            disabled={isFormDisabled}
                            maxLength={300}
                            className="min-h-[88px] resize-y rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900"
                        />

                        <button
                            type="submit"
                            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isFormDisabled || !formData.projectId}
                        >
                            <Play size={14}/>
                            Timer Baslat
                        </button>
                    </form>
                </article>
            </section>

            <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="flex items-center gap-2.5 rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
                    <Clock3 size={16} color="#1F2937"/>
                    <div>
                        <p className="m-0 mb-0.5 text-xs text-gray-500">Gorunen sure</p>
                        <strong className="text-base text-gray-900">{formatDuration(trackedSecondsInList)}</strong>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
                    <History size={16} color="#1F2937"/>
                    <div>
                        <p className="m-0 mb-0.5 text-xs text-gray-500">Toplam kayit</p>
                        <strong className="text-base text-gray-900">{total}</strong>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
                    <ListFilter size={16} color="#1F2937"/>
                    <div>
                        <p className="m-0 mb-0.5 text-xs text-gray-500">Tamamlanan (sayfa)</p>
                        <strong className="text-base text-gray-900">{completedCountInList}</strong>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <div
                    className="mb-3 flex flex-col items-start justify-between gap-3 min-[900px]:flex-row min-[900px]:items-center">
                    <div>
                        <h3 className="m-0 text-lg text-gray-900">Kayit gecmisi</h3>
                        <p className="mt-0.5 mb-0 text-xs text-gray-500">Durum ve sure detaylari</p>
                    </div>

                    <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-[7px] text-[13px] min-[900px]:w-auto"
                        value={statusFilter}
                        onChange={(event) => handleStatusFilterChange(event.target.value)}
                    >
                        <option value="">Tum durumlar</option>
                        <option value="ACTIVE">Calisiyor</option>
                        <option value="STOPPED">Tamamlandi</option>
                        <option value="CANCELLED">Iptal</option>
                    </select>
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full border-collapse text-[13px]">
                        <thead>
                        <tr>
                            <th 
                                onClick={() => handleSort('projectName')}
                                className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center gap-1">Proje <SortIcon field="projectName" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th 
                                onClick={() => handleSort('description')}
                                className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center gap-1">Aciklama <SortIcon field="description" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th 
                                onClick={() => handleSort('startedAt')}
                                className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center gap-1">Baslangic <SortIcon field="startedAt" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th 
                                onClick={() => handleSort('stoppedAt')}
                                className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center gap-1">Bitis <SortIcon field="stoppedAt" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th 
                                onClick={() => handleSort('duration')}
                                className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center gap-1">Sure <SortIcon field="duration" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                            <th 
                                onClick={() => handleSort('status')}
                                className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center gap-1">Durum <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {historyQuery.isLoading && (
                            <tr>
                                <td colSpan={6} className="px-3 py-[26px] text-center text-gray-400">
                                    Kayitlar yukleniyor...
                                </td>
                            </tr>
                        )}

                        {historyQuery.isError && (
                            <tr>
                                <td colSpan={6} className="px-3 py-[26px] text-center text-red-600">
                                    Kayitlar alinirken bir hata olustu.
                                </td>
                            </tr>
                        )}

                        {!historyQuery.isLoading && !historyQuery.isError && filteredAndSortedHistoryRows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-3 py-[26px] text-center text-gray-400">
                                    Filtreye uygun kayit bulunamadi.
                                </td>
                            </tr>
                        )}

                        {filteredAndSortedHistoryRows.map((row) => (
                            <tr key={row.id}>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">
                                    {projectNameMap.get(row.projectId) ?? row.projectId}
                                </td>
                                <td className="max-w-[320px] border-b border-gray-100 px-3 py-[11px] align-top text-gray-600">
                                    {row.description || '-'}
                                </td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{formatDate(row.startedAt)}</td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{row.stoppedAt ? formatDate(row.stoppedAt) : '-'}</td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{formatDuration(row.duration ?? 0)}</td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top">
                                        <span
                                            className={`inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold ${getStatusChipClass(row.status)}`}>
                                            {getStatusLabel(row.status)}
                                        </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {historyQuery.isLoading && (
                    <p className="px-3 py-[26px] text-center text-sm text-gray-400 md:hidden">
                        Kayitlar yukleniyor...
                    </p>
                )}

                {historyQuery.isError && (
                    <p className="px-3 py-[26px] text-center text-sm text-red-600 md:hidden">
                        Kayitlar alinirken bir hata olustu.
                    </p>
                )}

                {!historyQuery.isLoading && !historyQuery.isError && filteredHistoryRows.length === 0 && (
                    <p className="px-3 py-[26px] text-center text-sm text-gray-400 md:hidden">
                        Filtreye uygun kayit bulunamadi.
                    </p>
                )}

                <div className="space-y-3 md:hidden">
                    {!historyQuery.isLoading && !historyQuery.isError && filteredHistoryRows.map((row) => (
                        <article key={row.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="m-0 text-sm font-semibold text-gray-900">
                                    {projectNameMap.get(row.projectId) ?? row.projectId}
                                </p>
                                <span className={`inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold ${getStatusChipClass(row.status)}`}>
                                    {getStatusLabel(row.status)}
                                </span>
                            </div>
                            <p className="m-0 mb-2 text-xs text-gray-600">
                                {row.description || '-'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                <div>
                                    <p className="m-0 text-[11px] text-gray-500">Baslangic</p>
                                    <p className="m-0">{formatDate(row.startedAt)}</p>
                                </div>
                                <div>
                                    <p className="m-0 text-[11px] text-gray-500">Bitis</p>
                                    <p className="m-0">{row.stoppedAt ? formatDate(row.stoppedAt) : '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="m-0 text-[11px] text-gray-500">Sure</p>
                                    <p className="m-0 font-medium text-gray-900">{formatDuration(row.duration ?? 0)}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={handleLimitChange}
                    limitOptions={HISTORY_LIMIT_OPTIONS}
                />
            </section>
        </div>
    );
}
