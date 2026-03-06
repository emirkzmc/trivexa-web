import { Pagination } from '../../../../shared/components/Pagination';
import { formatDate } from '../../../../shared/utils/formatDate';
import { formatDuration } from '../../../../shared/utils/formatDuration';
import type { TimerEntry } from '../../api/timeTracker.api';
import { SortIcon } from '../SortIcon';
import type { TeamSortField } from '../timeTracker.types';
import { getEntryDurationSeconds, getStatusChipClass, getStatusLabel } from '../../utils/timeTracker.utils';

interface TeamTabProps {
    filteredTeamRows: TimerEntry[];
    total: number;
    userFilter: string;
    statusFilter: string;
    users: Array<{ id: string; name: string }>;
    onUserFilterChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    sortField: TeamSortField;
    sortDirection: 'asc' | 'desc';
    onSort: (field: TeamSortField) => void;
    loading: boolean;
    error: boolean;
    sortedRows: TimerEntry[];
    resolveProjectName: (row: TimerEntry) => string;
    getDisplayUserName: (row: TimerEntry) => string;
    page: number;
    totalPages: number;
    limit: number;
    onPageChange: (value: number) => void;
    onLimitChange: (value: number) => void;
    limitOptions: number[];
}

export function TeamTab({
    filteredTeamRows,
    total,
    userFilter,
    statusFilter,
    users,
    onUserFilterChange,
    onStatusFilterChange,
    sortField,
    sortDirection,
    onSort,
    loading,
    error,
    sortedRows,
    resolveProjectName,
    getDisplayUserName,
    page,
    totalPages,
    limit,
    onPageChange,
    onLimitChange,
    limitOptions,
}: TeamTabProps) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
            <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Sayfadaki toplam sure</p>
                    <strong className="text-base text-gray-900">
                        {formatDuration(filteredTeamRows.reduce((sum, row) => sum + getEntryDurationSeconds(row), 0))}
                    </strong>
                </div>
                <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Toplam kayit</p>
                    <strong className="text-base text-gray-900">{total}</strong>
                </div>
                <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Gorunen calisan</p>
                    <strong className="text-base text-gray-900">{new Set(filteredTeamRows.map((row) => row.userId).filter(Boolean)).size}</strong>
                </div>
            </section>

            <div className="mb-3 flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
                <div>
                    <h3 className="m-0 text-lg text-gray-900">Takim hareketleri</h3>
                    <p className="mt-0.5 mb-0 text-xs text-gray-500">Kimin ne kadar sure hangi islemde calistigini izleyin</p>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 min-[900px]:w-auto min-[900px]:grid-cols-2">
                    <select
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-[7px] text-[13px]"
                        value={userFilter}
                        onChange={(event) => onUserFilterChange(event.target.value)}
                    >
                        <option value="">Tum calisanlar</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-[7px] text-[13px]"
                        value={statusFilter}
                        onChange={(event) => onStatusFilterChange(event.target.value)}
                    >
                        <option value="">Tum durumlar</option>
                        <option value="ACTIVE">Calisiyor</option>
                        <option value="STOPPED">Tamamlandi</option>
                        <option value="CANCELLED">Iptal</option>
                    </select>
                </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-[13px]">
                    <thead>
                    <tr>
                        <th onClick={() => onSort('userName')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Calisan <SortIcon field="userName" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th onClick={() => onSort('projectName')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Proje <SortIcon field="projectName" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th onClick={() => onSort('taskTitle')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Task <SortIcon field="taskTitle" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
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
                    </tr>
                    </thead>
                    <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={8} className="px-3 py-[26px] text-center text-gray-400">Takim kayitlari yukleniyor...</td>
                        </tr>
                    )}

                    {error && (
                        <tr>
                            <td colSpan={8} className="px-3 py-[26px] text-center text-red-600">Takim kayitlari alinirken hata olustu.</td>
                        </tr>
                    )}

                    {!loading && !error && sortedRows.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-3 py-[26px] text-center text-gray-400">Filtreye uygun kayit bulunamadi.</td>
                        </tr>
                    )}

                    {sortedRows.map((row) => (
                        <tr key={row.id}>
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{getDisplayUserName(row)}</td>
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{resolveProjectName(row)}</td>
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-700">{row.taskTitle || '-'}</td>
                            <td className="max-w-[280px] border-b border-gray-100 px-3 py-[11px] align-top text-gray-600">{row.description || '-'}</td>
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{formatDate(row.startedAt)}</td>
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{row.stoppedAt ? formatDate(row.stoppedAt) : '-'}</td>
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{formatDuration(getEntryDurationSeconds(row))}</td>
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top">
                                <span className={`inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold ${getStatusChipClass(row.status)}`}>
                                    {getStatusLabel(row.status)}
                                </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-3 md:hidden">
                {!loading && !error && sortedRows.map((row) => (
                    <article key={row.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="m-0 text-sm font-semibold text-gray-900">{getDisplayUserName(row)}</p>
                            <span className={`inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold ${getStatusChipClass(row.status)}`}>
                                {getStatusLabel(row.status)}
                            </span>
                        </div>
                        <p className="m-0 text-xs text-gray-700">Proje: {resolveProjectName(row)}</p>
                        <p className="m-0 mt-1 text-xs text-gray-700">Task: {row.taskTitle || '-'}</p>
                        <p className="m-0 mt-1 text-xs text-gray-600">{row.description || '-'}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700">
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
    );
}
