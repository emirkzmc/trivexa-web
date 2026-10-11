import { useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import { Pagination } from '../../../../shared/components/Pagination';
import { formatDate } from '../../../../shared/utils/formatDate';
import { formatDuration } from '../../../../shared/utils/formatDuration';
import type { TimerEntry } from '../../api/timeTracker.api';
import { SortIcon } from '../SortIcon';
import type { TeamSortField } from '../timeTracker.types';
import { getEntryDurationSeconds, getStatusChipClass, getStatusLabel } from '../../utils/timeTracker.utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface TeamTabProps {
    filteredTeamRows: TimerEntry[];
    total: number;
    userFilter: string;
    statusFilter: string;
    departmentFilter: string;
    users: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string }>;
    onUserFilterChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onDepartmentFilterChange: (value: string) => void;
    sortField: TeamSortField;
    sortDirection: 'asc' | 'desc';
    onSort: (field: TeamSortField) => void;
    loading: boolean;
    error: boolean;
    sortedRows: TimerEntry[];
    resolveProjectName: (row: TimerEntry) => string;
    resolveDepartmentName: (row: TimerEntry) => string;
    getDisplayUserName: (row: TimerEntry) => string;
    page: number;
    totalPages: number;
    limit: number;
    onPageChange: (value: number) => void;
    onLimitChange: (value: number) => void;
    limitOptions: number[];
}

type DepartmentSummaryRow = {
    department: string;
    seconds: number;
    entries: number;
    activeEntries: number;
    users: number;
};

type UserProjectSummaryRow = {
    projectName: string;
    seconds: number;
    entries: number;
};

const BAR_OPTIONS: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: (value) => `${value}s`,
            },
        },
    },
};

const DOUGHNUT_OPTIONS: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
        },
    },
};

function dayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function dayLabel(key: string): string {
    const [, month, day] = key.split('-');
    return `${day}.${month}`;
}

export function TeamTab({
    filteredTeamRows,
    total,
    userFilter,
    statusFilter,
    departmentFilter,
    users,
    departments,
    onUserFilterChange,
    onStatusFilterChange,
    onDepartmentFilterChange,
    sortField,
    sortDirection,
    onSort,
    loading,
    error,
    sortedRows,
    resolveProjectName,
    resolveDepartmentName,
    getDisplayUserName,
    page,
    totalPages,
    limit,
    onPageChange,
    onLimitChange,
    limitOptions,
}: TeamTabProps) {
    const departmentSummaryRows = useMemo(() => {
        const map = new Map<string, DepartmentSummaryRow & { userIds: Set<string> }>();

        sortedRows.forEach((row) => {
            const key = resolveDepartmentName(row);
            const existing = map.get(key);
            const seconds = getEntryDurationSeconds(row);
            const isActive = row.status === 'ACTIVE' ? 1 : 0;

            if (existing) {
                existing.seconds += seconds;
                existing.entries += 1;
                existing.activeEntries += isActive;
                if (row.userId) existing.userIds.add(row.userId);
                return;
            }

            map.set(key, {
                department: key,
                seconds,
                entries: 1,
                activeEntries: isActive,
                users: 1,
                userIds: new Set(row.userId ? [row.userId] : []),
            });
        });

        return [...map.values()]
            .map(({ userIds, ...row }) => ({
                ...row,
                users: userIds.size,
            }))
            .sort((a, b) => b.seconds - a.seconds);
    }, [sortedRows, resolveDepartmentName]);

    const selectedUserRows = useMemo(
        () => (userFilter ? sortedRows.filter((row) => row.userId === userFilter) : []),
        [sortedRows, userFilter],
    );

    const selectedUserName = useMemo(
        () => users.find((item) => item.id === userFilter)?.name ?? 'Seçili personel',
        [users, userFilter],
    );

    const selectedUserTotals = useMemo(() => {
        const totals = {
            seconds: 0,
            entries: selectedUserRows.length,
            active: 0,
            completed: 0,
            cancelled: 0,
            department: '-',
        };

        selectedUserRows.forEach((row, index) => {
            totals.seconds += getEntryDurationSeconds(row);
            if (row.status === 'ACTIVE') totals.active += 1;
            if (row.status === 'STOPPED') totals.completed += 1;
            if (row.status === 'CANCELLED') totals.cancelled += 1;
            if (index === 0) totals.department = resolveDepartmentName(row);
        });

        return totals;
    }, [selectedUserRows, resolveDepartmentName]);

    const selectedUserProjectRows = useMemo(() => {
        const map = new Map<string, UserProjectSummaryRow>();

        selectedUserRows.forEach((row) => {
            const key = resolveProjectName(row);
            const existing = map.get(key);
            const seconds = getEntryDurationSeconds(row);
            if (existing) {
                existing.seconds += seconds;
                existing.entries += 1;
                return;
            }

            map.set(key, {
                projectName: key,
                seconds,
                entries: 1,
            });
        });

        return [...map.values()].sort((a, b) => b.seconds - a.seconds);
    }, [selectedUserRows, resolveProjectName]);

    const selectedUserStatusData = useMemo(() => {
        const counts = { ACTIVE: 0, STOPPED: 0, CANCELLED: 0 };
        selectedUserRows.forEach((row) => {
            if (row.status in counts) {
                counts[row.status] += 1;
            }
        });
        return counts;
    }, [selectedUserRows]);

    const selectedUserDailyRows = useMemo(() => {
        const keys: string[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i -= 1) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            keys.push(dayKey(d));
        }

        const totals = new Map<string, number>();
        keys.forEach((key) => totals.set(key, 0));

        selectedUserRows.forEach((row) => {
            if (!row.startedAt) return;
            const date = new Date(row.startedAt);
            if (Number.isNaN(date.getTime())) return;
            const key = dayKey(date);
            if (!totals.has(key)) return;
            totals.set(key, (totals.get(key) ?? 0) + getEntryDurationSeconds(row));
        });

        return keys.map((key) => ({
            label: dayLabel(key),
            seconds: totals.get(key) ?? 0,
        }));
    }, [selectedUserRows]);

    const departmentChartData = useMemo(() => ({
        labels: departmentSummaryRows.map((row) => row.department),
        datasets: [
            {
                label: 'Saat',
                data: departmentSummaryRows.map((row) => Number((row.seconds / 3600).toFixed(2))),
                backgroundColor: '#2563EB',
                borderRadius: 6,
            },
        ],
    }), [departmentSummaryRows]);

    const selectedUserProjectChartData = useMemo(() => ({
        labels: selectedUserProjectRows.map((row) => row.projectName),
        datasets: [
            {
                label: 'Saat',
                data: selectedUserProjectRows.map((row) => Number((row.seconds / 3600).toFixed(2))),
                backgroundColor: '#0EA5E9',
                borderRadius: 6,
            },
        ],
    }), [selectedUserProjectRows]);

    const selectedUserStatusChartData = useMemo(() => ({
        labels: ['Calisiyor', 'Tamamlandi', 'Iptal'],
        datasets: [
            {
                data: [
                    selectedUserStatusData.ACTIVE,
                    selectedUserStatusData.STOPPED,
                    selectedUserStatusData.CANCELLED,
                ],
                backgroundColor: ['#DC2626', '#16A34A', '#6B7280'],
                borderWidth: 0,
            },
        ],
    }), [selectedUserStatusData]);

    const selectedUserDailyChartData = useMemo(() => ({
        labels: selectedUserDailyRows.map((row) => row.label),
        datasets: [
            {
                label: 'Saat',
                data: selectedUserDailyRows.map((row) => Number((row.seconds / 3600).toFixed(2))),
                backgroundColor: '#7C3AED',
                borderRadius: 6,
            },
        ],
    }), [selectedUserDailyRows]);

    const selectedUserRecentRows = useMemo(
        () =>
            [...selectedUserRows]
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .slice(0, 5),
        [selectedUserRows],
    );

    const handleSelectUser = (nextUserId: string) => {
        onUserFilterChange(userFilter === nextUserId ? '' : nextUserId);
    };

    const hasActiveFilters = Boolean(userFilter || departmentFilter || statusFilter);

    const handleClearFilters = () => {
        onUserFilterChange('');
        onDepartmentFilterChange('');
        onStatusFilterChange('');
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
            <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Sayfadaki toplam süre</p>
                    <strong className="text-base text-gray-900">
                        {formatDuration(filteredTeamRows.reduce((sum, row) => sum + getEntryDurationSeconds(row), 0))}
                    </strong>
                </div>
                <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Toplam kayıt</p>
                    <strong className="text-base text-gray-900">{total}</strong>
                </div>
                <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Görünen calisan</p>
                    <strong className="text-base text-gray-900">{new Set(filteredTeamRows.map((row) => row.userId).filter(Boolean)).size}</strong>
                </div>
                <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Departman</p>
                    <strong className="text-base text-gray-900">{departmentSummaryRows.length}</strong>
                </div>
            </section>

            <div className="mb-4 flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
                <div>
                    <h3 className="m-0 text-lg text-gray-900">Takim hareketleri</h3>
                    <p className="mt-0.5 mb-0 text-xs text-gray-500">Departman, personel ve takip detaylarini grafiklerle inceleyin</p>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 min-[900px]:w-auto min-[900px]:grid-cols-4">
                    <select
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-[7px] text-[13px]"
                        value={userFilter}
                        onChange={(event) => onUserFilterChange(event.target.value)}
                    >
                        <option value="">Tüm calisanlar</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-[7px] text-[13px]"
                        value={departmentFilter}
                        onChange={(event) => onDepartmentFilterChange(event.target.value)}
                    >
                        <option value="">Tüm departmanlar</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-[7px] text-[13px]"
                        value={statusFilter}
                        onChange={(event) => onStatusFilterChange(event.target.value)}
                    >
                        <option value="">Tüm durumlar</option>
                        <option value="ACTIVE">Calisiyor</option>
                        <option value="STOPPED">Tamamlandi</option>
                        <option value="CANCELLED">Iptal</option>
                    </select>

                    <button
                        type="button"
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                        className={`rounded-lg border px-2.5 py-[7px] text-[13px] transition ${
                            hasActiveFilters
                                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                        }`}
                    >
                        Filtreyi temizle
                    </button>
                </div>
            </div>

            <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <h4 className="m-0 text-base text-gray-900">Departman Bazli Süre Dagilimi</h4>
                    <p className="mb-3 mt-1 text-xs text-gray-500">Hangi departmanin ne kadar takip kaydı oldugunu gorun</p>

                    <div className="mb-3 h-[230px]">
                        <Bar data={departmentChartData} options={BAR_OPTIONS} />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                            <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500">
                                <th className="px-2 py-2 font-semibold">Departman</th>
                                <th className="px-2 py-2 font-semibold">Calisan</th>
                                <th className="px-2 py-2 font-semibold">Kayit</th>
                                <th className="px-2 py-2 font-semibold">Süre</th>
                            </tr>
                            </thead>
                            <tbody>
                            {departmentSummaryRows.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-2 py-3 text-center text-gray-400">Departman verisi bulunamadı.</td>
                                </tr>
                            )}
                            {departmentSummaryRows.map((row) => (
                                <tr key={row.department} className="border-b border-gray-100">
                                    <td className="px-2 py-2 text-gray-700">{row.department}</td>
                                    <td className="px-2 py-2 text-gray-700">{row.users}</td>
                                    <td className="px-2 py-2 text-gray-700">{row.entries}</td>
                                    <td className="px-2 py-2 text-gray-900">{formatDuration(row.seconds)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <h4 className="m-0 text-base text-gray-900">Personel Proje Dagilimi</h4>
                    <p className="mb-3 mt-1 text-xs text-gray-500">
                        {userFilter ? `${selectedUserName} icin proje bazli dagilim` : 'Detay grafikler icin personel secin'}
                    </p>

                    {userFilter ? (
                        <>
                            <div className="mb-3 h-[230px]">
                                <Bar data={selectedUserProjectChartData} options={BAR_OPTIONS} />
                            </div>
                            <div className="space-y-2">
                                {selectedUserProjectRows.length === 0 ? (
                                    <p className="text-sm text-gray-400">Seçili personel icin kayıt bulunamadı.</p>
                                ) : (
                                    selectedUserProjectRows.map((row) => (
                                        <div key={row.projectName} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                            <span className="text-sm text-gray-700">{row.projectName}</span>
                                            <span className="text-sm font-semibold text-gray-900">{formatDuration(row.seconds)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-[230px] items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
                            Grafikleri gorebilmek icin once personel seciniz.
                        </div>
                    )}
                </article>
            </section>

            {userFilter && (
                <section className="mb-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h4 className="m-0 text-base text-gray-900">Personel detay grafikleri</h4>
                            <p className="m-0 mt-0.5 text-xs text-gray-500">{selectedUserName} icin durum ve gunluk trend grafikleri</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onUserFilterChange('')}
                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                            Secimi temizle
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <article className="rounded-xl border border-gray-200 bg-white p-4">
                        <h4 className="m-0 text-base text-gray-900">Personel Durum Dagilimi</h4>
                        <p className="mb-3 mt-1 text-xs text-gray-500">{selectedUserName} icin durum bazli takip dagilimi</p>
                        <div className="h-[260px]">
                            <Doughnut data={selectedUserStatusChartData} options={DOUGHNUT_OPTIONS} />
                        </div>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white p-4">
                        <h4 className="m-0 text-base text-gray-900">Personel Gunluk Trend</h4>
                        <p className="mb-3 mt-1 text-xs text-gray-500">Son 7 gunde gunluk çalışma suresi</p>
                        <div className="mb-3 h-[220px]">
                            <Bar data={selectedUserDailyChartData} options={BAR_OPTIONS} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {selectedUserDailyRows.map((row) => (
                                <div key={row.label} className="rounded-md bg-gray-50 px-2 py-1.5">
                                    <p className="m-0 text-gray-500">{row.label}</p>
                                    <p className="m-0 font-semibold text-gray-900">{formatDuration(row.seconds)}</p>
                                </div>
                            ))}
                        </div>
                    </article>
                    </div>
                </section>
            )}

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-[13px]">
                    <thead>
                    <tr>
                        <th onClick={() => onSort('userName')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Calisan <SortIcon field="userName" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Departman</th>
                        <th onClick={() => onSort('projectName')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Proje <SortIcon field="projectName" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th onClick={() => onSort('taskTitle')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Task <SortIcon field="taskTitle" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th onClick={() => onSort('description')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Açıklama <SortIcon field="description" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th onClick={() => onSort('startedAt')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Baslangic <SortIcon field="startedAt" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th onClick={() => onSort('stoppedAt')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Bitis <SortIcon field="stoppedAt" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th onClick={() => onSort('duration')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Süre <SortIcon field="duration" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                        <th onClick={() => onSort('status')} className="border-b border-gray-200 bg-gray-50 px-3 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 cursor-pointer group hover:bg-gray-100 transition">
                            <div className="flex items-center gap-1">Durum <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection}/></div>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={9} className="px-3 py-[26px] text-center text-gray-400">Takim kayıtları yükleniyor...</td>
                        </tr>
                    )}

                    {error && (
                        <tr>
                            <td colSpan={9} className="px-3 py-[26px] text-center text-red-600">Takim kayıtları alinirken hata olustu.</td>
                        </tr>
                    )}

                    {!loading && !error && sortedRows.length === 0 && (
                        <tr>
                            <td colSpan={9} className="px-3 py-[26px] text-center text-gray-400">Filtreye uygun kayıt bulunamadı.</td>
                        </tr>
                    )}

                    {sortedRows.map((row) => (
                        <tr
                            key={row.id}
                            onClick={() => handleSelectUser(row.userId)}
                            className={`cursor-pointer transition hover:bg-sky-50 ${userFilter === row.userId ? 'bg-sky-50' : ''}`}
                        >
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-800">{getDisplayUserName(row)}</td>
                            <td className="border-b border-gray-100 px-3 py-[11px] align-top text-gray-700">{resolveDepartmentName(row)}</td>
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
                    <article
                        key={row.id}
                        onClick={() => handleSelectUser(row.userId)}
                        className={`cursor-pointer rounded-lg border p-3 transition ${userFilter === row.userId ? 'border-sky-300 bg-sky-50' : 'border-gray-200 bg-gray-50 hover:border-sky-200 hover:bg-sky-50'}`}
                    >
                        <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="m-0 text-sm font-semibold text-gray-900">{getDisplayUserName(row)}</p>
                            <span className={`inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold ${getStatusChipClass(row.status)}`}>
                                {getStatusLabel(row.status)}
                            </span>
                        </div>
                        <p className="m-0 text-xs text-gray-700">Departman: {resolveDepartmentName(row)}</p>
                        <p className="m-0 mt-1 text-xs text-gray-700">Proje: {resolveProjectName(row)}</p>
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
                                <p className="m-0 text-[11px] text-gray-500">Süre</p>
                                <p className="m-0 font-medium text-gray-900">{formatDuration(getEntryDurationSeconds(row))}</p>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {userFilter && (
                <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h4 className="m-0 text-base text-gray-900">{selectedUserName} detaylari</h4>
                            <p className="m-0 mt-0.5 text-xs text-gray-500">Alt listeden secilen personele ait ozet ve son kayıtlar</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onUserFilterChange('')}
                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                            Secimi temizle
                        </button>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="m-0 text-[11px] text-gray-500">Departman</p>
                            <p className="m-0 mt-1 text-sm font-semibold text-gray-900">{selectedUserTotals.department}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="m-0 text-[11px] text-gray-500">Toplam süre</p>
                            <p className="m-0 mt-1 text-sm font-semibold text-gray-900">{formatDuration(selectedUserTotals.seconds)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="m-0 text-[11px] text-gray-500">Toplam kayıt</p>
                            <p className="m-0 mt-1 text-sm font-semibold text-gray-900">{selectedUserTotals.entries}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="m-0 text-[11px] text-gray-500">Calisiyor</p>
                            <p className="m-0 mt-1 text-sm font-semibold text-red-600">{selectedUserTotals.active}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="m-0 text-[11px] text-gray-500">Tamamlandi</p>
                            <p className="m-0 mt-1 text-sm font-semibold text-emerald-600">{selectedUserTotals.completed}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="m-0 text-[11px] text-gray-500">Iptal</p>
                            <p className="m-0 mt-1 text-sm font-semibold text-gray-700">{selectedUserTotals.cancelled}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <article className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <h5 className="m-0 text-sm text-gray-900">Durum grafigi</h5>
                            <p className="m-0 mt-0.5 text-xs text-gray-500">Secilen personele ait durum dagilimi</p>
                            <div className="mt-2 h-[220px]">
                                <Doughnut data={selectedUserStatusChartData} options={DOUGHNUT_OPTIONS} />
                            </div>
                        </article>
                        <article className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <h5 className="m-0 text-sm text-gray-900">Son kayıtlar</h5>
                            <p className="m-0 mt-0.5 text-xs text-gray-500">Baslangic tarihine göre son 5 kayıt</p>
                            <div className="mt-2 space-y-2">
                                {selectedUserRecentRows.length === 0 && (
                                    <p className="text-xs text-gray-400">Seçili personel icin kayıt bulunamadı.</p>
                                )}
                                {selectedUserRecentRows.map((row) => (
                                    <div key={row.id} className="rounded-md border border-gray-200 bg-white px-2.5 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="m-0 text-xs font-semibold text-gray-900">{resolveProjectName(row)}</p>
                                            <span className={`inline-flex items-center rounded-full px-[8px] py-0.5 text-[10px] font-bold ${getStatusChipClass(row.status)}`}>
                                                {getStatusLabel(row.status)}
                                            </span>
                                        </div>
                                        <p className="m-0 mt-1 text-[11px] text-gray-600">{row.taskTitle || '-'}</p>
                                        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                                            <span>{formatDate(row.startedAt)}</span>
                                            <span className="font-semibold text-gray-800">{formatDuration(getEntryDurationSeconds(row))}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </div>
                </section>
            )}

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
