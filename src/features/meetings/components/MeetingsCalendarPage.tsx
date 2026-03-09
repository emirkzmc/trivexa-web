import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getClients } from '../../clients/api/clients.api';
import { useAuthStore } from '../../auth/store/authStore';
import {
    createMeeting,
    getMeetings,
    MEETING_AUDIENCE_TYPES,
    type MeetingAudienceType,
    type MeetingItem,
} from '../api/meetings.api';
import { getProjects } from '../../projects/api/projects.api';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';

interface MeetingFormState {
    title: string;
    audienceType: MeetingAudienceType;
    date: string;
    durationMinutes: string;
    clientId: string;
    projectId: string;
    department: string;
    link: string;
    notes: string;
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

const AUDIENCE_OPTIONS: Array<{ value: MeetingAudienceType; label: string; hint: string }> = [
    {
        value: MEETING_AUDIENCE_TYPES.PERSONAL,
        label: 'Kisisel',
        hint: 'Sadece olusturan kisinin takviminde gorunur.',
    },
    {
        value: MEETING_AUDIENCE_TYPES.PROJECT,
        label: 'Proje Bazli',
        hint: 'Secilen proje uyeleri toplantiyi gorur.',
    },
    {
        value: MEETING_AUDIENCE_TYPES.DEPARTMENT,
        label: 'Departman Bazli',
        hint: 'Secilen departmandaki personeller toplantiyi gorur.',
    },
    {
        value: MEETING_AUDIENCE_TYPES.ALL_PERSONNEL,
        label: 'Tum Personeller',
        hint: 'Paneldeki tum personeller toplantiyi gorur.',
    },
    {
        value: MEETING_AUDIENCE_TYPES.MANAGERS,
        label: 'Yoneticiler',
        hint: 'Sadece yonetici rollerindeki personeller gorur.',
    },
];

const DEPARTMENT_OPTIONS = [
    'MANAGEMENT',
    'DESIGN',
    'DEVELOPMENT',
    'MARKETING',
    'FINANCE',
    'HR',
    'SOCIAL_MEDIA',
    'CREATIVE',
    'PRODUCTION',
    'ACCOUNTING',
];

function toDayKey(dateLike: string | Date): string {
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMonthLabel(date: Date): string {
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function getMonthMatrix(baseDate: Date): Date[] {
    const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const weekdayMondayStart = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - weekdayMondayStart);

    return Array.from({ length: 42 }, (_, index) => {
        const next = new Date(gridStart);
        next.setDate(gridStart.getDate() + index);
        return next;
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

function getAudienceLabel(audienceType: MeetingAudienceType): string {
    switch (audienceType) {
        case MEETING_AUDIENCE_TYPES.PROJECT:
            return 'Proje';
        case MEETING_AUDIENCE_TYPES.DEPARTMENT:
            return 'Departman';
        case MEETING_AUDIENCE_TYPES.ALL_PERSONNEL:
            return 'Tum Personeller';
        case MEETING_AUDIENCE_TYPES.MANAGERS:
            return 'Yoneticiler';
        case MEETING_AUDIENCE_TYPES.PERSONAL:
        default:
            return 'Kisisel';
    }
}

export function MeetingsCalendarPage() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const canManageMeetings = isMeetingManagerRole(user?.role);

    const [monthCursor, setMonthCursor] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDay, setSelectedDay] = useState<string>(() => toDayKey(new Date()));
    const [meetingForm, setMeetingForm] = useState<MeetingFormState>({
        title: '',
        audienceType: MEETING_AUDIENCE_TYPES.PERSONAL,
        date: '',
        durationMinutes: '60',
        clientId: '',
        projectId: '',
        department: '',
        link: '',
        notes: '',
    });

    const meetingsQuery = useQuery({
        queryKey: ['meetings', 'calendar'],
        queryFn: () => getMeetings(),
    });

    const clientsQuery = useQuery({
        queryKey: ['meetings', 'clients-options'],
        queryFn: () => getClients({ page: 1, limit: 100 }),
        enabled: canManageMeetings,
    });

    const projectsQuery = useQuery({
        queryKey: ['meetings', 'projects-options'],
        queryFn: () => getProjects({ page: 1, limit: 100 }),
        enabled: canManageMeetings,
    });

    const visibleMeetings = meetingsQuery.data ?? [];

    const meetingsByDay = useMemo(() => {
        const map = new Map<string, MeetingItem[]>();
        visibleMeetings.forEach((meeting) => {
            const key = toDayKey(meeting.date);
            const existing = map.get(key);
            if (existing) {
                existing.push(meeting);
            } else {
                map.set(key, [meeting]);
            }
        });
        map.forEach((items) => {
            items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return map;
    }, [visibleMeetings]);

    const monthDays = useMemo(() => getMonthMatrix(monthCursor), [monthCursor]);
    const selectedDayMeetings = meetingsByDay.get(selectedDay) ?? [];

    const createMeetingMutation = useMutation({
        mutationFn: async () => {
            const title = meetingForm.title.trim();
            const dateValue = meetingForm.date;
            const durationMinutes = Number(meetingForm.durationMinutes);
            const audienceType = meetingForm.audienceType;

            if (!title) {
                throw new Error('Toplanti basligi zorunludur.');
            }
            if (!dateValue) {
                throw new Error('Toplanti tarihi zorunludur.');
            }
            if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
                throw new Error('Sure bilgisi gecersiz.');
            }
            if (audienceType === MEETING_AUDIENCE_TYPES.PROJECT && !meetingForm.projectId) {
                throw new Error('Proje bazli toplanti icin proje secmelisiniz.');
            }
            if (audienceType === MEETING_AUDIENCE_TYPES.DEPARTMENT && !meetingForm.department) {
                throw new Error('Departman bazli toplanti icin departman secmelisiniz.');
            }

            return createMeeting({
                title,
                audienceType,
                date: new Date(dateValue).toISOString(),
                durationMinutes,
                clientId: meetingForm.clientId || undefined,
                projectId: audienceType === MEETING_AUDIENCE_TYPES.PROJECT
                    ? meetingForm.projectId || undefined
                    : undefined,
                department: audienceType === MEETING_AUDIENCE_TYPES.DEPARTMENT
                    ? meetingForm.department || undefined
                    : undefined,
                link: meetingForm.link.trim() || undefined,
                notes: meetingForm.notes.trim() || undefined,
            });
        },
        onSuccess: async () => {
            toast.success('Toplanti olusturuldu.');
            setMeetingForm({
                title: '',
                audienceType: MEETING_AUDIENCE_TYPES.PERSONAL,
                date: '',
                durationMinutes: '60',
                clientId: '',
                projectId: '',
                department: '',
                link: '',
                notes: '',
            });
            await queryClient.invalidateQueries({ queryKey: ['meetings', 'calendar'] });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Toplanti olusturulamadi.';
            toast.error(message);
        },
    });

    async function handleCreateMeeting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await createMeetingMutation.mutateAsync();
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarDays size={20} color="#DC2626" />}
                title="Toplanti Takvimi"
                subtitle={canManageMeetings
                    ? 'Personel toplanti takibi ve toplanti olusturma'
                    : 'Toplanti takviminiz'}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Toplanti</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{visibleMeetings.length}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Bu Ay</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {visibleMeetings.filter((item) => {
                            const date = new Date(item.date);
                            return date.getMonth() === monthCursor.getMonth()
                                && date.getFullYear() === monthCursor.getFullYear();
                        }).length}
                    </p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Secili Gun</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{selectedDayMeetings.length}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Rol</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{user?.role ?? '-'}</p>
                </article>
            </section>

            {canManageMeetings && (
                <form onSubmit={handleCreateMeeting} className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Plus size={15} className="text-red-600" />
                        <h2 className="text-sm font-semibold text-gray-900">Yeni Toplanti Olustur</h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Baslik</label>
                            <input
                                value={meetingForm.title}
                                onChange={(event) => setMeetingForm((prev) => ({ ...prev, title: event.target.value }))}
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                placeholder="Ornek: Sprint Planlama"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Toplanti Kapsami</label>
                            <select
                                value={meetingForm.audienceType}
                                onChange={(event) => {
                                    const value = event.target.value as MeetingAudienceType;
                                    setMeetingForm((prev) => ({
                                        ...prev,
                                        audienceType: value,
                                        projectId: value === MEETING_AUDIENCE_TYPES.PROJECT ? prev.projectId : '',
                                        department: value === MEETING_AUDIENCE_TYPES.DEPARTMENT ? prev.department : '',
                                    }));
                                }}
                                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            >
                                {AUDIENCE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-[11px] text-gray-500">
                                {AUDIENCE_OPTIONS.find((option) => option.value === meetingForm.audienceType)?.hint}
                            </p>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Tarih / Saat</label>
                            <input
                                type="datetime-local"
                                value={meetingForm.date}
                                onChange={(event) => setMeetingForm((prev) => ({ ...prev, date: event.target.value }))}
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Sure (dk)</label>
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={meetingForm.durationMinutes}
                                onChange={(event) => setMeetingForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Musteri</label>
                            <select
                                value={meetingForm.clientId}
                                onChange={(event) => setMeetingForm((prev) => ({ ...prev, clientId: event.target.value }))}
                                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            >
                                <option value="">Secimsiz</option>
                                {(clientsQuery.data?.data ?? []).map((client) => (
                                    <option key={client.id} value={client.id}>{client.companyName}</option>
                                ))}
                            </select>
                        </div>
                        {meetingForm.audienceType === MEETING_AUDIENCE_TYPES.PROJECT && (
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Proje</label>
                                <select
                                    value={meetingForm.projectId}
                                    onChange={(event) => setMeetingForm((prev) => ({ ...prev, projectId: event.target.value }))}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    required
                                >
                                    <option value="">Proje secin</option>
                                    {(projectsQuery.data?.data ?? []).map((project) => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {meetingForm.audienceType === MEETING_AUDIENCE_TYPES.DEPARTMENT && (
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Departman</label>
                                <select
                                    value={meetingForm.department}
                                    onChange={(event) => setMeetingForm((prev) => ({ ...prev, department: event.target.value }))}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    required
                                >
                                    <option value="">Departman secin</option>
                                    {DEPARTMENT_OPTIONS.map((department) => (
                                        <option key={department} value={department}>{department}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Toplanti Linki</label>
                            <input
                                value={meetingForm.link}
                                onChange={(event) => setMeetingForm((prev) => ({ ...prev, link: event.target.value }))}
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                placeholder="https://meet.google.com/..."
                            />
                        </div>
                        <div className="md:col-span-2 xl:col-span-4">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Notlar</label>
                            <textarea
                                rows={2}
                                value={meetingForm.notes}
                                onChange={(event) => setMeetingForm((prev) => ({ ...prev, notes: event.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                placeholder="Toplanti notlari"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={createMeetingMutation.isPending}
                            className="inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-default disabled:opacity-60"
                        >
                            {createMeetingMutation.isPending ? 'Olusturuluyor...' : 'Toplanti Olustur'}
                        </button>
                    </div>
                </form>
            )}

            <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition hover:bg-gray-100"
                            aria-label="Onceki ay"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <h3 className="text-sm font-semibold text-gray-900">{getMonthLabel(monthCursor)}</h3>
                        <button
                            type="button"
                            onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition hover:bg-gray-100"
                            aria-label="Sonraki ay"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {WEEKDAY_LABELS.map((label) => (
                            <div key={label}>{label}</div>
                        ))}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-2">
                        {monthDays.map((date) => {
                            const dayKey = toDayKey(date);
                            const isCurrentMonth = date.getMonth() === monthCursor.getMonth();
                            const isSelected = dayKey === selectedDay;
                            const dayMeetings = meetingsByDay.get(dayKey) ?? [];
                            return (
                                <button
                                    key={dayKey}
                                    type="button"
                                    onClick={() => setSelectedDay(dayKey)}
                                    className={`min-h-[92px] rounded-lg border p-2 text-left transition ${
                                        isSelected
                                            ? 'border-red-400 bg-red-50'
                                            : isCurrentMonth
                                                ? 'border-gray-200 bg-white hover:border-red-300'
                                                : 'border-gray-100 bg-gray-50 text-gray-400'
                                    }`}
                                >
                                    <p className="text-xs font-semibold">{date.getDate()}</p>
                                    {dayMeetings.length > 0 && (
                                        <p className="mt-1 text-[11px] font-semibold text-red-700">
                                            {dayMeetings.length} toplanti
                                        </p>
                                    )}
                                    <div className="mt-1 space-y-1">
                                        {dayMeetings.slice(0, 2).map((meeting) => (
                                            <p key={meeting.id} className="truncate rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700">
                                                {meeting.title}
                                            </p>
                                        ))}
                                        {dayMeetings.length > 2 && (
                                            <p className="text-[10px] text-gray-500">+{dayMeetings.length - 2} daha</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        {selectedDay} - Toplantilar
                    </h3>
                    {meetingsQuery.isLoading ? (
                        <p className="text-sm text-gray-500">Toplantilar yukleniyor...</p>
                    ) : meetingsQuery.isError ? (
                        <p className="text-sm text-red-700">Toplanti verisi alinamadi.</p>
                    ) : selectedDayMeetings.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
                            Bu gun icin toplanti yok.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {selectedDayMeetings.map((meeting) => (
                                <li key={meeting.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-semibold text-gray-900">{meeting.title}</p>
                                        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                                            {getAudienceLabel(meeting.audienceType)}
                                        </span>
                                    </div>
                                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-600">
                                        <Clock3 size={12} />
                                        {formatDate(meeting.date)}
                                        {meeting.durationMinutes ? ` (${meeting.durationMinutes} dk)` : ''}
                                    </p>
                                    {meeting.department && (
                                        <p className="mt-1 text-xs font-medium text-gray-700">
                                            Departman: {meeting.department}
                                        </p>
                                    )}
                                    {meeting.link && (
                                        <p className="mt-1 text-xs">
                                            <a
                                                href={meeting.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-red-700 underline"
                                            >
                                                Toplanti linki
                                            </a>
                                        </p>
                                    )}
                                    {meeting.notes && (
                                        <p className="mt-2 text-xs text-gray-700">{meeting.notes}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            </section>
        </div>
    );
}
