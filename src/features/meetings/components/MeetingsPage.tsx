
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAuthStore } from '../../auth/store/authStore';
import { getClients, type ClientItem } from '../../clients/api/clients.api';
import { createMeeting, getMeetings, type MeetingCreatePayload } from '../api/meetings.api';
import { getProjects, type ProjectItem } from '../../projects/api/projects.api';
import { ROLES } from '../../../shared/constants/roles';
import {
    approveSupportRequest,
    getSupportRequests,
    type SupportRequestItem,
} from '../../tickets/api/tickets.api';

function formatDateTime(value: string): string {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDuration(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return '-';
    if (value < 60) return `${value} dk`;
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return minutes > 0 ? `${hours} sa ${minutes} dk` : `${hours} sa`;
}

function toDatetimeLocalInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    const normalizedSubject = normalizeForMeetingMatch(subject);
    if (normalizedSubject.startsWith('gorusme talebi')) return true;
    if ((type || '').toUpperCase() !== 'OTHER') return false;
    return normalizedSubject.includes('gorusme');
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

function parseMeetingRequestDetails(notes?: string): {
    preferredDate: string;
    duration: string;
    details: string;
    hasRequestMeta: boolean;
} {
    const text = String(notes || '').trim();
    if (!text) {
        return {
            preferredDate: '-',
            duration: '-',
            details: '',
            hasRequestMeta: false,
        };
    }

    const preferredDateRaw = text.match(/tercih edilen tarih-saat:\s*([^\r\n]+)/i)?.[1]?.trim() || '';
    const durationRaw = text.match(/tahmini sure:\s*(\d+)/i)?.[1]?.trim() || '';
    const details = text.match(/aciklama:\s*([\s\S]*)$/i)?.[1]?.trim() || '';
    const parsedDuration = Number.parseInt(durationRaw, 10);
    const formattedDate = preferredDateRaw ? formatDateTime(preferredDateRaw) : '-';

    return {
        preferredDate: preferredDateRaw ? (formattedDate === '-' ? preferredDateRaw : formattedDate) : '-',
        duration: Number.isFinite(parsedDuration) && parsedDuration > 0 ? formatDuration(parsedDuration) : '-',
        details,
        hasRequestMeta: Boolean(
            preferredDateRaw
            || durationRaw
            || details
            || normalizeForMeetingMatch(text).includes('gorusme talebi olusturuldu'),
        ),
    };
}

function sortByLabel<T extends { name?: string; companyName?: string }>(rows: T[]): T[] {
    return rows.slice().sort((a, b) => {
        const left = (a.name || a.companyName || '').trim();
        const right = (b.name || b.companyName || '').trim();
        return left.localeCompare(right, 'tr');
    });
}

function isMeetingManagerRole(role?: string): boolean {
    const normalized = String(role ?? '').toUpperCase();
    return normalized === ROLES.ADMIN
        || normalized === ROLES.CEO
        || normalized === ROLES.MANAGER
        || normalized === ROLES.ACCOUNT_MANAGER
        || normalized === ROLES.HR;
}

export function MeetingsPage() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const canManageMeetings = isMeetingManagerRole(user?.role);
    const [filterClientId, setFilterClientId] = useState('');
    const [filterProjectId, setFilterProjectId] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [title, setTitle] = useState('');
    const [date, setDate] = useState(() => toDatetimeLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
    const [durationMinutes, setDurationMinutes] = useState('30');
    const [createClientId, setCreateClientId] = useState('');
    const [createProjectId, setCreateProjectId] = useState('');
    const [link, setLink] = useState('');
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const clientsQuery = useQuery({
        queryKey: ['clients', 'meetings-create'],
        queryFn: () => getClients({ page: 1, limit: 100, isActive: 'true' }),
        staleTime: 60_000,
    });
    const filterClientsQuery = useQuery({
        queryKey: ['clients', 'meetings-filter'],
        queryFn: () => getClients({ page: 1, limit: 100 }),
        staleTime: 60_000,
    });

    const createProjectsQuery = useQuery({
        queryKey: ['projects', 'meetings-create', createClientId],
        queryFn: () => getProjects({ page: 1, limit: 100, clientId: createClientId || undefined }),
        staleTime: 60_000,
    });

    const projectFilterQuery = useQuery({
        queryKey: ['projects', 'meetings-filter', filterClientId],
        queryFn: () => getProjects({
            page: 1,
            limit: 100,
            clientId: filterClientId || undefined,
        }),
        staleTime: 60_000,
    });

    const meetingsQuery = useQuery({
        queryKey: ['meetings'],
        queryFn: () => getMeetings(),
        staleTime: 30_000,
    });

    const pendingMeetingRequestsQuery = useQuery({
        queryKey: ['meeting-requests', 'pending'],
        queryFn: () => getSupportRequests({
            page: 1,
            limit: 100,
            approvalStatus: 'PENDING',
        }),
        enabled: canManageMeetings,
        staleTime: 30_000,
    });

    const createMeetingMutation = useMutation({
        mutationFn: (payload: MeetingCreatePayload) => {
            if (!canManageMeetings) {
                throw new Error('Toplanti olusturma yetkiniz yok.');
            }
            return createMeeting(payload);
        },
        onSuccess: async () => {
            toast.success('Gorusme olusturuldu.');
            await queryClient.invalidateQueries({ queryKey: ['meetings'] });
            setTitle('');
            setNotes('');
            setLink('');
            setDurationMinutes('30');
            setDate(toDatetimeLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
            setCreateClientId('');
            setCreateProjectId('');
            setIsCreateModalOpen(false);
        },
        onError: () => {
            toast.error('Gorusme olusturulamadi.');
        },
    });

    const approveMeetingRequestMutation = useMutation({
        mutationFn: (requestId: string) => {
            if (!canManageMeetings) {
                throw new Error('Gorusme talebi onaylama yetkiniz yok.');
            }
            return approveSupportRequest(requestId);
        },
        onSuccess: async () => {
            toast.success('Gorusme talebi onaylandi ve gorusmeye donusturuldu.');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['meeting-requests'] }),
                queryClient.invalidateQueries({ queryKey: ['meetings'] }),
                queryClient.invalidateQueries({ queryKey: ['support-requests'] }),
            ]);
        },
        onError: () => {
            toast.error('Gorusme talebi onaylanamadi.');
        },
    });

    const rows = meetingsQuery.data ?? [];
    const meetingRequestRows = useMemo(() => {
        const requestRows = pendingMeetingRequestsQuery.data?.data ?? [];
        return requestRows.filter((item: SupportRequestItem) => isMeetingRequest(item.subject, item.type));
    }, [pendingMeetingRequestsQuery.data]);
    const pendingMeetingRequests = useMemo(() => {
        return meetingRequestRows.filter((item) => {
            if (filterClientId && item.clientId !== filterClientId) return false;
            if (filterProjectId && item.projectId !== filterProjectId) return false;
            return true;
        });
    }, [filterClientId, filterProjectId, meetingRequestRows]);

    const createClients = useMemo(
        () => sortByLabel<ClientItem>(clientsQuery.data?.data ?? []),
        [clientsQuery.data?.data],
    );
    const createProjects = useMemo(
        () => sortByLabel<ProjectItem>(createProjectsQuery.data?.data ?? []),
        [createProjectsQuery.data?.data],
    );
    const clientOptions = useMemo(() => {
        const byId = new Map<string, string>();

        (filterClientsQuery.data?.data ?? []).forEach((client) => {
            if (!client.id) return;
            byId.set(client.id, client.companyName || client.id);
        });

        rows.forEach((item) => {
            if (!item.clientId) return;
            if (!byId.has(item.clientId)) {
                byId.set(item.clientId, item.clientId);
            }
        });

        meetingRequestRows.forEach((item) => {
            if (!item.clientId) return;
            if (!byId.has(item.clientId)) {
                byId.set(item.clientId, item.clientCompanyName?.trim() || item.clientId);
            }
        });

        if (filterClientId && !byId.has(filterClientId)) {
            byId.set(filterClientId, filterClientId);
        }

        return Array.from(byId.entries())
            .map(([id, label]) => ({ id, label }))
            .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    }, [filterClientId, filterClientsQuery.data?.data, meetingRequestRows, rows]);

    const projectOptions = useMemo(() => {
        const byId = new Map<string, string>();

        (projectFilterQuery.data?.data ?? []).forEach((project) => {
            if (!project.id) return;
            byId.set(project.id, project.name || project.id);
        });

        rows.forEach((item) => {
            if (!item.projectId) return;
            if (filterClientId && item.clientId && item.clientId !== filterClientId) return;
            if (!byId.has(item.projectId)) {
                byId.set(item.projectId, item.projectId);
            }
        });

        meetingRequestRows.forEach((item) => {
            if (!item.projectId) return;
            if (filterClientId && item.clientId && item.clientId !== filterClientId) return;
            if (!byId.has(item.projectId)) {
                byId.set(item.projectId, item.projectName?.trim() || item.projectId);
            }
        });

        if (filterProjectId && !byId.has(filterProjectId)) {
            byId.set(filterProjectId, filterProjectId);
        }

        return Array.from(byId.entries())
            .map(([id, label]) => ({ id, label }))
            .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    }, [filterClientId, filterProjectId, meetingRequestRows, projectFilterQuery.data?.data, rows]);

    const filteredRows = useMemo(() => {
        return rows.filter((item) => {
            if (filterClientId && item.clientId !== filterClientId) return false;
            if (filterProjectId && item.projectId !== filterProjectId) return false;
            return true;
        });
    }, [filterClientId, filterProjectId, rows]);

    const approvedMeetingRows = useMemo(() => {
        const sortedRows = filteredRows
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const strictMatched = sortedRows.filter((item) => {
            const details = parseMeetingRequestDetails(item.notes);
            const normalizedNotes = normalizeForMeetingMatch(item.notes || '');
            return details.hasRequestMeta || normalizedNotes.includes('portal_request_id');
        });

        // Backward compatibility: older approved meetings may not contain request marker/details.
        return strictMatched.length > 0 ? strictMatched : sortedRows;
    }, [filteredRows]);

    const stats = useMemo(() => {
        const now = Date.now();
        const weekLater = now + (7 * 24 * 60 * 60 * 1000);
        const upcomingCount = filteredRows.filter((item) => {
            const time = new Date(item.date).getTime();
            return Number.isFinite(time) && time >= now;
        }).length;
        const thisWeekCount = filteredRows.filter((item) => {
            const time = new Date(item.date).getTime();
            return Number.isFinite(time) && time >= now && time <= weekLater;
        }).length;
        return {
            total: filteredRows.length,
            upcomingCount,
            thisWeekCount,
        };
    }, [filteredRows]);

    useEffect(() => {
        if (!isCreateModalOpen) return;
        if (createClientId) return;
        if (createClients.length === 0) return;
        setCreateClientId(createClients[0].id);
    }, [createClientId, createClients, isCreateModalOpen]);

    useEffect(() => {
        if (!createProjectId) return;
        const exists = createProjects.some((project) => project.id === createProjectId);
        if (!exists) {
            setCreateProjectId('');
        }
    }, [createProjectId, createProjects]);

    useEffect(() => {
        if (!filterProjectId) return;
        const exists = projectOptions.some((project) => project.id === filterProjectId);
        if (!exists) {
            setFilterProjectId('');
        }
    }, [filterProjectId, projectOptions]);

    async function handleCreateMeeting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        if (!title.trim()) {
            setFormError('Baslik zorunludur.');
            return;
        }

        if (!createClientId) {
            setFormError('Musteri secimi zorunludur.');
            return;
        }

        if (!date) {
            setFormError('Tarih zorunludur.');
            return;
        }

        const parsedDuration = Number.parseInt(durationMinutes, 10);
        if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
            setFormError('Sure 0 dan buyuk olmalidir.');
            return;
        }

        await createMeetingMutation.mutateAsync({
            title: title.trim(),
            date: new Date(date).toISOString(),
            durationMinutes: parsedDuration,
            clientId: createClientId,
            projectId: createProjectId || undefined,
            link: link.trim() || undefined,
            notes: notes.trim() || undefined,
        });
    }

    function closeCreateModal() {
        if (createMeetingMutation.isPending) return;
        setIsCreateModalOpen(false);
    }
    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarDays size={20} color="var(--role-accent-600)" />}
                title="Gorusmeler"
                subtitle="Backend /meetings endpointi uzerinden toplantilari yonetin."
            />

            {canManageMeetings && (
                <div className="mb-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex h-9 items-center gap-1 rounded-lg bg-[color:var(--role-accent-600)] px-3 text-xs font-semibold text-white transition hover:bg-[color:var(--role-accent-700)]"
                    >
                        <Plus size={13} />
                        Yeni Gorusme Olustur
                    </button>
                </div>
            )}

            <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Gorusme</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
                </article>
                <article className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">Yaklasan</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-800">{stats.upcomingCount}</p>
                </article>
                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Bu Hafta</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.thisWeekCount}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={filterClientId}
                        onChange={(event) => setFilterClientId(event.target.value)}
                        className="h-9 min-w-[260px] rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    >
                        <option value="">Tum musteriler</option>
                        {clientOptions.map((client) => (
                            <option key={client.id} value={client.id}>{client.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterProjectId}
                        onChange={(event) => setFilterProjectId(event.target.value)}
                        className="h-9 min-w-[260px] rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                    >
                        <option value="">Tum projeler</option>
                        {projectOptions.map((project) => (
                            <option key={project.id} value={project.id}>{project.label}</option>
                        ))}
                    </select>
                </div>
            </section>

            {canManageMeetings && (
                <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="mb-3 text-base font-semibold text-gray-900">Onay Bekleyen Gorusme Talepleri</h3>

                    {pendingMeetingRequestsQuery.isLoading && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                            Gorusme talepleri yukleniyor...
                        </div>
                    )}

                    {pendingMeetingRequestsQuery.isError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Gorusme talepleri getirilirken bir hata olustu.
                        </div>
                    )}

                    {!pendingMeetingRequestsQuery.isLoading
                        && !pendingMeetingRequestsQuery.isError
                        && pendingMeetingRequests.length === 0 && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                Onay bekleyen gorusme talebi yok.
                            </div>
                        )}

                    {!pendingMeetingRequestsQuery.isLoading
                        && !pendingMeetingRequestsQuery.isError
                        && pendingMeetingRequests.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                            <th className="px-2 py-3">Talep</th>
                                            <th className="px-2 py-3">Musteri</th>
                                            <th className="px-2 py-3">Proje</th>
                                            <th className="px-2 py-3">Tercih Tarih</th>
                                            <th className="px-2 py-3">Sure</th>
                                            <th className="px-2 py-3">Aksiyon</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                        {pendingMeetingRequests.map((request) => (
                                            <tr key={request.id}>
                                                <td className="px-2 py-3">
                                                    <p className="m-0 font-semibold text-gray-900">{request.subject || '-'}</p>
                                                    <p className="m-0 mt-1 max-w-[420px] truncate text-xs text-gray-500">
                                                        {request.description || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <p className="m-0 text-sm font-medium text-gray-800">{request.clientCompanyName || '-'}</p>
                                                    <p className="m-0 mt-1 text-xs text-gray-500">{request.requesterEmail || '-'}</p>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <p className="m-0 text-sm text-gray-800">{request.projectName || '-'}</p>
                                                    <p className="m-0 mt-1 text-xs text-gray-500">{request.projectId || '-'}</p>
                                                </td>
                                                <td className="px-2 py-3 text-xs text-gray-600">{extractRequestedDate(request.description)}</td>
                                                <td className="px-2 py-3 text-xs text-gray-600">{extractRequestedDuration(request.description)}</td>
                                                <td className="px-2 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => approveMeetingRequestMutation.mutate(request.id)}
                                                        disabled={approveMeetingRequestMutation.isPending}
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
                </section>
            )}
            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-base font-semibold text-gray-900">Onaylanan Gorusmeler</h3>

                {meetingsQuery.isLoading && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">Gorusmeler yukleniyor...</div>
                )}

                {meetingsQuery.isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Gorusmeler getirilirken bir hata olustu.</div>
                )}

                {!meetingsQuery.isLoading && !meetingsQuery.isError && approvedMeetingRows.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">Onaylanan gorusme kaydi bulunmuyor.</div>
                )}

                {!meetingsQuery.isLoading && !meetingsQuery.isError && approvedMeetingRows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                    <th className="px-2 py-3">Onaylanan Gorusme</th>
                                    <th className="px-2 py-3">Tarih</th>
                                    <th className="px-2 py-3">Sure</th>
                                    <th className="px-2 py-3">Client ID</th>
                                    <th className="px-2 py-3">Project ID</th>
                                    <th className="px-2 py-3">Notlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {approvedMeetingRows.map((meeting) => {
                                    const requestDetails = parseMeetingRequestDetails(meeting.notes);
                                    return (
                                        <tr key={meeting.id}>
                                            <td className="px-2 py-3 font-semibold text-gray-900">{meeting.title || '-'}</td>
                                            <td className="px-2 py-3 text-xs text-gray-600">{formatDateTime(meeting.date)}</td>
                                            <td className="px-2 py-3 text-xs text-gray-600">{formatDuration(meeting.durationMinutes)}</td>
                                            <td className="px-2 py-3 text-xs text-gray-600">{meeting.clientId || '-'}</td>
                                            <td className="px-2 py-3 text-xs text-gray-600">{meeting.projectId || '-'}</td>
                                            <td className="px-2 py-3">
                                                <p className="m-0 max-w-[420px] truncate text-xs text-gray-600">{meeting.notes || '-'}</p>
                                                {requestDetails.hasRequestMeta && (
                                                    <div className="mt-2 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-2">
                                                        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-indigo-800">Talep Detaylari</p>
                                                        <p className="m-0 mt-1 text-xs text-indigo-700">Tercih Tarih: {requestDetails.preferredDate}</p>
                                                        <p className="m-0 mt-1 text-xs text-indigo-700">Sure: {requestDetails.duration}</p>
                                                        <p className="m-0 mt-1 line-clamp-3 text-xs text-indigo-800">Aciklama: {requestDetails.details || '-'}</p>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            {canManageMeetings && isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" aria-label="Modali kapat" className="absolute inset-0 bg-black/40" onClick={closeCreateModal} />

                    <section className="relative z-10 w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Yeni Gorusme Olustur</h3>
                            <button type="button" onClick={closeCreateModal} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50">
                                <X size={14} />
                            </button>
                        </div>

                        <form className="space-y-3" onSubmit={handleCreateMeeting}>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Gorusme basligi" className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]" />
                                <input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]" />
                                <select value={createClientId} onChange={(event) => { setCreateClientId(event.target.value); setCreateProjectId(''); }} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]">
                                    <option value="">{clientsQuery.isLoading ? 'Musteriler yukleniyor...' : 'Musteri secin'}</option>
                                    {createClients.map((client) => (<option key={client.id} value={client.id}>{client.companyName}</option>))}
                                </select>
                                <select value={createProjectId} onChange={(event) => setCreateProjectId(event.target.value)} disabled={!createClientId || createProjectsQuery.isLoading} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)] disabled:cursor-not-allowed disabled:bg-gray-100">
                                    <option value="">{!createClientId ? 'Once musteri secin' : createProjectsQuery.isLoading ? 'Projeler yukleniyor...' : 'Proje secin (opsiyonel)'}</option>
                                    {createProjects.map((project) => (<option key={project.id} value={project.id}>{project.name}</option>))}
                                </select>
                                <input type="number" min={15} step={15} value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} placeholder="Sure (dk)" className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]" />
                                <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="Toplanti linki (opsiyonel)" className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]" />
                            </div>

                            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notlar (opsiyonel)" className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]" />

                            {formError && (<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>)}

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={closeCreateModal} className="h-9 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">Vazgec</button>
                                <button type="submit" disabled={createMeetingMutation.isPending} className="inline-flex h-9 items-center gap-1 rounded-lg bg-[color:var(--role-accent-600)] px-3 text-xs font-semibold text-white transition hover:bg-[color:var(--role-accent-700)] disabled:cursor-not-allowed disabled:bg-gray-400">
                                    <Plus size={13} />
                                    {createMeetingMutation.isPending ? 'Olusturuluyor...' : 'Gorusme Ekle'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
