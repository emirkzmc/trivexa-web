import { Clock3, FolderOpen, History, ListFilter, Play, Square, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Pagination } from '../../../../shared/components/Pagination';
import { formatDate } from '../../../../shared/utils/formatDate';
import { formatDuration } from '../../../../shared/utils/formatDuration';
import type { ProjectItem } from '../../../projects/api/projects.api';
import type { TaskItem } from '../../../tasks/api/tasks.api';
import type { StartTimerPayload, TimerEntry } from '../../api/timeTracker.api';
import { SortIcon } from '../SortIcon';
import { formatClock, getEntryDurationSeconds, getStatusChipClass, getStatusLabel } from '../../utils/timeTracker.utils';

function normalizeHexColor(color: string): string {
    const trimmed = color.trim();
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
    if (!match) return '#DC2626';

    const value = match[1];
    if (value.length === 3) {
        return `#${value.split('').map((char) => `${char}${char}`).join('')}`.toUpperCase();
    }
    return `#${value}`.toUpperCase();
}

function shiftHexColor(color: string, amount: number): string {
    const hex = normalizeHexColor(color).slice(1);
    const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
    const clamp = (value: number) => Math.max(0, Math.min(255, value));

    const nextR = clamp(r + amount);
    const nextG = clamp(g + amount);
    const nextB = clamp(b + amount);

    return `#${[nextR, nextG, nextB]
        .map((channel) => channel.toString(16).padStart(2, '0'))
        .join('')}`.toUpperCase();
}

function hexToRgba(color: string, alpha: number): string {
    const hex = normalizeHexColor(color).slice(1);
    const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
    const safeAlpha = Math.max(0, Math.min(1, alpha));
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

interface TimerTabProps {
    activeTimerQuery: {
        isActive: boolean;
        elapsed: number;
    };
    activeTimerAccent: string;
    activeTimer: TimerEntry | null | undefined;
    activeProjectName: string;
    stopPending: boolean;
    onStopTimer: () => void;
    formData: StartTimerPayload;
    setFormData: React.Dispatch<React.SetStateAction<StartTimerPayload>>;
    onStartSubmit: (event: FormEvent<HTMLFormElement>) => void;
    isFormDisabled: boolean;
    projectLoading: boolean;
    projectError: boolean;
    taskLoading: boolean;
    taskError: boolean;
    projects: ProjectItem[];
    tasks: TaskItem[];
    trackedSecondsInList: number;
    total: number;
    completedCountInList: number;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    sortField: keyof TimerEntry | 'projectName';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof TimerEntry | 'projectName') => void;
    historyLoading: boolean;
    historyError: boolean;
    filteredAndSortedHistoryRows: TimerEntry[];
    resolveProjectName: (row: TimerEntry) => string;
    deletePending: boolean;
    onDeleteHistoryRow: (id: string) => void;
    page: number;
    totalPages: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    limitOptions: number[];
}

export function TimerTab({
    activeTimerQuery,
    activeTimerAccent,
    activeTimer,
    activeProjectName,
    stopPending,
    onStopTimer,
    formData,
    setFormData,
    onStartSubmit,
    isFormDisabled,
    projectLoading,
    projectError,
    taskLoading,
    taskError,
    projects,
    tasks,
    trackedSecondsInList,
    total,
    completedCountInList,
    statusFilter,
    onStatusFilterChange,
    sortField,
    sortDirection,
    onSort,
    historyLoading,
    historyError,
    filteredAndSortedHistoryRows,
    resolveProjectName,
    deletePending,
    onDeleteHistoryRow,
    page,
    totalPages,
    limit,
    onPageChange,
    onLimitChange,
    limitOptions,
}: TimerTabProps) {
    const activeTimerLight = shiftHexColor(activeTimerAccent, 56);
    const activeTimerMid = shiftHexColor(activeTimerAccent, 10);
    const activeTimerDark = shiftHexColor(activeTimerAccent, -68);
    const activeTimerCardStyle = {
        backgroundImage: `linear-gradient(135deg, ${activeTimerLight} 0%, ${activeTimerMid} 44%, ${activeTimerDark} 100%)`,
        boxShadow: `0 16px 34px ${hexToRgba(activeTimerAccent, 0.42)}`,
        borderColor: hexToRgba(activeTimerDark, 0.5),
    };

    return (
        <>
            <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
                <article
                    className="box-border rounded-xl border border-gray-200 p-[22px] text-white"
                    style={activeTimerCardStyle}
                >
                    <div className="mb-[10px] flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-90">Aktif sayac</span>
                        <span
                            className={`inline-flex items-center justify-center rounded-full px-[10px] py-1 text-[11px] font-bold ${
                                activeTimerQuery.isActive
                                    ? 'bg-white/25 text-white'
                                    : 'bg-white/15 text-white/90'
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
                            onClick={onStopTimer}
                            disabled={!activeTimerQuery.isActive || stopPending}
                        >
                            <Square size={14}/>
                            Durdur
                        </button>
                    </div>
                </article>

                <article className="box-border rounded-xl border border-gray-200 bg-white p-[18px]">
                    <div className="mb-[10px] flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-700">Yeni kayit</span>
                    </div>

                    <form className="flex flex-col gap-2" onSubmit={onStartSubmit}>
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
                            disabled={isFormDisabled || projectLoading}
                            required
                            className="h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900"
                        >
                            <option value="">
                                {projectLoading
                                    ? 'Projeler yukleniyor...'
                                    : projectError
                                        ? 'Projeler alinamadi'
                                        : projects.length === 0
                                            ? 'Proje bulunamadi'
                                            : 'Proje secin'}
                            </option>
                            {projects.map((project) => (
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
                            disabled={isFormDisabled || !formData.projectId || taskLoading}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] text-gray-900"
                        >
                            <option value="">
                                {!formData.projectId
                                    ? 'Once proje secin'
                                    : taskLoading
                                        ? 'Tasklar yukleniyor...'
                                        : taskError
                                            ? 'Tasklar alinamadi'
                                            : tasks.length === 0
                                                ? 'Task bulunamadi'
                                                : 'Task secin (opsiyonel)'}
                            </option>
                            {tasks.map((task) => (
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
                <div className="mb-3 flex flex-col items-start justify-between gap-3 min-[900px]:flex-row min-[900px]:items-center">
                    <div>
                        <h3 className="m-0 text-lg text-gray-900">Kayit gecmisi</h3>
                        <p className="mt-0.5 mb-0 text-xs text-gray-500">Durum ve sure detaylari</p>
                    </div>

                    <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-[7px] text-[13px] min-[900px]:w-auto"
                        value={statusFilter}
                        onChange={(event) => onStatusFilterChange(event.target.value)}
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
                            <th onClick={() => onSort('projectName')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                                <div className="flex items-center gap-1">Proje <SortIcon field="projectName" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                            </th>
                            <th onClick={() => onSort('description')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                                <div className="flex items-center gap-1">Aciklama <SortIcon field="description" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                            </th>
                            <th onClick={() => onSort('startedAt')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                                <div className="flex items-center gap-1">Baslangic <SortIcon field="startedAt" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                            </th>
                            <th onClick={() => onSort('stoppedAt')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                                <div className="flex items-center gap-1">Bitis <SortIcon field="stoppedAt" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                            </th>
                            <th onClick={() => onSort('duration')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                                <div className="flex items-center gap-1">Sure <SortIcon field="duration" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                            </th>
                            <th onClick={() => onSort('status')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                                <div className="flex items-center gap-1">Durum <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                            </th>
                            <th className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                Islem
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {historyLoading && (
                            <tr>
                                <td colSpan={7} className="px-3 py-[26px] text-center text-gray-400">Kayitlar yukleniyor...</td>
                            </tr>
                        )}

                        {historyError && (
                            <tr>
                                <td colSpan={7} className="px-3 py-[26px] text-center text-red-600">Kayitlar alinirken bir hata olustu.</td>
                            </tr>
                        )}

                        {!historyLoading && !historyError && filteredAndSortedHistoryRows.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-3 py-[26px] text-center text-gray-400">Filtreye uygun kayit bulunamadi.</td>
                            </tr>
                        )}

                        {filteredAndSortedHistoryRows.map((row) => (
                            <tr key={row.id}>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{resolveProjectName(row)}</td>
                                <td className="max-w-[320px] border-b border-gray-100 px-3 py-[11px] align-top text-gray-600">{row.description || '-'}</td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{formatDate(row.startedAt)}</td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{row.stoppedAt ? formatDate(row.stoppedAt) : '-'}</td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{formatDuration(getEntryDurationSeconds(row))}</td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top">
                                    <span className={`inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold ${getStatusChipClass(row.status)}`}>
                                        {getStatusLabel(row.status)}
                                    </span>
                                </td>
                                <td className="border-b border-gray-100 px-3 py-[11px] align-top">
                                    <button
                                        type="button"
                                        onClick={() => onDeleteHistoryRow(row.id)}
                                        disabled={deletePending || row.status === 'ACTIVE'}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Trash2 size={12} />
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {historyLoading && (
                    <p className="px-3 py-[26px] text-center text-sm text-gray-400 md:hidden">Kayitlar yukleniyor...</p>
                )}

                {historyError && (
                    <p className="px-3 py-[26px] text-center text-sm text-red-600 md:hidden">Kayitlar alinirken bir hata olustu.</p>
                )}

                {!historyLoading && !historyError && filteredAndSortedHistoryRows.length === 0 && (
                    <p className="px-3 py-[26px] text-center text-sm text-gray-400 md:hidden">Filtreye uygun kayit bulunamadi.</p>
                )}

                <div className="space-y-3 md:hidden">
                    {!historyLoading && !historyError && filteredAndSortedHistoryRows.map((row) => (
                        <article key={row.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="m-0 text-sm font-semibold text-gray-900">{resolveProjectName(row)}</p>
                                <span className={`inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold ${getStatusChipClass(row.status)}`}>
                                    {getStatusLabel(row.status)}
                                </span>
                            </div>
                            <p className="m-0 mb-2 text-xs text-gray-600">{row.description || '-'}</p>
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
                                    <p className="m-0 font-medium text-gray-900">{formatDuration(getEntryDurationSeconds(row))}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onDeleteHistoryRow(row.id)}
                                disabled={deletePending || row.status === 'ACTIVE'}
                                className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 size={12} />
                                Kaydi Sil
                            </button>
                        </article>
                    ))}
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={onPageChange}
                    onLimitChange={onLimitChange}
                    limitOptions={limitOptions}
                />
            </section>
        </>
    );
}
