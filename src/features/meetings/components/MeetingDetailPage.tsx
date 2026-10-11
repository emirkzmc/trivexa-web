import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock, Building2, FolderKanban, Users, Link as LinkIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { getMeetingById, type MeetingItem } from '../api/meetings.api';

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

function audienceLabel(meeting?: MeetingItem): string {
    const type = meeting?.audienceType || 'PERSONAL';
    switch (type) {
        case 'PROJECT':
            return 'Proje';
        case 'DEPARTMENT':
            return 'Departman';
        case 'ALL_PERSONNEL':
            return 'Tum Personel';
        case 'MANAGERS':
            return 'Yonetici';
        default:
            return 'Kisisel';
    }
}

export function MeetingDetailPage() {
    const navigate = useNavigate();
    const { meetingId = '' } = useParams<{ meetingId: string }>();

    const meetingQuery = useQuery({
        queryKey: ['meeting-detail', meetingId],
        queryFn: () => getMeetingById(meetingId),
        enabled: Boolean(meetingId),
    });

    const meeting = meetingQuery.data;
    const title = meeting?.title || 'Musteri Gorusmesi';
    const durationLabel = useMemo(
        () => (meeting?.durationMinutes ? `${meeting.durationMinutes} dk` : '-'),
        [meeting?.durationMinutes],
    );

    if (!meetingId) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4 text-sm text-rose-700">
                Gorusme kimligi bulunamadi.
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarDays size={20} color="#DC2626" />}
                title="Musteri Gorusmesi Detayi"
                subtitle={title}
                actions={(
                    <button
                        type="button"
                        onClick={() => navigate('/app/gorusmeler')}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Gorusmelere Don
                    </button>
                )}
            />

            {meetingQuery.isLoading ? (
                <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                    Gorusme yukleniyor...
                </section>
            ) : meetingQuery.isError || !meeting ? (
                <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-sm text-rose-700">
                    Gorusme bulunamadi.
                </section>
            ) : (
                <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold text-gray-900">{meeting.title}</h2>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                                {audienceLabel(meeting)}
                            </span>
                        </div>

                        <div className="grid gap-3 text-sm">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-xs text-gray-500">Notlar</p>
                                <p className="text-gray-800">{meeting.notes || meeting.summary || '-'}</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 px-3 py-2">
                                    <p className="text-xs text-gray-500">Tarih</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(meeting.date)}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 px-3 py-2">
                                    <p className="text-xs text-gray-500">Sure</p>
                                    <p className="font-semibold text-gray-900">{durationLabel}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 px-3 py-2">
                                    <p className="text-xs text-gray-500">Departman</p>
                                    <p className="font-semibold text-gray-900">{meeting.department || '-'}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 px-3 py-2">
                                    <p className="text-xs text-gray-500">Olusturma</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(meeting.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Iliskili Bilgiler</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <Building2 size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Musteri</p>
                                    <p className="font-semibold text-gray-900">{meeting.clientName || meeting.clientId || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <FolderKanban size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Proje</p>
                                    <p className="font-semibold text-gray-900">{meeting.projectName || meeting.projectId || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <Users size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Organizer</p>
                                    <p className="font-semibold text-gray-900">{meeting.organizerId || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <Clock size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Guncelleme</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(meeting.updatedAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <LinkIcon size={14} className="text-gray-500" />
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-500">Toplanti Linki</p>
                                    {meeting.link ? (
                                        <a
                                            href={meeting.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="truncate font-semibold text-blue-600 hover:underline"
                                        >
                                            {meeting.link}
                                        </a>
                                    ) : (
                                        <p className="font-semibold text-gray-900">-</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
