import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ClipboardList, Calendar, Building2, User, Flag, Layers } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { getSupportRequestById } from '../api/tickets.api';

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

function normalizeStatus(value?: string): string {
    return (value ?? '').toUpperCase() || 'UNKNOWN';
}

function statusClass(value?: string): string {
    const normalized = normalizeStatus(value);
    if (['APPROVED', 'OPEN', 'RESOLVED'].includes(normalized)) return 'bg-emerald-100 text-emerald-700';
    if (['PENDING', 'IN_PROGRESS'].includes(normalized)) return 'bg-amber-100 text-amber-700';
    if (['REJECTED', 'CLOSED', 'CANCELLED'].includes(normalized)) return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
}

export function SupportRequestDetailPage() {
    const navigate = useNavigate();
    const { requestId = '' } = useParams<{ requestId: string }>();

    const requestQuery = useQuery({
        queryKey: ['support-request', requestId],
        queryFn: () => getSupportRequestById(requestId),
        enabled: Boolean(requestId),
    });

    const request = requestQuery.data;
    const title = request?.subject || 'Istek Talebi';
    const approvalStatus = useMemo(
        () => normalizeStatus(request?.approvalStatus),
        [request?.approvalStatus],
    );

    if (!requestId) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4 text-sm text-rose-700">
                Istek talebi kimligi bulunamadi.
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<ClipboardList size={20} color="#DC2626" />}
                title="Istek Talebi Detayi"
                subtitle={title}
                actions={(
                    <button
                        type="button"
                        onClick={() => navigate('/app/talepler')}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Taleplere Don
                    </button>
                )}
            />

            {requestQuery.isLoading ? (
                <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                    Istek talebi yukleniyor...
                </section>
            ) : requestQuery.isError || !request ? (
                <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-sm text-rose-700">
                    Istek talebi bulunamadi.
                </section>
            ) : (
                <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold text-gray-900">{request.subject}</h2>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(request.status)}`}>
                                {normalizeStatus(request.status)}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(request.approvalStatus)}`}>
                                {approvalStatus}
                            </span>
                        </div>

                        <div className="grid gap-3 text-sm">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-xs text-gray-500">Aciklama</p>
                                <p className="text-gray-800">{request.description || '-'}</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 px-3 py-2">
                                    <p className="text-xs text-gray-500">Oncelik</p>
                                    <p className="font-semibold text-gray-900">{request.priority}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 px-3 py-2">
                                    <p className="text-xs text-gray-500">Tip</p>
                                    <p className="font-semibold text-gray-900">{request.type}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 px-3 py-2">
                                    <p className="text-xs text-gray-500">Asama</p>
                                    <p className="font-semibold text-gray-900">{request.stage || '-'}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 px-3 py-2">
                                    <p className="text-xs text-gray-500">Onaylayan</p>
                                    <p className="font-semibold text-gray-900">{request.approvedBy || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Talep Bilgileri</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <Building2 size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Musteri</p>
                                    <p className="font-semibold text-gray-900">{request.clientCompanyName || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <User size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Talep Eden</p>
                                    <p className="font-semibold text-gray-900">{request.requesterEmail || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <Layers size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Proje</p>
                                    <p className="font-semibold text-gray-900">{request.projectName || request.projectId || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <Calendar size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Olusturma</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(request.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                <Flag size={14} className="text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Onay Tarihi</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(request.approvedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
