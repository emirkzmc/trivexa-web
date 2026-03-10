import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Filter, Plus, Search, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAuthStore } from '../../auth/store/authStore';
import { getPersonnel } from '../../personnel/api/personnel.api';
import { ROLES } from '../../../shared/constants/roles';
import {
    createLeaveRequest,
    getLeaveRequests,
    updateLeaveStatus,
    type LeaveStatus,
    type LeaveType,
    type LeaveCreatePayload,
} from '../api/leave.api';

const STATUS_LABELS: Record<LeaveStatus, string> = {
    PENDING: 'Onay Bekliyor',
    APPROVED: 'Onaylandi',
    REJECTED: 'Reddedildi',
    CANCELLED: 'Iptal',
};

const STATUS_STYLES: Record<LeaveStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TYPE_LABELS: Record<LeaveType, string> = {
    YILLIK: 'Yillik Izin',
    MAZERET: 'Mazeret Izni',
    RAPOR: 'Raporlu',
    UCRETSIZ: 'Ucretsiz Izin',
    DIGER: 'Diger',
};

const MANAGER_ROLES = new Set<string>([
    ROLES.ADMIN,
    ROLES.CEO,
    ROLES.MANAGER,
    ROLES.HR,
]);

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(date);
}

function formatRange(start: string, end: string): string {
    if (!start || !end) return '-';
    return `${formatDate(start)} - ${formatDate(end)}`;
}

function toDateInputValue(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string): Date | null {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function diffDays(start: Date, end: Date): number {
    const ms = end.getTime() - start.getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function calcDurationDays(start: string, end: string): number {
    const startDate = parseDateOnly(start);
    const endDate = parseDateOnly(end);
    if (!startDate || !endDate) return 0;
    const days = diffDays(startDate, endDate);
    return days >= 0 ? days + 1 : 0;
}

function isLeaveManagerRole(role?: string): boolean {
    const normalized = String(role ?? '').toUpperCase();
    return MANAGER_ROLES.has(normalized);
}

export function LeaveManagementPage() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const canManageLeaves = isLeaveManagerRole(user?.role);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<LeaveStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<LeaveType | ''>('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createUserId, setCreateUserId] = useState('');
    const [createType, setCreateType] = useState<LeaveType>('YILLIK');
    const [createStartDate, setCreateStartDate] = useState(() => toDateInputValue(new Date()));
    const [createEndDate, setCreateEndDate] = useState(() => toDateInputValue(new Date()));
    const [createReason, setCreateReason] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const leaveQuery = useQuery({
        queryKey: ['leave-requests', statusFilter, typeFilter, search],
        queryFn: () => getLeaveRequests({
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            search: search.trim() || undefined,
        }),
        staleTime: 30_000,
    });

    const personnelQuery = useQuery({
        queryKey: ['personnel', 'leave-create'],
        queryFn: () => getPersonnel({ page: 1, limit: 200, isActive: 'true' }),
        enabled: canManageLeaves && isCreateOpen,
        staleTime: 60_000,
    });

    const createMutation = useMutation({
        mutationFn: (payload: LeaveCreatePayload) => {
            if (!canManageLeaves) {
                throw new Error('Izin talebi olusturma yetkiniz yok.');
            }
            return createLeaveRequest(payload);
        },
        onSuccess: async () => {
            toast.success('Izin talebi olusturuldu.');
            await queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
            setIsCreateOpen(false);
            setCreateType('YILLIK');
            setCreateStartDate(toDateInputValue(new Date()));
            setCreateEndDate(toDateInputValue(new Date()));
            setCreateReason('');
            setFormError(null);
        },
        onError: () => {
            toast.error('Izin talebi olusturulamadi.');
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: LeaveStatus }) =>
            updateLeaveStatus(id, status),
        onSuccess: async () => {
            toast.success('Izin talebi guncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
        },
        onError: () => {
            toast.error('Izin talebi guncellenemedi.');
        },
    });

    const requests = Array.isArray(leaveQuery.data) ? leaveQuery.data : [];
    const filteredRequests = useMemo(
        () => requests,
        [requests],
    );

    const personnelRows = personnelQuery.data?.data ?? [];
    const personnelOptions = useMemo(() => {
        return personnelRows
            .map((item) => ({
                id: item.id,
                department: item.department,
                email: item.email,
                fullName: `${item.firstName} ${item.lastName}`.trim(),
            }))
            .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
    }, [personnelRows]);

    const selectedPersonnel = useMemo(() => {
        if (!createUserId) return null;
        return personnelOptions.find((item) => item.id === createUserId) ?? null;
    }, [createUserId, personnelOptions]);

    const resolvedDepartment = selectedPersonnel?.department ?? user?.department ?? null;
    const computedDurationDays = useMemo(
        () => calcDurationDays(createStartDate, createEndDate),
        [createStartDate, createEndDate],
    );

    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    const approvedRequests = filteredRequests.filter((item) => item.status === 'APPROVED');
    const todayOnLeave = approvedRequests.filter((item) => {
        const start = parseDateOnly(item.startDate);
        const end = parseDateOnly(item.endDate);
        if (!start || !end) return false;
        return today >= start && today <= end;
    }).length;
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);
    const upcomingWeek = approvedRequests.filter((item) => {
        const start = parseDateOnly(item.startDate);
        const end = parseDateOnly(item.endDate);
        if (!start || !end) return false;
        return start <= weekLater && end >= today;
    }).length;
    const averageApprovalDays = (() => {
        const durations = approvedRequests
            .map((item) => {
                if (!item.approvedAt) return null;
                const created = new Date(item.createdAt);
                const approved = new Date(item.approvedAt);
                if (Number.isNaN(created.getTime()) || Number.isNaN(approved.getTime())) return null;
                const diff = diffDays(created, approved);
                return diff >= 0 ? diff : null;
            })
            .filter((value): value is number => value !== null);

        if (durations.length === 0) return null;
        const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length;
        return avg;
    })();

    const pendingCount = filteredRequests.filter((item) => item.status === 'PENDING').length;
    const approvedCount = filteredRequests.filter((item) => item.status === 'APPROVED').length;
    const rejectedCount = filteredRequests.filter((item) => item.status === 'REJECTED').length;

    useEffect(() => {
        if (!isCreateOpen) return;
        if (createUserId) return;
        if (user?.id) {
            setCreateUserId(user.id);
            return;
        }
        if (personnelOptions.length > 0) {
            setCreateUserId(personnelOptions[0].id);
        }
    }, [createUserId, isCreateOpen, personnelOptions, user?.id]);

    useEffect(() => {
        if (!isCreateOpen) return;
        if (!createEndDate || !createStartDate) return;
        const duration = calcDurationDays(createStartDate, createEndDate);
        if (duration <= 0) return;
        setFormError(null);
    }, [createStartDate, createEndDate, isCreateOpen]);

    async function handleCreateLeave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        if (!createStartDate || !createEndDate) {
            setFormError('Baslangic ve bitis tarihi zorunludur.');
            return;
        }

        if (!createType) {
            setFormError('Izin turu zorunludur.');
            return;
        }

        if (computedDurationDays <= 0) {
            setFormError('Bitis tarihi baslangictan once olamaz.');
            return;
        }

        const payload: LeaveCreatePayload = {
            userId: createUserId || undefined,
            type: createType,
            startDate: createStartDate,
            endDate: createEndDate,
            durationDays: computedDurationDays,
            reason: createReason.trim() || undefined,
            department: resolvedDepartment ?? undefined,
        };

        await createMutation.mutateAsync(payload);
    }

    function closeCreateModal() {
        if (createMutation.isPending) return;
        setIsCreateOpen(false);
        setFormError(null);
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarCheck size={20} color="#DC2626" />}
                title="Izin Yonetimi"
                subtitle="Izin taleplerini takip edin, onay sureclerini yonetin."
            />

            {canManageLeaves && (
                <div className="mb-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex h-9 items-center gap-1 rounded-lg bg-[color:var(--role-accent-600)] px-3 text-xs font-semibold text-white transition hover:bg-[color:var(--role-accent-700)]"
                    >
                        <Plus size={13} />
                        Yeni Izin Talebi
                    </button>
                </div>
            )}

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Onay Bekleyen</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{pendingCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Onaylanan</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{approvedCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Reddedilen</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{rejectedCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Talep</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{filteredRequests.length}</p>
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
                            placeholder="Personel veya departman ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </label>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500">
                        <Filter size={14} />
                        Filtreler
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as LeaveStatus | '')}
                        className="h-9 min-w-[170px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="">Durum (Tum)</option>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(event) => setTypeFilter(event.target.value as LeaveType | '')}
                        className="h-9 min-w-[170px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="">Izin Turu (Tum)</option>
                        {Object.entries(TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Personel</th>
                                <th className="px-4 py-3 font-semibold">Departman</th>
                                <th className="px-4 py-3 font-semibold">Izin Turu</th>
                                <th className="px-4 py-3 font-semibold">Tarih Araligi</th>
                                <th className="px-4 py-3 font-semibold">Sure</th>
                                <th className="px-4 py-3 font-semibold">Durum</th>
                                <th className="px-4 py-3 font-semibold">Islem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leaveQuery.isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        Izin talepleri yukleniyor...
                                    </td>
                                </tr>
                            ) : leaveQuery.isError ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-rose-600">
                                        Izin talepleri yuklenemedi.
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        Gosterilecek izin talebi bulunamadi.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{request.employeeName}</span>
                                                <span className="text-xs text-gray-500">Talep: {formatDate(request.createdAt)}</span>
                                                {request.reason && (
                                                    <span className="mt-1 text-xs text-gray-400 line-clamp-2">{request.reason}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{request.department ?? '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {TYPE_LABELS[request.type] ?? request.type}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{formatRange(request.startDate, request.endDate)}</td>
                                        <td className="px-4 py-3 text-gray-600">{request.durationDays} gun</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[request.status]}`}>
                                                {STATUS_LABELS[request.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {canManageLeaves ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={request.status !== 'PENDING' || statusMutation.isPending}
                                                        onClick={() => statusMutation.mutate({ id: request.id, status: 'APPROVED' })}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                                                    >
                                                        <UserCheck size={12} />
                                                        Onayla
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={request.status !== 'PENDING' || statusMutation.isPending}
                                                        onClick={() => statusMutation.mutate({ id: request.id, status: 'REJECTED' })}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                                                    >
                                                        Reddet
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={request.status !== 'PENDING' || statusMutation.isPending}
                                                        onClick={() => statusMutation.mutate({ id: request.id, status: 'CANCELLED' })}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                                                    >
                                                        Iptal
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Yetkisiz</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Bugun Izinde</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{todayOnLeave} Personel</p>
                    <p className="mt-1 text-xs text-gray-500">Bugun izinde olan onayli talepler.</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">7 Gunluk Izin</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{upcomingWeek} Talep</p>
                    <p className="mt-1 text-xs text-gray-500">Onumuzdeki 7 gunde aktif izinler.</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ortalama Onay</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                        {averageApprovalDays === null ? '-' : `${averageApprovalDays.toFixed(1)} gun`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Onaylanan taleplere gore ortalama sure.</p>
                </article>
            </section>

            {canManageLeaves && isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" aria-label="Modali kapat" className="absolute inset-0 bg-black/40" onClick={closeCreateModal} />

                    <section className="relative z-10 w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Yeni Izin Talebi Olustur</h3>
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <form className="space-y-3" onSubmit={handleCreateLeave}>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <select
                                    value={createUserId}
                                    onChange={(event) => setCreateUserId(event.target.value)}
                                    className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                >
                                    <option value="">
                                        {personnelQuery.isLoading ? 'Personel yukleniyor...' : 'Personel secin'}
                                    </option>
                                    {personnelOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.fullName} ({item.email})
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={createType}
                                    onChange={(event) => setCreateType(event.target.value as LeaveType)}
                                    className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                >
                                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>

                                <input
                                    type="date"
                                    value={createStartDate}
                                    onChange={(event) => setCreateStartDate(event.target.value)}
                                    className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                                <input
                                    type="date"
                                    value={createEndDate}
                                    onChange={(event) => setCreateEndDate(event.target.value)}
                                    className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                    Sure: <strong className="text-gray-900">{computedDurationDays || 0} gun</strong>
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                    Departman: <strong className="text-gray-900">{resolvedDepartment || '-'}</strong>
                                </span>
                            </div>

                            <textarea
                                value={createReason}
                                onChange={(event) => setCreateReason(event.target.value)}
                                placeholder="Aciklama (opsiyonel)"
                                className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />

                            {formError && (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                    {formError}
                                </p>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="h-9 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Vazgec
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-[color:var(--role-accent-600)] px-3 text-xs font-semibold text-white transition hover:bg-[color:var(--role-accent-700)] disabled:cursor-not-allowed disabled:bg-gray-400"
                                >
                                    <Plus size={13} />
                                    {createMutation.isPending ? 'Olusturuluyor...' : 'Talebi Olustur'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
