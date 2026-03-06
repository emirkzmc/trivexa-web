import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import type { TimerEntry } from '../../api/timeTracker.api';
import type { DashboardTopProject, DashboardTopUser } from '../timeTracker.types';
import { formatDate } from '../../../../shared/utils/formatDate';
import { formatDuration } from '../../../../shared/utils/formatDuration';
import { formatClock, getEntryDurationSeconds, getStatusLabel } from '../../utils/timeTracker.utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type PeriodRow = {
    label: string;
    seconds: number;
    entries: number;
};

type PeriodType = 'daily' | 'weekly' | 'monthly';

type ProjectSummaryRow = {
    projectName: string;
    seconds: number;
    entries: number;
    activeEntries: number;
    lastStartedAt: string | null;
};

const CHART_OPTIONS: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (context) => `${Number(context.raw).toFixed(2)} saat`,
            },
        },
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

function getDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDayLabel(key: string): string {
    const [year, month, day] = key.split('-');
    return `${day}.${month}.${year.slice(2)}`;
}

function getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function getMonthLabel(key: string): string {
    const [year, month] = key.split('-');
    return `${month}.${year}`;
}

function getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(date);
    start.setDate(date.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
}

function getWeekKey(date: Date): string {
    return getDayKey(getWeekStart(date));
}

function getWeekLabel(key: string): string {
    return `Hafta ${getDayLabel(key)}`;
}

function aggregateByPeriod(
    rows: TimerEntry[],
    keys: string[],
    keyBuilder: (date: Date) => string,
): Record<string, PeriodRow> {
    const map: Record<string, PeriodRow> = {};

    keys.forEach((key) => {
        map[key] = { label: key, seconds: 0, entries: 0 };
    });

    rows.forEach((row) => {
        if (!row.startedAt) return;
        const date = new Date(row.startedAt);
        if (Number.isNaN(date.getTime())) return;

        const key = keyBuilder(date);
        if (!map[key]) return;
        map[key].seconds += getEntryDurationSeconds(row);
        map[key].entries += 1;
    });

    return map;
}

function buildDailyRows(rows: TimerEntry[]): PeriodRow[] {
    const dates: string[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(getDayKey(d));
    }

    const map = aggregateByPeriod(rows, dates, getDayKey);
    return dates.map((key) => ({ ...map[key], label: getDayLabel(key) }));
}

function buildWeeklyRows(rows: TimerEntry[]): PeriodRow[] {
    const weeks: string[] = [];
    const now = getWeekStart(new Date());

    for (let i = 7; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i * 7);
        weeks.push(getWeekKey(d));
    }

    const map = aggregateByPeriod(rows, weeks, getWeekKey);
    return weeks.map((key) => ({ ...map[key], label: getWeekLabel(key) }));
}

function buildMonthlyRows(rows: TimerEntry[]): PeriodRow[] {
    const months: string[] = [];
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);

    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        months.push(getMonthKey(d));
    }

    const map = aggregateByPeriod(rows, months, getMonthKey);
    return months.map((key) => ({ ...map[key], label: getMonthLabel(key) }));
}

function PeriodChartTable({
    title,
    subtitle,
    rows,
}: {
    title: string;
    subtitle: string;
    rows: PeriodRow[];
}) {
    const chartData = {
        labels: rows.map((row) => row.label),
        datasets: [
            {
                label: 'Saat',
                data: rows.map((row) => Number((row.seconds / 3600).toFixed(2))),
                backgroundColor: '#ef4444',
                borderRadius: 6,
            },
        ],
    };

    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="m-0 text-base text-gray-900">{title}</h3>
            <p className="mb-3 mt-1 text-xs text-gray-500">{subtitle}</p>

            <div className="mb-3 h-[220px]">
                <Bar data={chartData} options={CHART_OPTIONS} />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                    <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="px-2 py-2 font-semibold">Periyot</th>
                        <th className="px-2 py-2 font-semibold">Kayit</th>
                        <th className="px-2 py-2 font-semibold">Sure</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row) => (
                        <tr key={row.label} className="border-b border-gray-100">
                            <td className="px-2 py-2 text-gray-700">{row.label}</td>
                            <td className="px-2 py-2 text-gray-700">{row.entries}</td>
                            <td className="px-2 py-2 text-gray-900">{formatDuration(row.seconds)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </article>
    );
}

interface DashboardTabProps {
    hasTeamAccess: boolean;
    dashboardTrackedSeconds: number;
    dashboardActiveCount: number;
    dashboardCompletedCount: number;
    dashboardCancelledCount: number;
    dashboardUniqueUserCount: number;
    dashboardTopProjects: DashboardTopProject[];
    dashboardTopUsers: DashboardTopUser[];
    dashboardRows: TimerEntry[];
    resolveProjectName: (row: TimerEntry) => string;
    activeTimer?: TimerEntry | null;
    activeElapsedSeconds: number;
}

export function DashboardTab({
    hasTeamAccess,
    dashboardTrackedSeconds,
    dashboardActiveCount,
    dashboardCompletedCount,
    dashboardCancelledCount,
    dashboardUniqueUserCount,
    dashboardTopProjects,
    dashboardTopUsers,
    dashboardRows,
    resolveProjectName,
    activeTimer,
    activeElapsedSeconds,
}: DashboardTabProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('daily');

    const dailyRows = useMemo(() => buildDailyRows(dashboardRows), [dashboardRows]);
    const weeklyRows = useMemo(() => buildWeeklyRows(dashboardRows), [dashboardRows]);
    const monthlyRows = useMemo(() => buildMonthlyRows(dashboardRows), [dashboardRows]);

    const periodConfig = useMemo(() => {
        if (selectedPeriod === 'weekly') {
            return {
                title: 'Haftalik Analiz',
                subtitle: 'Son 8 hafta zaman dagilimi',
                rows: weeklyRows,
            };
        }

        if (selectedPeriod === 'monthly') {
            return {
                title: 'Aylik Analiz',
                subtitle: 'Son 6 ay zaman dagilimi',
                rows: monthlyRows,
            };
        }

        return {
            title: 'Gunluk Analiz',
            subtitle: 'Son 7 gun zaman dagilimi',
            rows: dailyRows,
        };
    }, [selectedPeriod, dailyRows, weeklyRows, monthlyRows]);

    const projectSummaryRows = useMemo(() => {
        const map = new Map<string, ProjectSummaryRow>();

        dashboardRows.forEach((row) => {
            const key = resolveProjectName(row);
            const existing = map.get(key);
            const seconds = getEntryDurationSeconds(row);
            const rowStartedAt = row.startedAt || null;
            const isActive = row.status === 'ACTIVE' ? 1 : 0;

            if (existing) {
                existing.seconds += seconds;
                existing.entries += 1;
                existing.activeEntries += isActive;
                if (rowStartedAt && (!existing.lastStartedAt || new Date(rowStartedAt).getTime() > new Date(existing.lastStartedAt).getTime())) {
                    existing.lastStartedAt = rowStartedAt;
                }
                return;
            }

            map.set(key, {
                projectName: key,
                seconds,
                entries: 1,
                activeEntries: isActive,
                lastStartedAt: rowStartedAt,
            });
        });

        return [...map.values()].sort((a, b) => b.seconds - a.seconds);
    }, [dashboardRows, resolveProjectName]);

    const recentTimerRows = useMemo(
        () =>
            [...dashboardRows]
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .slice(0, 8),
        [dashboardRows],
    );

    return (
        <>
            <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Izlenen toplam sure (son 100 kayit)</p>
                    <strong className="text-base text-gray-900">{formatDuration(dashboardTrackedSeconds)}</strong>
                </div>
                <div className="rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Aktif kayit</p>
                    <strong className="text-base text-gray-900">{dashboardActiveCount}</strong>
                </div>
                <div className="rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">Tamamlanan</p>
                    <strong className="text-base text-gray-900">{dashboardCompletedCount}</strong>
                </div>
                <div className="rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
                    <p className="m-0 mb-0.5 text-xs text-gray-500">
                        {hasTeamAccess ? 'Aktif calisan sayisi' : 'Iptal edilen'}
                    </p>
                    <strong className="text-base text-gray-900">
                        {hasTeamAccess ? dashboardUniqueUserCount : dashboardCancelledCount}
                    </strong>
                </div>
            </section>

            <section className="mb-4">
                <div className="mb-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedPeriod('daily')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            selectedPeriod === 'daily'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Gunluk
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedPeriod('weekly')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            selectedPeriod === 'weekly'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Haftalik
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedPeriod('monthly')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            selectedPeriod === 'monthly'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Aylik
                    </button>
                </div>

                <PeriodChartTable
                    title={periodConfig.title}
                    subtitle={periodConfig.subtitle}
                    rows={periodConfig.rows}
                />
            </section>

            <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="m-0 text-base text-gray-900">Projeye gore sure dagilimi</h3>
                    <p className="mb-3 mt-1 text-xs text-gray-500">En fazla zaman harcanan projeler</p>

                    {dashboardTopProjects.length === 0 ? (
                        <p className="text-sm text-gray-400">Kayit bulunamadi.</p>
                    ) : (
                        <div className="space-y-2">
                            {dashboardTopProjects.map((item) => (
                                <div key={item.projectName} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                    <span className="text-sm text-gray-700">{item.projectName}</span>
                                    <strong className="text-sm text-gray-900">{formatDuration(item.seconds)}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="m-0 text-base text-gray-900">
                        {hasTeamAccess ? 'Calisan bazli toplam sure' : 'Son kayitlar'}
                    </h3>
                    <p className="mb-3 mt-1 text-xs text-gray-500">
                        {hasTeamAccess ? 'Kim ne kadar zaman harcadi' : 'En guncel hareketler'}
                    </p>

                    {hasTeamAccess ? (
                        dashboardTopUsers.length === 0 ? (
                            <p className="text-sm text-gray-400">Kayit bulunamadi.</p>
                        ) : (
                            <div className="space-y-2">
                                {dashboardTopUsers.map((item, idx) => (
                                    <div key={`${item.name}-${idx}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                        <span className="text-sm text-gray-700">{item.name}</span>
                                        <div className="text-right">
                                            <strong className="block text-sm text-gray-900">{formatDuration(item.seconds)}</strong>
                                            <span className="text-xs text-gray-500">{item.entries} kayit</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="space-y-2">
                            {dashboardRows.slice(0, 8).map((row) => (
                                <div key={row.id} className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="m-0 text-sm font-medium text-gray-800">{resolveProjectName(row)}</p>
                                    <p className="m-0 mt-1 text-xs text-gray-600">{row.description || '-'}</p>
                                    <p className="m-0 mt-1 text-xs text-gray-500">
                                        {formatDuration(getEntryDurationSeconds(row))} - {getStatusLabel(row.status)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </section>

            <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="m-0 text-base text-gray-900">Proje bazli calisma ozeti</h3>
                    <p className="mb-3 mt-1 text-xs text-gray-500">Hangi projede ne kadar calisildigini detayli gorun</p>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                            <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500">
                                <th className="px-2 py-2 font-semibold">Proje</th>
                                <th className="px-2 py-2 font-semibold">Kayit</th>
                                <th className="px-2 py-2 font-semibold">Aktif</th>
                                <th className="px-2 py-2 font-semibold">Toplam Sure</th>
                                <th className="px-2 py-2 font-semibold">Son Islem</th>
                            </tr>
                            </thead>
                            <tbody>
                            {projectSummaryRows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-2 py-4 text-center text-gray-400">Proje bazli kayit bulunamadi.</td>
                                </tr>
                            )}
                            {projectSummaryRows.map((row) => (
                                <tr key={row.projectName} className="border-b border-gray-100">
                                    <td className="px-2 py-2 text-gray-700">{row.projectName}</td>
                                    <td className="px-2 py-2 text-gray-700">{row.entries}</td>
                                    <td className="px-2 py-2 text-gray-700">{row.activeEntries}</td>
                                    <td className="px-2 py-2 text-gray-900">{formatDuration(row.seconds)}</td>
                                    <td className="px-2 py-2 text-gray-700">{row.lastStartedAt ? formatDate(row.lastStartedAt) : '-'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="m-0 text-base text-gray-900">Timer detaylari</h3>
                    <p className="mb-3 mt-1 text-xs text-gray-500">Aktif timer ve son zaman kayit detaylari</p>

                    <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="m-0 text-xs text-gray-500">Aktif Timer</p>
                        {activeTimer ? (
                            <>
                                <p className="m-0 mt-1 text-sm font-semibold text-gray-900">{resolveProjectName(activeTimer)}</p>
                                <p className="m-0 mt-1 text-xs text-gray-600">{activeTimer.description || '-'}</p>
                                <p className="m-0 mt-1 text-xs text-gray-700">Baslangic: {formatDate(activeTimer.startedAt)}</p>
                                <p className="m-0 mt-1 text-sm font-bold text-red-600">{formatClock(activeElapsedSeconds)}</p>
                            </>
                        ) : (
                            <p className="m-0 mt-1 text-sm text-gray-400">Aktif timer bulunmuyor.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        {recentTimerRows.length === 0 && (
                            <p className="text-sm text-gray-400">Son kayit bulunamadi.</p>
                        )}
                        {recentTimerRows.map((row) => (
                            <div key={row.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="m-0 text-sm font-medium text-gray-800">{resolveProjectName(row)}</p>
                                    <span className="text-[11px] font-semibold text-gray-500">{getStatusLabel(row.status)}</span>
                                </div>
                                <p className="m-0 mt-1 text-xs text-gray-600">{row.description || '-'}</p>
                                <p className="m-0 mt-1 text-xs text-gray-500">
                                    {formatDate(row.startedAt)} - {row.stoppedAt ? formatDate(row.stoppedAt) : 'Devam ediyor'}
                                </p>
                                <p className="m-0 mt-1 text-xs font-semibold text-gray-800">{formatDuration(getEntryDurationSeconds(row))}</p>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

        </>
    );
}
