import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Filter, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAuthStore } from '../../auth/store/authStore';
import {
    getPerformanceRecords,
    upsertPerformanceRecord,
} from '../api/performance.api';
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

const MANAGER_ROLES = new Set<string>(['ADMIN', 'MANAGER', 'CEO', 'HR']);

type PersonAgg = {
    userId: string;
    name: string;
    email?: string;
    totalSeconds: number;
    entries: number;
    lastEntryAt?: string;
};

type ProjectAgg = {
    projectId: string;
    name: string;
    totalSeconds: number;
    entries: number;
};

export function PerformancePage() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const canFilterUser = MANAGER_ROLES.has(String(user?.role ?? '').toUpperCase());
    const canManageScore = canFilterUser;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [startDate, setStartDate] = useState(() => toDateInputValue(monthStart));
    const [endDate, setEndDate] = useState(() => toDateInputValue(now));
    const [projectId, setProjectId] = useState('');
    const [userId, setUserId] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(100);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<PersonAgg | null>(null);
    const [scoreInput, setScoreInput] = useState('0');
    const [bonusInput, setBonusInput] = useState('0');
    const [notesInput, setNotesInput] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const projectQuery = useQuery({
        queryKey: ['projects', 'performance'],
        queryFn: () => getProjects({ page: 1, limit: 200 }),
        enabled: Boolean(token),
        staleTime: 60_000,
    });

    const personnelQuery = useQuery({
        queryKey: ['personnel', 'performance'],
        queryFn: () => getPersonnel({ page: 1, limit: 200, isActive: 'true' }),
        enabled: canFilterUser && Boolean(token),
        staleTime: 60_000,
    });

    const historyQuery = useQuery({
        queryKey: ['time-entries', 'performance', page, limit, startDate, endDate, projectId, userId],
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

    const performanceQuery = useQuery({
        queryKey: ['performance', startDate, endDate],
        queryFn: () => getPerformanceRecords({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        }),
        enabled: Boolean(startDate && endDate && token),
        staleTime: 30_000,
    });

    const upsertMutation = useMutation({
        mutationFn: upsertPerformanceRecord,
        onSuccess: async () => {
            toast.success('Performans kaydi guncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['performance'] });
        },
        onError: () => {
            toast.error('Performans kaydi kaydedilemedi.');
        },
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
    const averageSeconds = uniqueUsers > 0 ? Math.floor(totalSeconds / uniqueUsers) : 0;

    const performanceRecords = Array.isArray(performanceQuery.data) ? performanceQuery.data : [];
    const performanceByUserId = useMemo(() => {
        return new Map(performanceRecords.map((record) => [record.userId, record]));
    }, [performanceRecords]);
    const totalBonus = performanceRecords.reduce((sum, record) => sum + (record.bonusAmount || 0), 0);

    const perPerson = useMemo(() => {
        const byUser = new Map<string, PersonAgg>();
        filteredRows.forEach((entry) => {
            const key = entry.userId || 'unknown';
            const existing = byUser.get(key);
            const duration = getEntryDurationSeconds(entry);
            const name = getDisplayUserName(entry);
            const payload: PersonAgg = existing ?? {
                userId: key,
                name,
                email: entry.userEmail ?? undefined,
                totalSeconds: 0,
                entries: 0,
            };
            payload.totalSeconds += duration;
            payload.entries += 1;
            if (!payload.lastEntryAt || new Date(entry.startedAt) > new Date(payload.lastEntryAt)) {
                payload.lastEntryAt = entry.startedAt;
            }
            byUser.set(key, payload);
        });
        return Array.from(byUser.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
    }, [filteredRows]);

    const perProject = useMemo(() => {
        const byProject = new Map<string, ProjectAgg>();
        filteredRows.forEach((entry) => {
            const key = entry.projectId || 'unknown';
            const existing = byProject.get(key);
            const duration = getEntryDurationSeconds(entry);
            const name = formatProjectName(entry);
            const payload: ProjectAgg = existing ?? {
                projectId: key,
                name,
                totalSeconds: 0,
                entries: 0,
            };
            payload.totalSeconds += duration;
            payload.entries += 1;
            byProject.set(key, payload);
        });
        return Array.from(byProject.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
    }, [filteredRows]);

    const totalPages = Math.max(1, Math.ceil((historyQuery.data?.total ?? filteredRows.length) / limit));

    function openScoreModal(userRow: PersonAgg) {
        const existing = performanceByUserId.get(userRow.userId);
        setSelectedUser(userRow);
        setScoreInput(existing ? String(existing.score) : '0');
        setBonusInput(existing ? String(existing.bonusAmount) : '0');
        setNotesInput(existing?.notes ?? '');
        setFormError(null);
        setIsModalOpen(true);
    }

    async function handleSaveScore() {
        if (!selectedUser) return;
        setFormError(null);
        const parsedScore = Number(scoreInput);
        const parsedBonus = Number(bonusInput);
        if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100) {
            setFormError('Puan 0-100 araliginda olmalidir.');
            return;
        }
        if (!Number.isFinite(parsedBonus) || parsedBonus < 0) {
            setFormError('Ek prim negatif olamaz.');
            return;
        }
        if (!startDate || !endDate) {
            setFormError('Tarih araligi zorunludur.');
            return;
        }

        try {
            await upsertMutation.mutateAsync({
                userId: selectedUser.userId,
                periodStart: startDate,
                periodEnd: endDate,
                score: parsedScore,
                bonusAmount: parsedBonus,
                notes: notesInput.trim() || undefined,
            });
            setIsModalOpen(false);
        } catch {
            // toast handled in mutation
        }
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<BarChart3 size={20} color="var(--role-accent-600)" />}
                title="Performans"
                subtitle="Time tracker kayitlari uzerinden performans gorunumu."
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Sure</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatClock(totalSeconds)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ortalama (Kisi)</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatClock(averageSeconds)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Aktif Kayit</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{activeCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Personel</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{uniqueUsers}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Ek Prim</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{totalBonus.toLocaleString('tr-TR')}</p>
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

            <section className="mb-4 grid gap-3 lg:grid-cols-2">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Users size={16} />
                        Personel Performansi
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">Personel</th>
                                    <th className="px-3 py-2">Sure</th>
                                    <th className="px-3 py-2">Kayit</th>
                                    <th className="px-3 py-2">Son</th>
                                    <th className="px-3 py-2">Puan</th>
                                    <th className="px-3 py-2">Ek Prim</th>
                                    {canManageScore && <th className="px-3 py-2">Islem</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {perPerson.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                                            Kayit bulunamadi.
                                        </td>
                                    </tr>
                                ) : (
                                    perPerson.slice(0, 10).map((row) => (
                                        (() => {
                                            const review = performanceByUserId.get(row.userId);
                                            return (
                                        <tr key={row.userId}>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">{row.name}</span>
                                                    <span className="text-xs text-gray-500">{row.email || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">{formatClock(row.totalSeconds)}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.entries}</td>
                                            <td className="px-3 py-2 text-gray-600">{formatDateTime(row.lastEntryAt)}</td>
                                            <td className="px-3 py-2 text-gray-600">{review ? review.score : '-'}</td>
                                            <td className="px-3 py-2 text-gray-600">
                                                {review ? review.bonusAmount.toLocaleString('tr-TR') : '-'}
                                            </td>
                                            {canManageScore && (
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openScoreModal(row)}
                                                        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                                    >
                                                        {review ? 'Guncelle' : 'Puanla'}
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                            );
                                        })()
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <BarChart3 size={16} />
                        Proje Performansi
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">Proje</th>
                                    <th className="px-3 py-2">Sure</th>
                                    <th className="px-3 py-2">Kayit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {perProject.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                                            Kayit bulunamadi.
                                        </td>
                                    </tr>
                                ) : (
                                    perProject.slice(0, 10).map((row) => (
                                        <tr key={row.projectId}>
                                            <td className="px-3 py-2 font-semibold text-gray-900">{row.name}</td>
                                            <td className="px-3 py-2 text-gray-600">{formatClock(row.totalSeconds)}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.entries}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>
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
                                        Gosterilecek performans kaydi bulunamadi.
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

            {canManageScore && isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" aria-label="Modali kapat" className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />

                    <section className="relative z-10 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Performans Puanla</h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                                X
                            </button>
                        </div>

                        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                            <p className="m-0 font-semibold text-gray-900">{selectedUser.name}</p>
                            <p className="m-0 text-xs text-gray-500">{selectedUser.email || '-'}</p>
                            <p className="m-0 mt-2 text-xs text-gray-500">
                                Donem: {startDate} - {endDate}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="flex flex-col gap-2 text-xs font-semibold text-gray-600">
                                Puan (0-100)
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={scoreInput}
                                    onChange={(event) => setScoreInput(event.target.value)}
                                    className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-xs font-semibold text-gray-600">
                                Ek Prim
                                <input
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={bonusInput}
                                    onChange={(event) => setBonusInput(event.target.value)}
                                    className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </label>
                        </div>

                        <label className="mt-3 flex flex-col gap-2 text-xs font-semibold text-gray-600">
                            Notlar
                            <textarea
                                value={notesInput}
                                onChange={(event) => setNotesInput(event.target.value)}
                                placeholder="Performans notu (opsiyonel)"
                                className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </label>

                        {formError && (
                            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {formError}
                            </p>
                        )}

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="h-9 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Vazgec
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSaveScore()}
                                disabled={upsertMutation.isPending}
                                className="inline-flex h-9 items-center gap-1 rounded-lg bg-[color:var(--role-accent-600)] px-3 text-xs font-semibold text-white transition hover:bg-[color:var(--role-accent-700)]"
                            >
                                {upsertMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
