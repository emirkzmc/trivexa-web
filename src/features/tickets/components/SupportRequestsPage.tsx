import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import {
    approveSupportRequest,
    completeSupportRequest,
    getSupportRequests,
    SUPPORT_REQUEST_STAGES,
    type SupportRequestStage,
    updateSupportRequestStage,
} from '../api/tickets.api';

const LIMIT_OPTIONS = [10, 20, 50];

function formatDateTime(value: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function prettify(value: string): string {
    return (value || '-').replace(/_/g, ' ');
}

function statusTone(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === 'OPEN') return 'bg-amber-100 text-amber-700';
    if (normalized === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700';
    if (normalized === 'RESOLVED') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'CLOSED') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
}

function approvalTone(approvalStatus: string): string {
    const normalized = approvalStatus.toUpperCase();
    if (normalized === 'PENDING') return 'bg-amber-100 text-amber-700';
    if (normalized === 'APPROVED') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'REJECTED') return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
}

function stageTone(stage?: string): string {
    if (!stage) return 'bg-gray-100 text-gray-600';
    return 'bg-indigo-100 text-indigo-700';
}

function priorityTone(priority: string): string {
    const normalized = priority.toUpperCase();
    if (normalized === 'URGENT') return 'bg-rose-100 text-rose-700';
    if (normalized === 'HIGH') return 'bg-orange-100 text-orange-700';
    if (normalized === 'MEDIUM') return 'bg-indigo-100 text-indigo-700';
    return 'bg-slate-100 text-slate-700';
}

function normalizeForMeetingMatch(value: string): string {
    return (value || '')
        .toLowerCase()
        .replace(/\u011f/g, 'g')
        .replace(/\u00fc/g, 'u')
        .replace(/\u015f/g, 's')
        .replace(/\u0131/g, 'i')
        .replace(/\u00f6/g, 'o')
        .replace(/\u00e7/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function isMeetingRequest(subject: string, type: string): boolean {
    if ((type || '').toUpperCase() !== 'OTHER') return false;
    return normalizeForMeetingMatch(subject).startsWith('gorusme talebi');
}

interface SupportRequestsPageProps {
    title?: string;
    subtitle?: string;
    showMeetingNote?: boolean;
}

export function SupportRequestsPage({
    title = 'Destek Talepleri',
    subtitle = 'Musteri portalindan gelen talepleri takip edin.',
    showMeetingNote = true,
}: SupportRequestsPageProps) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [approvalStatus, setApprovalStatus] = useState('');
    const [priority, setPriority] = useState('');
    const [type, setType] = useState('');
    const [stage, setStage] = useState('');

    const normalizedSearch = search.trim();

    const requestsQuery = useQuery({
        queryKey: ['support-requests', page, limit, normalizedSearch, status, approvalStatus, priority, type, stage],
        queryFn: () => getSupportRequests({
            page,
            limit,
            search: normalizedSearch || undefined,
            status: status || undefined,
            approvalStatus: approvalStatus || undefined,
            priority: priority || undefined,
            type: type || undefined,
            stage: stage || undefined,
        }),
        staleTime: 30_000,
    });

    const approveMutation = useMutation({
        mutationFn: (requestId: string) => approveSupportRequest(requestId),
        onSuccess: async () => {
            toast.success('Talep onaylandi.');
            await queryClient.invalidateQueries({ queryKey: ['support-requests'] });
        },
        onError: () => {
            toast.error('Talep onaylanamadi.');
        },
    });

    const stageMutation = useMutation({
        mutationFn: ({ requestId, stageValue }: { requestId: string; stageValue: SupportRequestStage }) =>
            updateSupportRequestStage(requestId, stageValue),
        onSuccess: async () => {
            toast.success('Talep asamasi guncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['support-requests'] });
        },
        onError: () => {
            toast.error('Asama guncellenemedi.');
        },
    });

    const completeMutation = useMutation({
        mutationFn: (requestId: string) => completeSupportRequest(requestId),
        onSuccess: async () => {
            toast.success('Talep tamamlandi olarak isaretlendi.');
            await queryClient.invalidateQueries({ queryKey: ['support-requests'] });
        },
        onError: () => {
            toast.error('Tamamlandi islemi basarisiz.');
        },
    });

    const allRows = requestsQuery.data?.data ?? [];
    const rows = allRows.filter((item) => !isMeetingRequest(item.subject, item.type));
    const total = rows.length;
    const totalPages = requestsQuery.data?.totalPages ?? 1;

    const stats = useMemo(() => {
        const openCount = rows.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS').length;
        const pendingApprovalCount = rows.filter((item) => item.approvalStatus === 'PENDING').length;
        const urgentCount = rows.filter((item) => item.priority === 'URGENT').length;
        const approvedCount = rows.filter((item) => item.approvalStatus === 'APPROVED').length;
        return { openCount, pendingApprovalCount, urgentCount, approvedCount };
    }, [rows]);

    function resetPageAnd(action: () => void) {
        action();
        setPage(1);
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<Inbox size={20} color="var(--role-accent-600)" />}
                title={title}
                subtitle={subtitle}
            />

            {showMeetingNote && (
                <p className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                    Gorusme talepleri bu listeden ayrildi. Onaylanan gorusmeleri <strong>Gorusmeler</strong> ekranindan takip edin.
                </p>
            )}

            <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Talep</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{total}</p>
                </article>
                <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Onay Bekleyen</p>
                    <p className="mt-2 text-2xl font-bold text-amber-800">{stats.pendingApprovalCount}</p>
                </article>
                <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-700">Acil Talepler</p>
                    <p className="mt-2 text-2xl font-bold text-rose-800">{stats.urgentCount}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="relative min-w-[240px] flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                            <Search size={14} />
                        </span>
                        <input
                            value={search}
                            onChange={(event) => resetPageAnd(() => setSearch(event.target.value))}
                            placeholder="Konu, aciklama, firma veya e-posta ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        />
                    </label>

                    <select
                        value={status}
                        onChange={(event) => resetPageAnd(() => setStatus(event.target.value))}
                        className="h-9 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    >
                        <option value="">Tum Durumlar</option>
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                    </select>

                    <select
                        value={approvalStatus}
                        onChange={(event) => resetPageAnd(() => setApprovalStatus(event.target.value))}
                        className="h-9 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    >
                        <option value="">Tum Onaylar</option>
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                    </select>

                    <select
                        value={priority}
                        onChange={(event) => resetPageAnd(() => setPriority(event.target.value))}
                        className="h-9 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    >
                        <option value="">Tum Oncelikler</option>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                    </select>

                    <select
                        value={type}
                        onChange={(event) => resetPageAnd(() => setType(event.target.value))}
                        className="h-9 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    >
                        <option value="">Tum Tipler</option>
                        <option value="SUPPORT">SUPPORT</option>
                        <option value="BUG">BUG</option>
                        <option value="FEATURE">FEATURE</option>
                        <option value="OTHER">OTHER</option>
                    </select>

                    <select
                        value={stage}
                        onChange={(event) => resetPageAnd(() => setStage(event.target.value))}
                        className="h-9 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    >
                        <option value="">Tum Asamalar</option>
                        {SUPPORT_REQUEST_STAGES.map((stageOption) => (
                            <option key={stageOption} value={stageOption}>
                                {stageOption}
                            </option>
                        ))}
                    </select>
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
                        Talepler getirilirken bir hata olustu.
                    </div>
                )}

                {!requestsQuery.isLoading && !requestsQuery.isError && rows.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        Filtrelere uygun talep bulunmuyor.
                    </div>
                )}

                {!requestsQuery.isLoading && !requestsQuery.isError && rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                    <th className="px-2 py-3">Talep</th>
                                    <th className="px-2 py-3">Musteri</th>
                                    <th className="px-2 py-3">Oncelik</th>
                                    <th className="px-2 py-3">Tip</th>
                                    <th className="px-2 py-3">Durum</th>
                                    <th className="px-2 py-3">Onay</th>
                                    <th className="px-2 py-3">Asama</th>
                                    <th className="px-2 py-3">Tarih</th>
                                    <th className="px-2 py-3">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {rows.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-2 py-3">
                                            <p className="m-0 font-semibold text-gray-900">{item.subject || '-'}</p>
                                            <p className="m-0 mt-1 max-w-[420px] truncate text-xs text-gray-500">
                                                {item.description || '-'}
                                            </p>
                                        </td>
                                        <td className="px-2 py-3">
                                            <p className="m-0 text-sm font-medium text-gray-800">{item.clientCompanyName || '-'}</p>
                                            <p className="m-0 mt-1 text-xs text-gray-500">{item.requesterEmail || '-'}</p>
                                        </td>
                                        <td className="px-2 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityTone(item.priority)}`}>
                                                {prettify(item.priority)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3 text-xs font-semibold text-gray-600">
                                            {prettify(item.type)}
                                        </td>
                                        <td className="px-2 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(item.status)}`}>
                                                {prettify(item.status)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${approvalTone(item.approvalStatus)}`}>
                                                {prettify(item.approvalStatus)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3">
                                            <select
                                                value={item.stage ?? ''}
                                                disabled={item.approvalStatus !== 'APPROVED' || stageMutation.isPending}
                                                onChange={(event) => {
                                                    const nextValue = event.target.value as SupportRequestStage | '';
                                                    if (!nextValue) return;
                                                    stageMutation.mutate({
                                                        requestId: item.id,
                                                        stageValue: nextValue,
                                                    });
                                                }}
                                                className="h-8 min-w-[140px] rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                                            >
                                                <option value="">Asama Sec</option>
                                                {SUPPORT_REQUEST_STAGES.map((stageOption) => (
                                                    <option key={stageOption} value={stageOption}>
                                                        {stageOption}
                                                    </option>
                                                ))}
                                            </select>
                                            {!item.stage && (
                                                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${stageTone(item.stage)}`}>
                                                    Bekleniyor
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-2 py-3 text-xs text-gray-600">
                                            {formatDateTime(item.createdAt)}
                                        </td>
                                        <td className="px-2 py-3">
                                            {item.status === 'CLOSED' || item.status === 'RESOLVED' || item.status === 'COMPLETED' ? (
                                                <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                    Tamamlandi
                                                </span>
                                            ) : item.approvalStatus === 'APPROVED' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => completeMutation.mutate(item.id)}
                                                    disabled={completeMutation.isPending}
                                                    className="h-8 rounded-md bg-slate-700 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                                                >
                                                    Tamamlandi
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => approveMutation.mutate(item.id)}
                                                    disabled={approveMutation.isPending}
                                                    className="h-8 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                                >
                                                    Onayla
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
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
                    limitOptions={LIMIT_OPTIONS}
                />

                <p className="mt-2 text-xs text-emerald-700">
                    Acik/incelemede: {stats.openCount} | Onayli: {stats.approvedCount}
                </p>
            </section>
        </div>
    );
}


