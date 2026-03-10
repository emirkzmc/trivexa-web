import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { createContract } from '../../contracts/api/contracts.api';
import { createInvoice, updateInvoiceStatus, type InvoiceStatus } from '../../finance/api/invoices.api';
import {
    getClientWorkspace,
    type ClientWorkspaceResponse,
} from '../api/clients.api';
import { useResetClientPortalAccess } from '../hooks/useClientMutations';
import { showConfirmDialogWithCheckbox } from '../../../shared/lib/sweetAlert';

type DetailTab = 'overview' | 'projects' | 'feedbacks' | 'tickets' | 'finance' | 'contracts';

const TAB_ITEMS: Array<{ key: DetailTab; label: string; icon: ReactNode }> = [
    { key: 'overview', label: 'Genel', icon: <Building2 size={14} /> },
    { key: 'projects', label: 'Projeler', icon: <BriefcaseBusiness size={14} /> },
    { key: 'feedbacks', label: 'Geri Bildirimler', icon: <MessageSquareMore size={14} /> },
    { key: 'tickets', label: 'Ticketlar', icon: <Ticket size={14} /> },
    { key: 'finance', label: 'Finans', icon: <CircleDollarSign size={14} /> },
    { key: 'contracts', label: 'Sozlesmeler', icon: <ShieldCheck size={14} /> },
];

const INVOICE_STATUS_OPTIONS: InvoiceStatus[] = [
    'DRAFT',
    'SENT',
    'PAID',
    'PARTIALLY_PAID',
    'CANCELLED',
    'OVERDUE',
];

const CONTRACT_STATUS_OPTIONS = [
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'SIGNED',
    'EXPIRED',
    'TERMINATED',
] as const;

interface InvoiceFormState {
    projectId: string;
    description: string;
    quantity: string;
    unitPrice: string;
    taxRate: string;
    dueDate: string;
    notes: string;
}

interface ContractFormState {
    title: string;
    description: string;
    projectId: string;
    startDate: string;
    endDate: string;
    value: string;
    status: (typeof CONTRACT_STATUS_OPTIONS)[number];
}

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

function invoiceStatusLabel(status: string) {
    const normalized = status.toUpperCase();
    if (normalized === 'PARTIALLY_PAID') {
        return 'PARTIALLY PAID';
    }
    return normalized;
}

function formatPaymentMethod(value?: string) {
    if (!value) return '-';
    const normalized = value.toUpperCase();
    if (normalized === 'BANK_TRANSFER') return 'Banka Havalesi';
    if (normalized === 'CREDIT_CARD') return 'Kredi Karti';
    if (normalized === 'CASH') return 'Nakit';
    if (normalized === 'OTHER') return 'Diger';
    return value;
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
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { clientId = '' } = useParams<{ clientId: string }>();
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>({
        projectId: '',
        description: '',
        quantity: '1',
        unitPrice: '',
        taxRate: '20',
        dueDate: '',
        notes: '',
    });
    const [contractForm, setContractForm] = useState<ContractFormState>({
        title: '',
        description: '',
        projectId: '',
        startDate: '',
        endDate: '',
        value: '',
        status: 'DRAFT',
    });
    const userRole = useAuthStore((state) => state.user?.role);
    const resetPortalAccessMutation = useResetClientPortalAccess();

    const canReadClients = userRole === ROLES.ADMIN
        || userRole === ROLES.MANAGER
        || userRole === ROLES.ACCOUNT_MANAGER
        || userRole === ROLES.ACCOUNTING;
    const canManageInvoices = userRole === ROLES.ADMIN || userRole === ROLES.MANAGER;
    const canManageContracts = userRole === ROLES.ADMIN || userRole === ROLES.MANAGER;
    const canResetPortalAccess = userRole === ROLES.ADMIN
        || userRole === ROLES.MANAGER
        || userRole === ROLES.ACCOUNT_MANAGER;

    const workspaceQuery = useQuery({
        queryKey: ['client-workspace', clientId],
        queryFn: () => getClientWorkspace(clientId),
        enabled: canReadClients && !!clientId,
    });

    const workspace = workspaceQuery.data;

    const createContractMutation = useMutation({
        mutationFn: async () => {
            if (!workspace) {
                throw new Error('Musteri verisi bulunamadi.');
            }

            const title = contractForm.title.trim();
            if (!title) {
                throw new Error('Sozlesme basligi zorunludur.');
            }
            if (!contractForm.startDate) {
                throw new Error('Baslangic tarihi zorunludur.');
            }

            const value = contractForm.value ? Number(contractForm.value) : undefined;
            if (contractForm.value && (!Number.isFinite(value) || value < 0)) {
                throw new Error('Sozlesme degeri gecersiz.');
            }

            return createContract({
                clientId: workspace.client.id,
                projectId: contractForm.projectId || undefined,
                title,
                description: contractForm.description.trim() || undefined,
                startDate: contractForm.startDate,
                endDate: contractForm.endDate || undefined,
                value,
                status: contractForm.status || undefined,
            });
        },
        onSuccess: async () => {
            toast.success('Sozlesme olusturuldu.');
            setContractForm({
                title: '',
                description: '',
                projectId: '',
                startDate: '',
                endDate: '',
                value: '',
                status: 'DRAFT',
            });
            await queryClient.invalidateQueries({ queryKey: ['client-workspace', clientId] });
            await queryClient.invalidateQueries({ queryKey: ['contracts-list'] });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Sozlesme olusturulamadi.';
            toast.error(message);
        },
    });

    const createInvoiceMutation = useMutation({
        mutationFn: async () => {
            if (!workspace) {
                throw new Error('Müşteri verisi bulunamadı.');
            }

            const description = invoiceForm.description.trim();
            const quantity = Number(invoiceForm.quantity);
            const unitPrice = Number(invoiceForm.unitPrice);
            const taxRate = Number(invoiceForm.taxRate);

            if (!description) {
                throw new Error('Kalem aciklamasi zorunludur.');
            }
            if (!invoiceForm.projectId) {
                throw new Error('Fatura olustururken proje secimi zorunludur.');
            }
            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error('Miktar 0 dan buyuk olmali.');
            }
            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                throw new Error('Birim fiyat gecersiz.');
            }

            return createInvoice({
                clientId: workspace.client.id,
                projectId: invoiceForm.projectId,
                items: [{ description, quantity, unitPrice }],
                taxRate: Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : 20,
                dueDate: invoiceForm.dueDate || undefined,
                notes: invoiceForm.notes.trim() || undefined,
            });
        },
        onSuccess: async () => {
            toast.success('Fatura olusturuldu.');
            setInvoiceForm({
                projectId: '',
                description: '',
                quantity: '1',
                unitPrice: '',
                taxRate: '20',
                dueDate: '',
                notes: '',
            });
            await queryClient.invalidateQueries({ queryKey: ['client-workspace', clientId] });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Fatura olusturulamadi.';
            toast.error(message);
        },
    });

    const updateInvoiceStatusMutation = useMutation({
        mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) =>
            updateInvoiceStatus(invoiceId, { status }),
        onSuccess: async () => {
            toast.success('Fatura durumu güncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['client-workspace', clientId] });
        },
        onError: () => {
            toast.error('Fatura durumu guncellenemedi.');
        },
    });
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

    async function handleCreateInvoice(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await createInvoiceMutation.mutateAsync();
    }

    async function handleCreateContract(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await createContractMutation.mutateAsync();
    }

    async function handleResetPortalAccess() {
        if (!clientId) return;
        const confirmed = await showConfirmDialogWithCheckbox({
            title: 'Portal sifresi sifirlansin mi?',
            text: 'Bu islem yeni sifre olusturur ve musteriye e-posta gonderir.',
            confirmText: 'Sifreyi Sifirla',
            cancelText: 'Vazgec',
            checkboxLabel: 'Sifre sifirlama islemini onayliyorum.',
            icon: 'warning',
        });
        if (!confirmed) return;

        const response = await resetPortalAccessMutation.mutateAsync(clientId);
        const link = response?.portalUrl || response?.magicLink;
        if (link && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(link);
                toast.success('Portal linki panoya kopyalandi.', { duration: 3_000 });
            } catch {
                // ignore clipboard errors
            }
        }
    }

    if (!canReadClients) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<Building2 size={20} color="#DC2626" />}
                    title="Müşteri Detayi"
                    subtitle="Yetki kontrolü"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana erişim yetkiniz bulunmuyor.
                </section>
            </div>
        );
    }

    if (!clientId) {
        return <div className="px-8 py-6 text-sm text-red-700">Müşteri kimligi bulunamadı.</div>;
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<Building2 size={20} color="#DC2626" />}
                title={workspace?.client.companyName || 'Müşteri Detayi'}
                subtitle={workspace
                    ? `${workspace.summary.totalProjects} proje, ${workspace.summary.totalTickets} ticket, ${workspace.summary.totalFeedbacks} geri bildirim`
                    : 'Müşteri verileri yükleniyor'}
                actions={(
                    <div className="flex items-center gap-2">
                        {canResetPortalAccess && (
                            <button
                                type="button"
                                onClick={handleResetPortalAccess}
                                disabled={resetPortalAccessMutation.isPending}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <ShieldCheck size={14} />
                                Sifreyi Sifirla
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => navigate('/app/musteriler')}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            <ArrowLeft size={14} />
                            Musterilere Don
                        </button>
                    </div>
                )}
            />

            {workspaceQuery.isLoading ? (
                <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Müşteri detaylari yükleniyor...</section>
            ) : workspaceQuery.isError || !workspace ? (
                <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-700">Müşteri detayi yüklenemedi.</section>
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
                            subtitle="Müşteriyle ilişkili kayıtlar"
                        />
                        <StatCard
                            title="Kalan Ödeme"
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
                                <h2 className="mb-3 text-base font-semibold text-gray-900">Müşteri Bilgileri</h2>
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
                                        <p className="text-xs text-gray-500">Toplanan Ödeme</p>
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
                            {workspace.projects.length === 0 && <EmptyState label="Müşteriye bağlı proje kaydı bulunmuyor." />}
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
                            {workspace.feedbacks.length === 0 && <EmptyState label="Geri bildirim veya toplanti kaydı bulunmuyor." />}
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
                            {workspace.tickets.length === 0 && <EmptyState label="Müşteriyle ilişkili ticket kaydı bulunmuyor." />}
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
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Toplanan Ödeme</p>
                                    <p className="mt-1 text-xl font-bold text-emerald-700">{formatMoney(workspace.finance.totalCollected)}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Kalan Bakiye</p>
                                    <p className="mt-1 text-xl font-bold text-red-700">{formatMoney(workspace.finance.outstandingAmount)}</p>
                                </div>
                            </article>

                            {canManageInvoices && (
                                <form
                                    onSubmit={handleCreateInvoice}
                                    className="rounded-xl border border-gray-200 bg-white p-4"
                                >
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Yeni Fatura Olustur</h3>
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        <div className="xl:col-span-2">
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Kalem Aciklamasi</label>
                                            <input
                                                value={invoiceForm.description}
                                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, description: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                placeholder="Hizmet aciklamasi"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Proje</label>
                                            <select
                                                value={invoiceForm.projectId}
                                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, projectId: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                required
                                            >
                                                <option value="" disabled>Proje sec</option>
                                                {workspace.projects.map((project) => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Miktar</label>
                                            <input
                                                type="number"
                                                min={0.01}
                                                step={0.01}
                                                value={invoiceForm.quantity}
                                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Birim Fiyat</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={invoiceForm.unitPrice}
                                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Vergi Oranı (%)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={invoiceForm.taxRate}
                                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, taxRate: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Vade Tarihi</label>
                                            <input
                                                type="date"
                                                value={invoiceForm.dueDate}
                                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2 xl:col-span-3">
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Not</label>
                                            <textarea
                                                rows={2}
                                                value={invoiceForm.notes}
                                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, notes: event.target.value }))}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                placeholder="Opsiyonel not"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={createInvoiceMutation.isPending}
                                            className="inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-default disabled:opacity-60"
                                        >
                                            {createInvoiceMutation.isPending ? 'Olusturuluyor...' : 'Fatura Olustur'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {workspace.finance.invoices.length === 0 ? (
                                <EmptyState label="Fatura kaydı bulunmuyor." />
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
                                                    {canManageInvoices && (
                                                        <select
                                                            value={invoice.status || 'DRAFT'}
                                                            onChange={(event) => {
                                                                const nextStatus = event.target.value as InvoiceStatus;
                                                                if (nextStatus === invoice.status) {
                                                                    return;
                                                                }
                                                                updateInvoiceStatusMutation.mutate({
                                                                    invoiceId: invoice.id,
                                                                    status: nextStatus,
                                                                });
                                                            }}
                                                            disabled={updateInvoiceStatusMutation.isPending}
                                                            className="h-7 rounded-md border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-700 outline-none focus:border-red-500"
                                                        >
                                                            {INVOICE_STATUS_OPTIONS.map((status) => (
                                                                <option key={status} value={status}>
                                                                    {invoiceStatusLabel(status)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
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
                                                        <p className="text-xs text-gray-500">Bu faturaya ait ödeme kaydı bulunmuyor.</p>
                                                    ) : (
                                                        <ul className="space-y-2 text-xs text-gray-700">
                                                            {payments.map((payment) => (
                                                                <li key={payment.id} className="rounded-md bg-white px-2.5 py-2">
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <strong>{formatMoney(payment.amount)}</strong>
                                                                        <span>{payment.paymentDate ? formatDate(payment.paymentDate) : '-'}</span>
                                                                    </div>
                                                                    <div className="mt-1 grid gap-x-3 gap-y-1 text-[11px] text-gray-600 sm:grid-cols-2">
                                                                        <p>Yontem: {formatPaymentMethod(payment.method)}</p>
                                                                        <p>Para Birimi: {payment.currency || 'TRY'}</p>
                                                                        <p>Referans: {payment.reference || '-'}</p>
                                                                        <p>Kaydeden: {payment.recordedByName || '-'}</p>
                                                                        <p>
                                                                            Dekont: {payment.receiptUrl ? (
                                                                                <a
                                                                                    href={payment.receiptUrl}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="font-medium text-red-700 underline"
                                                                                >
                                                                                    Goruntule
                                                                                </a>
                                                                            ) : '-'}
                                                                        </p>
                                                                        <p>Olusturma: {payment.createdAt ? formatDate(payment.createdAt) : '-'}</p>
                                                                    </div>
                                                                    <p className="mt-1 text-[11px] text-gray-700">Not: {payment.notes || '-'}</p>
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
                            {canManageContracts && (
                                <form
                                    onSubmit={handleCreateContract}
                                    className="rounded-xl border border-gray-200 bg-white p-4"
                                >
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Yeni Sozlesme Olustur</h3>
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        <div className="xl:col-span-2">
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Sozlesme Basligi</label>
                                            <input
                                                value={contractForm.title}
                                                onChange={(event) => setContractForm((prev) => ({ ...prev, title: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                placeholder="Hizmet sozlesmesi"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Proje (opsiyonel)</label>
                                            <select
                                                value={contractForm.projectId}
                                                onChange={(event) => setContractForm((prev) => ({ ...prev, projectId: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            >
                                                <option value="">Proje sec</option>
                                                {workspace.projects.map((project) => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Durum</label>
                                            <select
                                                value={contractForm.status}
                                                onChange={(event) => setContractForm((prev) => ({
                                                    ...prev,
                                                    status: event.target.value as ContractFormState['status'],
                                                }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            >
                                                {CONTRACT_STATUS_OPTIONS.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Baslangic Tarihi</label>
                                            <input
                                                type="date"
                                                value={contractForm.startDate}
                                                onChange={(event) => setContractForm((prev) => ({ ...prev, startDate: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Bitis Tarihi</label>
                                            <input
                                                type="date"
                                                value={contractForm.endDate}
                                                onChange={(event) => setContractForm((prev) => ({ ...prev, endDate: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Deger (TRY)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={contractForm.value}
                                                onChange={(event) => setContractForm((prev) => ({ ...prev, value: event.target.value }))}
                                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="md:col-span-2 xl:col-span-3">
                                            <label className="mb-1 block text-xs font-semibold text-gray-600">Aciklama</label>
                                            <textarea
                                                rows={2}
                                                value={contractForm.description}
                                                onChange={(event) => setContractForm((prev) => ({ ...prev, description: event.target.value }))}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                placeholder="Opsiyonel sozlesme notu"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={createContractMutation.isPending}
                                            className="inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-default disabled:opacity-60"
                                        >
                                            {createContractMutation.isPending ? 'Olusturuluyor...' : 'Sozlesme Olustur'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {workspace.contracts.length === 0 && <EmptyState label="Sozlesme kaydı bulunmuyor." />}
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


