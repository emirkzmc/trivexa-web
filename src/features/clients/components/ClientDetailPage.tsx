import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    BriefcaseBusiness,
    Building2,
    CircleDollarSign,
    CreditCard,
    FileText,
    MessageSquareMore,
    ReceiptText,
    ShieldCheck,
    Ticket,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import {
    getClientWorkspace,
    type ClientWorkspaceResponse,
} from '../api/clients.api';

type DetailTab = 'overview' | 'projects' | 'feedbacks' | 'tickets' | 'finance' | 'contracts';

const TAB_ITEMS: Array<{ key: DetailTab; label: string; icon: ReactNode }> = [
    { key: 'overview', label: 'Genel', icon: <Building2 size={14} /> },
    { key: 'projects', label: 'Projeler', icon: <BriefcaseBusiness size={14} /> },
    { key: 'feedbacks', label: 'Geri Bildirimler', icon: <MessageSquareMore size={14} /> },
    { key: 'tickets', label: 'Ticketlar', icon: <Ticket size={14} /> },
    { key: 'finance', label: 'Finans', icon: <CircleDollarSign size={14} /> },
    { key: 'contracts', label: 'Sozlesmeler', icon: <ShieldCheck size={14} /> },
];

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function statusBadgeClass(status?: string) {
    const normalized = (status ?? '').toUpperCase();
    if (['ACTIVE', 'OPEN', 'SIGNED', 'PAID', 'IN_PROGRESS', 'APPROVED', 'RESOLVED'].includes(normalized)) {
        return 'bg-emerald-100 text-emerald-700';
    }
    if (['PENDING', 'PENDING_APPROVAL', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(normalized)) {
        return 'bg-amber-100 text-amber-700';
    }
    if (['CANCELLED', 'TERMINATED', 'CLOSED', 'EXPIRED', 'INACTIVE'].includes(normalized)) {
        return 'bg-rose-100 text-rose-700';
    }

    return 'bg-gray-100 text-gray-700';
}

function TabButton({
    label,
    icon,
    active,
    onClick,
}: {
    label: string;
    icon: ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </article>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
            {label}
        </div>
    );
}

function findRelatedProjectName(
    workspace: ClientWorkspaceResponse,
    text: string,
) {
    const haystack = text.toLowerCase();
    const match = workspace.projects.find((project) => {
        const name = (project.name ?? '').trim().toLowerCase();
        return !!name && haystack.includes(name);
    });

    return match?.name;
}

export function ClientDetailPage() {
    const navigate = useNavigate();
    const { clientId = '' } = useParams<{ clientId: string }>();
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const userRole = useAuthStore((state) => state.user?.role);

    const canReadClients = userRole === ROLES.ADMIN
        || userRole === ROLES.MANAGER
        || userRole === ROLES.ACCOUNT_MANAGER
        || userRole === ROLES.ACCOUNTING;

    const workspaceQuery = useQuery({
        queryKey: ['client-workspace', clientId],
        queryFn: () => getClientWorkspace(clientId),
        enabled: canReadClients && !!clientId,
    });

    const workspace = workspaceQuery.data;
    const paymentMap = useMemo(
        () => new Map((workspace?.finance.paymentsByInvoice ?? []).map((item) => [item.invoiceId, item.payments])),
        [workspace?.finance.paymentsByInvoice],
    );

    const ticketProjectMap = useMemo(() => {
        if (!workspace) {
            return new Map<string, string>();
        }

        return new Map(
            workspace.tickets.map((ticket) => {
                const related = findRelatedProjectName(
                    workspace,
                    `${ticket.subject ?? ''} ${ticket.description ?? ''}`,
                );
                return [ticket.id, related ?? '-'];
            }),
        );
    }, [workspace]);

    if (!canReadClients) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<Building2 size={20} color="#DC2626" />}
                    title="Musteri Detayi"
                    subtitle="Yetki kontrolu"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana erisim yetkiniz bulunmuyor.
                </section>
            </div>
        );
    }

    if (!clientId) {
        return <div className="px-8 py-6 text-sm text-red-700">Musteri kimligi bulunamadi.</div>;
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<Building2 size={20} color="#DC2626" />}
                title={workspace?.client.companyName || 'Musteri Detayi'}
                subtitle={workspace
                    ? `${workspace.summary.totalProjects} proje, ${workspace.summary.totalTickets} ticket, ${workspace.summary.totalFeedbacks} geri bildirim`
                    : 'Musteri verileri yukleniyor'}
                actions={(
                    <button
                        type="button"
                        onClick={() => navigate('/app/musteriler')}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Musterilere Don
                    </button>
                )}
            />

            {workspaceQuery.isLoading ? (
                <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Musteri detaylari yukleniyor...</section>
            ) : workspaceQuery.isError || !workspace ? (
                <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-700">Musteri detayi yuklenemedi.</section>
            ) : (
                <>
                    <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Toplam Proje"
                            value={String(workspace.summary.totalProjects)}
                            subtitle={`${workspace.summary.activeProjects} aktif proje`}
                        />
                        <StatCard
                            title="Geri Bildirim"
                            value={String(workspace.summary.totalFeedbacks)}
                            subtitle="Toplanti notlari ve ozetler"
                        />
                        <StatCard
                            title="Ticket"
                            value={String(workspace.summary.totalTickets)}
                            subtitle="Musteriyle iliskili kayitlar"
                        />
                        <StatCard
                            title="Kalan Odeme"
                            value={formatMoney(workspace.summary.outstandingAmount)}
                            subtitle={`Toplam fatura ${formatMoney(workspace.summary.totalInvoiced)}`}
                        />
                    </section>

                    <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {TAB_ITEMS.map((item) => (
                                <TabButton
                                    key={item.key}
                                    label={item.label}
                                    icon={item.icon}
                                    active={activeTab === item.key}
                                    onClick={() => setActiveTab(item.key)}
                                />
                            ))}
                        </div>
                    </section>

                    {activeTab === 'overview' && (
                        <section className="grid gap-4 xl:grid-cols-2">
                            <article className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">Musteri Bilgileri</h2>
                                <div className="grid gap-2 text-sm">
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-xs text-gray-500">Sirket</p>
                                        <p className="font-medium text-gray-900">{workspace.client.companyName || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-xs text-gray-500">Yetkili</p>
                                        <p className="font-medium text-gray-900">{workspace.client.contactPerson || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-xs text-gray-500">E-posta</p>
                                        <p className="font-medium text-gray-900">{workspace.client.email || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-xs text-gray-500">Telefon</p>
                                        <p className="font-medium text-gray-900">{workspace.client.phone || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-xs text-gray-500">Adres</p>
                                        <p className="font-medium text-gray-900">{workspace.client.address || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-xs text-gray-500">Durum</p>
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${workspace.client.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {workspace.client.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-xs text-gray-500">Olusturma</p>
                                        <p className="font-medium text-gray-900">{workspace.client.createdAt ? formatDate(workspace.client.createdAt) : '-'}</p>
                                    </div>
                                </div>
                            </article>

                            <article className="rounded-xl border border-gray-200 bg-white p-4">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">Finans Ozeti</h2>
                                <div className="grid gap-2 text-sm">
                                    <div className="rounded-lg border border-gray-200 px-3 py-2">
                                        <p className="text-xs text-gray-500">Toplam Fatura</p>
                                        <p className="text-lg font-bold text-gray-900">{formatMoney(workspace.finance.totalInvoiced)}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-2">
                                        <p className="text-xs text-gray-500">Toplanan Odeme</p>
                                        <p className="text-lg font-bold text-gray-900">{formatMoney(workspace.finance.totalCollected)}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-2">
                                        <p className="text-xs text-gray-500">Kalan Bakiye</p>
                                        <p className="text-lg font-bold text-red-700">{formatMoney(workspace.finance.outstandingAmount)}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 px-3 py-2">
                                        <p className="text-xs text-gray-500">Bekleyen Fatura</p>
                                        <p className="text-lg font-bold text-gray-900">{workspace.summary.pendingInvoices}</p>
                                    </div>
                                </div>
                            </article>
                        </section>
                    )}

                    {activeTab === 'projects' && (
                        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {workspace.projects.length === 0 && <EmptyState label="Musteriye bagli proje kaydi bulunmuyor." />}
                            {workspace.projects.map((project) => (
                                <article key={project.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <h3 className="truncate text-sm font-semibold text-gray-900">{project.name || '-'}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(project.status)}`}>
                                            {project.status || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                        <p>Baslangic: {project.startDate ? formatDate(project.startDate) : '-'}</p>
                                        <p>Teslim: {project.deadline ? formatDate(project.deadline) : '-'}</p>
                                        <p>Butce: {formatMoney(project.budget)}</p>
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}

                    {activeTab === 'feedbacks' && (
                        <section className="space-y-3">
                            {workspace.feedbacks.length === 0 && <EmptyState label="Geri bildirim veya toplanti kaydi bulunmuyor." />}
                            {workspace.feedbacks.map((feedback) => {
                                const projectLabel = feedback.projectId
                                    ? workspace.projects.find((project) => project.id === feedback.projectId)?.name ?? feedback.projectId
                                    : '-';

                                return (
                                    <article key={feedback.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-gray-900">{feedback.title || 'Basliksiz geri bildirim'}</h3>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                                                Proje: {projectLabel}
                                            </span>
                                        </div>
                                        <div className="mb-2 text-xs text-gray-500">
                                            {feedback.date ? formatDate(feedback.date) : '-'}
                                        </div>
                                        {feedback.summary && (
                                            <p className="mb-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{feedback.summary}</p>
                                        )}
                                        {feedback.notes && <p className="text-sm text-gray-700">{feedback.notes}</p>}
                                    </article>
                                );
                            })}
                        </section>
                    )}

                    {activeTab === 'tickets' && (
                        <section className="space-y-3">
                            {workspace.tickets.length === 0 && <EmptyState label="Musteriyle iliskili ticket kaydi bulunmuyor." />}
                            {workspace.tickets.map((ticket) => (
                                <article key={ticket.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-semibold text-gray-900">{ticket.subject || 'Basliksiz ticket'}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(ticket.status)}`}>
                                            {ticket.status || 'UNKNOWN'}
                                        </span>
                                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                            Oncelik: {ticket.priority || '-'}
                                        </span>
                                    </div>
                                    <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                        <span>{ticket.createdAt ? formatDate(ticket.createdAt) : '-'}</span>
                                        <span>Ilgili Proje: {ticketProjectMap.get(ticket.id) || '-'}</span>
                                    </div>
                                    {ticket.description && <p className="text-sm text-gray-700">{ticket.description}</p>}
                                </article>
                            ))}
                        </section>
                    )}

                    {activeTab === 'finance' && (
                        <section className="space-y-4">
                            <article className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Toplam Fatura</p>
                                    <p className="mt-1 text-xl font-bold text-gray-900">{formatMoney(workspace.finance.totalInvoiced)}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Toplanan Odeme</p>
                                    <p className="mt-1 text-xl font-bold text-emerald-700">{formatMoney(workspace.finance.totalCollected)}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Kalan Bakiye</p>
                                    <p className="mt-1 text-xl font-bold text-red-700">{formatMoney(workspace.finance.outstandingAmount)}</p>
                                </div>
                            </article>

                            {workspace.finance.invoices.length === 0 ? (
                                <EmptyState label="Fatura kaydi bulunmuyor." />
                            ) : (
                                <div className="space-y-3">
                                    {workspace.finance.invoices.map((invoice) => {
                                        const payments = paymentMap.get(invoice.id) ?? [];
                                        const paidAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                                        const remaining = (invoice.total || 0) - paidAmount;

                                        return (
                                            <article key={invoice.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                    <h3 className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                                                        <ReceiptText size={14} />
                                                        {invoice.invoiceNumber || invoice.id}
                                                    </h3>
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(invoice.status)}`}>
                                                        {invoice.status || 'UNKNOWN'}
                                                    </span>
                                                </div>
                                                <div className="mb-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2 xl:grid-cols-4">
                                                    <p>Tutar: {formatMoney(invoice.total)}</p>
                                                    <p>Odenen: {formatMoney(paidAmount)}</p>
                                                    <p>Kalan: {formatMoney(remaining > 0 ? remaining : 0)}</p>
                                                    <p>Vade: {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</p>
                                                </div>

                                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                    <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                                        <CreditCard size={12} />
                                                        Odemeler
                                                    </p>
                                                    {payments.length === 0 ? (
                                                        <p className="text-xs text-gray-500">Bu faturaya ait odeme kaydi bulunmuyor.</p>
                                                    ) : (
                                                        <ul className="space-y-1 text-xs text-gray-700">
                                                            {payments.map((payment) => (
                                                                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5">
                                                                    <span>{payment.paymentDate ? formatDate(payment.paymentDate) : '-'}</span>
                                                                    <span>{payment.method || '-'}</span>
                                                                    <strong>{formatMoney(payment.amount)}</strong>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'contracts' && (
                        <section className="space-y-3">
                            {workspace.contracts.length === 0 && <EmptyState label="Sozlesme kaydi bulunmuyor." />}
                            {workspace.contracts.map((contract) => (
                                <article key={contract.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <h3 className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                                            <FileText size={14} />
                                            {contract.title || '-'}
                                        </h3>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(contract.status)}`}>
                                            {contract.status || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <div className="grid gap-2 text-xs text-gray-600 sm:grid-cols-2 xl:grid-cols-4">
                                        <p>Baslangic: {contract.startDate ? formatDate(contract.startDate) : '-'}</p>
                                        <p>Bitis: {contract.endDate ? formatDate(contract.endDate) : '-'}</p>
                                        <p>Deger: {formatMoney(contract.value)}</p>
                                        <p>Olusturma: {contract.createdAt ? formatDate(contract.createdAt) : '-'}</p>
                                    </div>
                                    {contract.description && (
                                        <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{contract.description}</p>
                                    )}
                                </article>
                            ))}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
