import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import {
    approveLandingContactRequest,
    getLandingContactRequests,
    rejectLandingContactRequest,
    type LandingContactRequestItem,
    type LandingContactRequestStatus,
} from '../api/clients.api';

const STATUS_OPTIONS: Array<{ label: string; value: LandingContactRequestStatus | '' }> = [
    { label: 'Tum Durumlar', value: '' },
    { label: 'PENDING', value: 'PENDING' },
    { label: 'APPROVED', value: 'APPROVED' },
    { label: 'REJECTED', value: 'REJECTED' },
];

function formatDateLabel(isoDate: string) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function statusTone(status?: string): string {
    const normalized = (status ?? '').toUpperCase();
    if (normalized === 'APPROVED') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'REJECTED') return 'bg-rose-100 text-rose-700';
    if (normalized === 'PENDING') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
}

export function LandingContactRequestsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [status, setStatus] = useState<LandingContactRequestStatus | ''>('');
    const [search, setSearch] = useState('');

    const normalizedSearch = search.trim();

    const statusFilter: LandingContactRequestStatus | undefined = status === '' ? undefined : status;

    const requestsQuery = useQuery({
        queryKey: ['landing-contact-requests', page, limit, status, normalizedSearch],
        queryFn: () =>
            getLandingContactRequests({
                page,
                limit,
                status: statusFilter,
                search: normalizedSearch || undefined,
            }),
        staleTime: 30_000,
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => approveLandingContactRequest(id),
        onSuccess: async () => {
            toast.success('Talep onaylandi.');
            await queryClient.invalidateQueries({ queryKey: ['landing-contact-requests'] });
        },
        onError: () => {
            toast.error('Onay islemi basarisiz.');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            rejectLandingContactRequest(id, { reason }),
        onSuccess: async () => {
            toast.success('Talep reddedildi.');
            await queryClient.invalidateQueries({ queryKey: ['landing-contact-requests'] });
        },
        onError: () => {
            toast.error('Reddetme islemi basarisiz.');
        },
    });

    const rows = requestsQuery.data?.data ?? [];
    const total = requestsQuery.data?.total ?? rows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const isPendingAction = approveMutation.isPending || rejectMutation.isPending;

    const stats = useMemo(() => {
        const pending = rows.filter((item) => item.status === 'PENDING').length;
        const approved = rows.filter((item) => item.status === 'APPROVED').length;
        const rejected = rows.filter((item) => item.status === 'REJECTED').length;
        return { pending, approved, rejected };
    }, [rows]);

    function resetFilters() {
        setSearch('');
        setStatus('');
        setPage(1);
    }

    function handleReject(item: LandingContactRequestItem) {
        const reason = window.prompt('Reddetme nedeni (opsiyonel):')?.trim();
        rejectMutation.mutate({ id: item.id, reason: reason || undefined });
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<MessageSquarePlus size={20} color="var(--role-accent-600)" />}
                title="Iletisim Talepleri"
                subtitle="Landing iletisim formundan gelen talepleri yonetin."
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-3">
                <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Bekleyen</p>
                    <p className="mt-2 text-2xl font-bold text-amber-800">{stats.pending}</p>
                </article>
                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Onaylanan</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.approved}</p>
                </article>
                <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-700">Reddedilen</p>
                    <p className="mt-2 text-2xl font-bold text-rose-800">{stats.rejected}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Ad, e-posta, firma veya konu ara..."
                        className="h-9 min-w-[240px] flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    />
                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value as LandingContactRequestStatus | '');
                            setPage(1);
                        }}
                        className="h-9 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        Filtreyi Temizle
                    </button>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
                {requestsQuery.isLoading && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        Talepler yukleniyor...
                    </div>
                )}

                {requestsQuery.isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Talepler getirilemedi.
                    </div>
                )}

                {!requestsQuery.isLoading && !requestsQuery.isError && rows.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        Filtrelere uygun talep bulunmuyor.
                    </div>
                )}

                {!requestsQuery.isLoading && !requestsQuery.isError && rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                    <th className="px-2 py-3">Kisi</th>
                                    <th className="px-2 py-3">Iletisim</th>
                                    <th className="px-2 py-3">Konu</th>
                                    <th className="px-2 py-3">Durum</th>
                                    <th className="px-2 py-3">Tarih</th>
                                    <th className="px-2 py-3">Islem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {rows.map((item) => {
                                    const canAct = item.status === 'PENDING';
                                    return (
                                        <tr key={item.id} className="align-top">
                                            <td className="px-2 py-3">
                                                <p className="m-0 font-semibold text-gray-900">{item.fullName || '-'}</p>
                                                <p className="m-0 mt-1 text-xs text-gray-500">{item.company || '-'}</p>
                                            </td>
                                            <td className="px-2 py-3">
                                                <p className="m-0 text-sm text-gray-800">{item.email || '-'}</p>
                                                <p className="m-0 mt-1 text-xs text-gray-500">{item.phone || '-'}</p>
                                            </td>
                                            <td className="px-2 py-3">
                                                <p className="m-0 font-medium text-gray-900">{item.subject || '-'}</p>
                                                <p className="m-0 mt-1 max-w-[420px] text-xs text-gray-500">{item.message || '-'}</p>
                                            </td>
                                            <td className="px-2 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(item.status)}`}>
                                                    {item.status || '-'}
                                                </span>
                                                {item.reason && (
                                                    <p className="m-0 mt-1 text-[11px] text-gray-500">Neden: {item.reason}</p>
                                                )}
                                            </td>
                                            <td className="px-2 py-3 text-xs text-gray-600">{formatDateLabel(item.createdAt)}</td>
                                            <td className="px-2 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => approveMutation.mutate(item.id)}
                                                        disabled={!canAct || isPendingAction}
                                                        className="inline-flex h-8 items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                                    >
                                                        Onayla
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReject(item)}
                                                        disabled={!canAct || isPendingAction}
                                                        className="inline-flex h-8 items-center rounded-md border border-rose-200 bg-rose-50 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                                    >
                                                        Reddet
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={(nextLimit) => {
                        setLimit(nextLimit);
                        setPage(1);
                    }}
                    limitOptions={[10, 20, 50, 100]}
                />
            </section>
        </div>
    );
}
