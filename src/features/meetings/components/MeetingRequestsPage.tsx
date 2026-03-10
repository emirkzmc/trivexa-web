import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { ROLES } from '../../../shared/constants/roles';
import { useAuthStore } from '../../auth/store/authStore';
import {
    approveSupportRequest,
    getSupportRequests,
    type SupportRequestItem,
} from '../../tickets/api/tickets.api';

function isMeetingManagerRole(role?: string): boolean {
    const normalized = String(role ?? '').toUpperCase();
    return normalized === ROLES.ADMIN
        || normalized === ROLES.CEO
        || normalized === ROLES.MANAGER
        || normalized === ROLES.ACCOUNT_MANAGER;
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
        .replace(/ÄŸ/g, 'g')
        .replace(/Ã¼/g, 'u')
        .replace(/ÅŸ/g, 's')
        .replace(/Ä±/g, 'i')
        .replace(/Ã¶/g, 'o')
        .replace(/Ã§/g, 'c')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function isMeetingRequest(subject: string, type: string): boolean {
    if ((type || '').toUpperCase() !== 'OTHER') return false;
    return normalizeForMeetingMatch(subject).startsWith('gorusme talebi');
}

function extractRequestedDate(description: string): string {
    const match = (description || '').match(/tercih edilen tarih-saat:\s*([^\r\n]+)/i);
    return match?.[1]?.trim() || '-';
}

function extractRequestedDuration(description: string): string {
    const match = (description || '').match(/tahmini sure:\s*(\d+)/i);
    const parsed = Number.parseInt(match?.[1] || '', 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return '-';
    return `${parsed} dk`;
}

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

export function MeetingRequestsPage() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const canManageMeetings = isMeetingManagerRole(user?.role);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [search, setSearch] = useState('');

    const normalizedSearch = search.trim();

    const requestsQuery = useQuery({
        queryKey: ['meeting-requests-page', page, limit, normalizedSearch],
        queryFn: () =>
            getSupportRequests({
                page,
                limit,
                approvalStatus: 'PENDING',
                type: 'OTHER',
                search: normalizedSearch || undefined,
            }),
        enabled: canManageMeetings,
        staleTime: 30_000,
    });

    const approveMutation = useMutation({
        mutationFn: (requestId: string) => approveSupportRequest(requestId),
        onSuccess: async () => {
            toast.success('Gorusme talebi onaylandi ve gorusmeye donustu.');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['meeting-requests-page'] }),
                queryClient.invalidateQueries({ queryKey: ['meetings'] }),
                queryClient.invalidateQueries({ queryKey: ['support-requests'] }),
            ]);
        },
        onError: () => {
            toast.error('Gorusme talebi onaylanamadi.');
        },
    });

    const rows = requestsQuery.data?.data ?? [];
    const meetingRows = rows.filter((item) => isMeetingRequest(item.subject, item.type));
    const total = requestsQuery.data?.total ?? meetingRows.length;
    const totalPages = requestsQuery.data?.totalPages ?? 1;
    const displayRows = meetingRows;

    const stats = useMemo(() => {
        const uniqueClients = new Set(meetingRows.map((item) => item.clientId).filter(Boolean));
        const uniqueProjects = new Set(meetingRows.map((item) => item.projectId).filter(Boolean));
        return {
            total: meetingRows.length,
            uniqueClients: uniqueClients.size,
            uniqueProjects: uniqueProjects.size,
        };
    }, [meetingRows]);

    if (!canManageMeetings) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<CalendarCheck size={20} color="#DC2626" />}
                    title="Gorusme Talepleri"
                    subtitle="Yetki kontrolu"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana sadece ADMIN, CEO, MANAGER ve ACCOUNT MANAGER rolleri erisebilir.
                </section>
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarCheck size={20} color="var(--role-accent-600)" />}
                title="Gorusme Talepleri"
                subtitle={`Sayfada ${displayRows.length} talep goruntuleniyor`}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-3">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Talep</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
                </article>
                <article className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">Musteri Sayisi</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-800">{stats.uniqueClients}</p>
                </article>
                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Proje Sayisi</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.uniqueProjects}</p>
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
                        placeholder="Konu, musteri veya proje ara..."
                        className="h-9 min-w-[240px] flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    />
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
                {requestsQuery.isLoading && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        Gorusme talepleri yukleniyor...
                    </div>
                )}

                {requestsQuery.isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Gorusme talepleri getirilemedi.
                    </div>
                )}

                {!requestsQuery.isLoading && !requestsQuery.isError && displayRows.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        Bekleyen gorusme talebi bulunmuyor.
                    </div>
                )}

                {!requestsQuery.isLoading && !requestsQuery.isError && displayRows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                    <th className="px-2 py-3">Talep</th>
                                    <th className="px-2 py-3">Musteri</th>
                                    <th className="px-2 py-3">Proje</th>
                                    <th className="px-2 py-3">Tercih Tarih</th>
                                    <th className="px-2 py-3">Sure</th>
                                    <th className="px-2 py-3">Tarih</th>
                                    <th className="px-2 py-3">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {displayRows.map((item: SupportRequestItem) => (
                                    <tr key={item.id}>
                                        <td className="px-2 py-3">
                                            <p className="m-0 font-semibold text-gray-900">{item.subject || '-'}</p>
                                            <p className="m-0 mt-1 max-w-[420px] text-xs text-gray-500">{item.description || '-'}</p>
                                        </td>
                                        <td className="px-2 py-3">
                                            <p className="m-0 text-sm font-medium text-gray-800">{item.clientCompanyName || '-'}</p>
                                            <p className="m-0 mt-1 text-xs text-gray-500">{item.requesterEmail || '-'}</p>
                                        </td>
                                        <td className="px-2 py-3">
                                            <p className="m-0 text-sm text-gray-800">{item.projectName || '-'}</p>
                                            <p className="m-0 mt-1 text-xs text-gray-500">{item.projectId || '-'}</p>
                                        </td>
                                        <td className="px-2 py-3 text-xs text-gray-600">
                                            {extractRequestedDate(item.description)}
                                        </td>
                                        <td className="px-2 py-3 text-xs text-gray-600">
                                            {extractRequestedDuration(item.description)}
                                        </td>
                                        <td className="px-2 py-3 text-xs text-gray-600">
                                            {formatDateTime(item.createdAt)}
                                        </td>
                                        <td className="px-2 py-3">
                                            <button
                                                type="button"
                                                onClick={() => approveMutation.mutate(item.id)}
                                                disabled={approveMutation.isPending}
                                                className="h-8 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                            >
                                                Onayla ve Gorusmeye Ekle
                                            </button>
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
                    limitOptions={[10, 20, 50]}
                />
            </section>
        </div>
    );
}
