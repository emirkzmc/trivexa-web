import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Filter, Search, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import {
    getLeaveRequests,
    updateLeaveStatus,
    type LeaveStatus,
    type LeaveType,
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

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(date);
}

function formatRange(start: string, end: string): string {
    if (!start || !end) return '-';
    return `${formatDate(start)} - ${formatDate(end)}`;
}

export function LeaveManagementPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<LeaveStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<LeaveType | ''>('');

    const leaveQuery = useQuery({
        queryKey: ['leave-requests', statusFilter, typeFilter, search],
        queryFn: () => getLeaveRequests({
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            search: search.trim() || undefined,
        }),
        staleTime: 30_000,
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

    const pendingCount = filteredRequests.filter((item) => item.status === 'PENDING').length;
    const approvedCount = filteredRequests.filter((item) => item.status === 'APPROVED').length;
    const rejectedCount = filteredRequests.filter((item) => item.status === 'REJECTED').length;

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarCheck size={20} color="#DC2626" />}
                title="Izin Yonetimi"
                subtitle="Izin taleplerini takip edin, onay sureclerini yonetin."
            />

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
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{request.department ?? '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[request.type]}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatRange(request.startDate, request.endDate)}</td>
                                        <td className="px-4 py-3 text-gray-600">{request.durationDays} gun</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[request.status]}`}>
                                                {STATUS_LABELS[request.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
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
                                            </div>
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
                    <p className="mt-2 text-lg font-semibold text-gray-900">2 Personel</p>
                    <p className="mt-1 text-xs text-gray-500">Gelistirme ve Pazarlama ekiplerinde izin var.</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Takim Kapasitesi</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">%86 Aktif</p>
                    <p className="mt-1 text-xs text-gray-500">Planlanan izinler sonrasi haftalik kapasite.</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ortalama Onay</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">1.6 gun</p>
                    <p className="mt-1 text-xs text-gray-500">Son 30 gundeki ortalama onay suresi.</p>
                </article>
            </section>
        </div>
    );
}
