import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Filter, Search } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAuthStore } from '../../auth/store/authStore';
import { getProjects, type ProjectItem } from '../../projects/api/projects.api';
import { getPersonnel, type PersonnelItem } from '../../personnel/api/personnel.api';
import { getTimerHistory, type TimerEntry } from '../../time-tracker/api/timeTracker.api';
import {
    formatClock,
    getDisplayUserName,
    getEntryDurationSeconds,
    getStatusChipClass,
    getStatusLabel,
} from '../../time-tracker/utils/timeTracker.utils';

function toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function toStartIso(dateValue: string): string | undefined {
    if (!dateValue) return undefined;
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
}

function toEndIso(dateValue: string): string | undefined {
    if (!dateValue) return undefined;
    const date = new Date(`${dateValue}T23:59:59.999`);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
}

function formatDateTime(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatProjectName(entry: TimerEntry): string {
    return entry.projectName || entry.projectId || '-';
}

function formatTaskTitle(entry: TimerEntry): string {
    return entry.taskTitle || entry.taskId || '-';
}

const MANAGER_ROLES = new Set<string>(['ADMIN', 'MANAGER']);

export function WorkingHoursPage() {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const canFilterUser = MANAGER_ROLES.has(String(user?.role ?? '').toUpperCase());

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [startDate, setStartDate] = useState(() => toDateInputValue(monthStart));
    const [endDate, setEndDate] = useState(() => toDateInputValue(now));
    const [projectId, setProjectId] = useState('');
    const [userId, setUserId] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(50);

    const projectQuery = useQuery({
        queryKey: ['projects', 'working-hours'],
        queryFn: () => getProjects({ page: 1, limit: 200 }),
        enabled: Boolean(token),
        staleTime: 60_000,
    });

    const personnelQuery = useQuery({
        queryKey: ['personnel', 'working-hours'],
        queryFn: () => getPersonnel({ page: 1, limit: 200, isActive: 'true' }),
        enabled: canFilterUser && Boolean(token),
        staleTime: 60_000,
    });

    const historyQuery = useQuery({
        queryKey: ['time-entries', 'working-hours', page, limit, startDate, endDate, projectId, userId],
        queryFn: () => getTimerHistory({
            page,
            limit,
            projectId: projectId || undefined,
            userId: canFilterUser ? (userId || undefined) : undefined,
            startDate: startDate && endDate ? toStartIso(startDate) : undefined,
            endDate: startDate && endDate ? toEndIso(endDate) : undefined,
        }),
        enabled: Boolean(token),
        staleTime: 30_000,
    });

    const projectOptions = useMemo(() => {
        const rows = projectQuery.data?.data ?? [];
        return rows
            .map((item: ProjectItem) => ({ id: item.id, label: item.name || item.id }))
            .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    }, [projectQuery.data?.data]);

    const personnelOptions = useMemo(() => {
        const rows = personnelQuery.data?.data ?? [];
        return rows
            .map((item: PersonnelItem) => ({
                id: item.id,
                label: `${item.firstName} ${item.lastName}`.trim() || item.email,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    }, [personnelQuery.data?.data]);

    const rawRows = useMemo(() => historyQuery.data?.data || [], [historyQuery.data?.data]);
    const filteredRows = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return rawRows;
        return rawRows.filter((entry) => {
            const haystack = [
                getDisplayUserName(entry),
                entry.userEmail ?? '',
                formatProjectName(entry),
                formatTaskTitle(entry),
                entry.description ?? '',
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(needle);
        });
    }, [rawRows, search]);

    const totalSeconds = filteredRows.reduce((sum, entry) => sum + getEntryDurationSeconds(entry), 0);
    const uniqueUsers = new Set(filteredRows.map((entry) => entry.userId)).size;
    const activeCount = filteredRows.filter((entry) => entry.status === 'ACTIVE').length;

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todaySeconds = filteredRows.reduce((sum, entry) => {
        const startedAt = new Date(entry.startedAt);
        if (Number.isNaN(startedAt.getTime())) return sum;
        if (startedAt < todayStart || startedAt > todayEnd) return sum;
        return sum + getEntryDurationSeconds(entry);
    }, 0);

    const totalPages = Math.max(1, Math.ceil((historyQuery.data?.total ?? filteredRows.length) / limit));

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarDays size={20} color="var(--role-accent-600)" />}
                title="Calisma Sureleri"
                subtitle="Time tracker kayitlari uzerinden personel calisma surelerini takip edin."
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Sure</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatClock(totalSeconds)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Bugun</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatClock(todaySeconds)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Aktif Kayit</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{activeCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Personel</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{uniqueUsers}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="relative min-w-[240px] flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                            <Search size={14} />
                        </span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            type="text"
                            placeholder="Personel, proje, gorev veya aciklama ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </label>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500">
                        <Filter size={14} />
                        Filtreler
                    </div>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(event) => {
                            setStartDate(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 min-w-[150px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(event) => {
                            setEndDate(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 min-w-[150px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />

                    <select
                        value={projectId}
                        onChange={(event) => {
                            setProjectId(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 min-w-[200px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="">Tüm Projeler</option>
                        {projectOptions.map((project) => (
                            <option key={project.id} value={project.id}>{project.label}</option>
                        ))}
                    </select>

                    {canFilterUser && (
                        <select
                            value={userId}
                            onChange={(event) => {
                                setUserId(event.target.value);
                                setPage(1);
                            }}
                            className="h-9 min-w-[200px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">Tüm Personel</option>
                            {personnelOptions.map((person) => (
                                <option key={person.id} value={person.id}>{person.label}</option>
                            ))}
                        </select>
                    )}
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Personel</th>
                                <th className="px-4 py-3 font-semibold">Proje</th>
                                <th className="px-4 py-3 font-semibold">Gorev</th>
                                <th className="px-4 py-3 font-semibold">Baslangic</th>
                                <th className="px-4 py-3 font-semibold">Bitis</th>
                                <th className="px-4 py-3 font-semibold">Sure</th>
                                <th className="px-4 py-3 font-semibold">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {historyQuery.isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        Kayitlar yukleniyor...
                                    </td>
                                </tr>
                            ) : historyQuery.isError ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-rose-600">
                                        Kayitlar yuklenemedi.
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        Gosterilecek calisma kaydi bulunamadi.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{getDisplayUserName(entry)}</span>
                                                <span className="text-xs text-gray-500">{entry.userEmail || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{formatProjectName(entry)}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatTaskTitle(entry)}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatDateTime(entry.startedAt)}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatDateTime(entry.stoppedAt)}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatClock(getEntryDurationSeconds(entry))}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusChipClass(entry.status)}`}>
                                                {getStatusLabel(entry.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
                    <span>Toplam: {historyQuery.data?.total ?? filteredRows.length} kayit</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page <= 1}
                            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-600 disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                            Onceki
                        </button>
                        <span className="text-gray-600">Sayfa {page} / {totalPages}</span>
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page >= totalPages}
                            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-600 disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                            Sonraki
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
