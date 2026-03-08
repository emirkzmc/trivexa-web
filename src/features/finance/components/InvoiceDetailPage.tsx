import { type FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { getClientById } from '../../clients/api/clients.api';
import { useAuthStore } from '../../auth/store/authStore';
import {
    getInvoiceById,
    updateInvoiceStatus,
    type InvoiceEntity,
    type InvoiceStatus,
} from '../api/invoices.api';
import { getProjectById } from '../../projects/api/projects.api';
import {
    createPayment,
    getPaymentAuditByInvoice,
    deletePayment,
    getPaymentsByInvoice,
    refundPayment,
    updatePayment,
    type PaymentItem,
    type PaymentAuditItem,
    type PaymentCurrency,
    type PaymentMethod,
} from '../api/payments.api';

const STATUS_OPTIONS: InvoiceStatus[] = [
    'DRAFT',
    'SENT',
    'PAID',
    'PARTIALLY_PAID',
    'OVERDUE',
    'CANCELLED',
];

const PAYMENT_METHOD_OPTIONS: Array<{ label: string; value: PaymentMethod }> = [
    { label: 'Banka Havalesi', value: 'BANK_TRANSFER' },
    { label: 'Kredi Karti', value: 'CREDIT_CARD' },
    { label: 'Nakit', value: 'CASH' },
    { label: 'Diger', value: 'OTHER' },
];

const PAYMENT_CURRENCY_OPTIONS: Array<{ label: string; value: PaymentCurrency }> = [
    { label: 'TRY', value: 'TRY' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'GBP', value: 'GBP' },
];

function statusBadgeClass(status?: string) {
    const normalized = (status ?? '').toUpperCase();
    if (['PAID'].includes(normalized)) return 'bg-emerald-100 text-emerald-700';
    if (['PARTIALLY_PAID', 'SENT', 'DRAFT'].includes(normalized)) return 'bg-amber-100 text-amber-700';
    if (['OVERDUE', 'CANCELLED'].includes(normalized)) return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
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

function formatPaymentMethod(value?: string) {
    if (!value) return '-';
    const normalized = value.toUpperCase();
    if (normalized === 'BANK_TRANSFER') return 'Banka Havalesi';
    if (normalized === 'CREDIT_CARD') return 'Kredi Karti';
    if (normalized === 'CASH') return 'Nakit';
    if (normalized === 'OTHER') return 'Diger';
    return value;
}

function formatAuditEventLabel(action?: string, eventType?: string) {
    const normalizedEvent = (eventType || '').toUpperCase();
    if (normalizedEvent === 'PAYMENT_CREATED') return 'Ödeme Olusturuldu';
    if (normalizedEvent === 'PAYMENT_UPDATED') return 'Ödeme Güncellendi';
    if (normalizedEvent === 'PAYMENT_DELETED') return 'Ödeme Silindi';
    if (normalizedEvent === 'PAYMENT_REFUND_CREATED') return 'Iade Olusturuldu';

    const normalizedAction = (action || '').toUpperCase();
    if (normalizedAction === 'CREATE') return 'Olusturma';
    if (normalizedAction === 'UPDATE') return 'Guncelleme';
    if (normalizedAction === 'DELETE') return 'Silme';
    return 'Diger Islem';
}

function toRecordValue(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
    }
    return {};
}

function toDateValue(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value?: string) {
    const parsed = toDateValue(value);
    if (!parsed) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsed);
}

function toLineRows(invoice: InvoiceEntity) {
    if (Array.isArray(invoice.items) && invoice.items.length > 0) {
        return invoice.items;
    }

    // Legacy records may not carry invoice_items in response.
    return [
        {
            id: `fallback-${invoice.id}`,
            invoiceId: invoice.id,
            description: 'Toplam tutar',
            quantity: 1,
            unitPrice: invoice.total,
            total: invoice.total,
        },
    ];
}

export function InvoiceDetailPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { invoiceId = '' } = useParams<{ invoiceId: string }>();
    const userRole = useAuthStore((state) => state.user?.role);
    const canReadInvoices = userRole === ROLES.ADMIN
        || userRole === ROLES.MANAGER
        || userRole === ROLES.ACCOUNTING
        || userRole === ROLES.SOCIAL_MEDIA
        || String(userRole || '').toUpperCase() === 'SEO';
    const canDeletePayments = userRole === ROLES.ADMIN
        || userRole === ROLES.ACCOUNTING
        || userRole === ROLES.SOCIAL_MEDIA
        || String(userRole || '').toUpperCase() === 'SEO';
    const canRefundPayments = canDeletePayments;
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
    const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>('TRY');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [paymentReference, setPaymentReference] = useState<string>('');
    const [paymentNotes, setPaymentNotes] = useState<string>('');
    const [paymentReceiptUrl, setPaymentReceiptUrl] = useState<string>('');
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [paymentSearch, setPaymentSearch] = useState<string>('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState<'ALL' | 'PAYMENT' | 'REFUND'>('ALL');
    const [paymentStartDate, setPaymentStartDate] = useState<string>('');
    const [paymentEndDate, setPaymentEndDate] = useState<string>('');
    const [refundPaymentTarget, setRefundPaymentTarget] = useState<PaymentItem | null>(null);
    const [refundAmount, setRefundAmount] = useState<string>('');
    const [refundReason, setRefundReason] = useState<string>('');
    const [refundReceiptUrl, setRefundReceiptUrl] = useState<string>('');
    const [refundPaymentDate, setRefundPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [refundApprovalConfirmed, setRefundApprovalConfirmed] = useState<boolean>(false);
    const [auditEventFilter, setAuditEventFilter] = useState<
    'ALL' | 'PAYMENT_CREATED' | 'PAYMENT_UPDATED' | 'PAYMENT_DELETED' | 'PAYMENT_REFUND_CREATED' | 'OTHER'
    >('ALL');
    const [auditStartDate, setAuditStartDate] = useState<string>('');
    const [auditEndDate, setAuditEndDate] = useState<string>('');
    const [auditUserFilter, setAuditUserFilter] = useState<string>('');
    const [auditSearchFilter, setAuditSearchFilter] = useState<string>('');
    const [expandedAuditRows, setExpandedAuditRows] = useState<string[]>([]);
    const [auditPage, setAuditPage] = useState<number>(1);
    const [auditLimit, setAuditLimit] = useState<number>(10);
    const [auditSortDirection, setAuditSortDirection] = useState<'ASC' | 'DESC'>('DESC');

    const invoiceQuery = useQuery({
        queryKey: ['invoice-detail', invoiceId],
        queryFn: () => getInvoiceById(invoiceId),
        enabled: canReadInvoices && !!invoiceId,
    });

    const clientQuery = useQuery({
        queryKey: ['invoice-detail-client', invoiceQuery.data?.clientId],
        queryFn: () => getClientById(invoiceQuery.data!.clientId),
        enabled: !!invoiceQuery.data?.clientId,
    });

    const projectQuery = useQuery({
        queryKey: ['invoice-detail-project', invoiceQuery.data?.projectId],
        queryFn: () => getProjectById(invoiceQuery.data!.projectId!),
        enabled: !!invoiceQuery.data?.projectId,
    });

    const statusMutation = useMutation({
        mutationFn: ({ status }: { status: InvoiceStatus }) =>
            updateInvoiceStatus(invoiceId, { status }),
        onSuccess: async () => {
            toast.success('Fatura durumu güncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
            await queryClient.invalidateQueries({ queryKey: ['client-workspace'] });
        },
        onError: () => {
            toast.error('Fatura durumu guncellenemedi.');
        },
    });

    function resetPaymentForm() {
        setEditingPaymentId(null);
        setPaymentAmount('');
        setPaymentMethod('BANK_TRANSFER');
        setPaymentCurrency('TRY');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentReference('');
        setPaymentNotes('');
        setPaymentReceiptUrl('');
    }

    const createPaymentMutation = useMutation({
        mutationFn: () =>
            createPayment({
                invoiceId,
                amount: Number(paymentAmount),
                currency: paymentCurrency,
                method: paymentMethod,
                paymentDate: paymentDate || undefined,
                reference: paymentReference.trim() || undefined,
                notes: paymentNotes.trim() || undefined,
                receiptUrl: paymentReceiptUrl.trim() || undefined,
            }),
        onSuccess: async () => {
            toast.success('Ödeme eklendi.');
            resetPaymentForm();
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail-payments', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
            await queryClient.invalidateQueries({ queryKey: ['client-workspace'] });
        },
        onError: () => {
            toast.error('Ödeme eklenemedi.');
        },
    });

    const updatePaymentMutation = useMutation({
        mutationFn: () =>
            updatePayment(editingPaymentId!, {
                amount: Number(paymentAmount),
                method: paymentMethod,
                paymentDate: paymentDate || undefined,
                reference: paymentReference.trim() || undefined,
                notes: paymentNotes.trim() || undefined,
                receiptUrl: paymentReceiptUrl.trim() || undefined,
            }),
        onSuccess: async () => {
            toast.success('Ödeme güncellendi.');
            resetPaymentForm();
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail-payments', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
            await queryClient.invalidateQueries({ queryKey: ['client-workspace'] });
        },
        onError: () => {
            toast.error('Ödeme guncellenemedi.');
        },
    });

    const deletePaymentMutation = useMutation({
        mutationFn: (paymentId: string) => deletePayment(paymentId),
        onSuccess: async () => {
            toast.success('Ödeme silindi.');
            resetPaymentForm();
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail-payments', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
            await queryClient.invalidateQueries({ queryKey: ['client-workspace'] });
        },
        onError: () => {
            toast.error('Ödeme silinemedi.');
        },
    });

    const refundPaymentMutation = useMutation({
        mutationFn: ({
            paymentId,
            amount,
            reason,
            receiptUrl,
            paymentDate,
        }: {
            paymentId: string;
            amount?: number;
            reason?: string;
            receiptUrl?: string;
            paymentDate?: string;
        }) =>
            refundPayment(paymentId, {
                amount,
                reason,
                receiptUrl,
                paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
            }),
        onSuccess: async () => {
            toast.success('Iade islemi olusturuldu.');
            setRefundPaymentTarget(null);
            setRefundAmount('');
            setRefundReason('');
            setRefundReceiptUrl('');
            setRefundPaymentDate(new Date().toISOString().slice(0, 10));
            setRefundApprovalConfirmed(false);
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail-payments', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
            await queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
            await queryClient.invalidateQueries({ queryKey: ['client-workspace'] });
        },
        onError: () => {
            toast.error('Iade islemi olusturulamadi.');
        },
    });

    const invoice = invoiceQuery.data;
    const paymentsQuery = useQuery({
        queryKey: ['invoice-detail-payments', invoiceId],
        queryFn: () => getPaymentsByInvoice(invoiceId),
        enabled: canReadInvoices && !!invoiceId,
    });
    const paymentAuditQuery = useQuery({
        queryKey: ['invoice-payment-audit', invoiceId, auditEventFilter, auditStartDate, auditEndDate, auditPage, auditLimit, auditSortDirection],
        queryFn: () => getPaymentAuditByInvoice(invoiceId, {
            page: auditPage,
            limit: auditLimit,
            sortDirection: auditSortDirection,
            eventType: auditEventFilter === 'ALL' ? undefined : auditEventFilter,
            startDate: auditStartDate || undefined,
            endDate: auditEndDate || undefined,
        }),
        enabled: canReadInvoices && !!invoiceId,
    });
    const lines = useMemo(() => (invoice ? toLineRows(invoice) : []), [invoice]);
    const payments = paymentsQuery.data ?? [];
    const sortedPayments = useMemo(
        () => [...payments].sort((a, b) => {
            const aTime = (toDateValue(a.paymentDate) ?? toDateValue(a.createdAt))?.getTime() ?? 0;
            const bTime = (toDateValue(b.paymentDate) ?? toDateValue(b.createdAt))?.getTime() ?? 0;
            return bTime - aTime;
        }),
        [payments],
    );
    const filteredPayments = useMemo(
        () => sortedPayments.filter((payment) => {
            const amount = Number(payment.amount || 0);
            if (paymentTypeFilter === 'PAYMENT' && amount <= 0) {
                return false;
            }
            if (paymentTypeFilter === 'REFUND' && amount >= 0) {
                return false;
            }

            if (paymentMethodFilter !== 'ALL' && (payment.method || '') !== paymentMethodFilter) {
                return false;
            }

            const paymentDateOnly = (payment.paymentDate || '').slice(0, 10);
            if (paymentStartDate && paymentDateOnly && paymentDateOnly < paymentStartDate) {
                return false;
            }
            if (paymentEndDate && paymentDateOnly && paymentDateOnly > paymentEndDate) {
                return false;
            }

            const search = paymentSearch.trim().toLowerCase();
            if (!search) return true;
            const haystack = [
                String(payment.amount ?? ''),
                payment.reference ?? '',
                payment.notes ?? '',
                payment.recordedByName ?? '',
            ].join(' ').toLowerCase();
            return haystack.includes(search);
        }),
        [sortedPayments, paymentTypeFilter, paymentMethodFilter, paymentStartDate, paymentEndDate, paymentSearch],
    );
    const lastPayment = sortedPayments[0];
    const anyPaymentMutationPending = createPaymentMutation.isPending
        || updatePaymentMutation.isPending
        || deletePaymentMutation.isPending
        || refundPaymentMutation.isPending;
    const resolvedProjectName = projectQuery.data?.name || invoice?.projectName || '-';
    const collectedAmount = useMemo(
        () => payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        [payments],
    );
    const totalPositivePayments = useMemo(
        () => payments.reduce((sum, payment) => {
            const amount = Number(payment.amount || 0);
            return amount > 0 ? sum + amount : sum;
        }, 0),
        [payments],
    );
    const totalRefunds = useMemo(
        () => Math.abs(payments.reduce((sum, payment) => {
            const amount = Number(payment.amount || 0);
            return amount < 0 ? sum + amount : sum;
        }, 0)),
        [payments],
    );
    const refundRate = useMemo(
        () => (totalPositivePayments > 0 ? (totalRefunds / totalPositivePayments) * 100 : 0),
        [totalPositivePayments, totalRefunds],
    );
    const collectionRate = useMemo(
        () => (invoice && invoice.total > 0 ? (collectedAmount / invoice.total) * 100 : 0),
        [invoice, collectedAmount],
    );
    const paymentTimeline = useMemo(() => {
        let runningCollected = 0;
        const ascending = [...sortedPayments].reverse();
        return ascending.map((payment) => {
            const amount = Number(payment.amount || 0);
            runningCollected += amount;
            return {
                ...payment,
                type: amount < 0 ? 'REFUND' : 'PAYMENT',
                runningCollected,
            };
        }).reverse();
    }, [sortedPayments]);
    const paymentAuditRows = paymentAuditQuery.data?.data ?? [];
    const paymentAuditTotal = paymentAuditQuery.data?.total ?? 0;
    const paymentAuditPageCount = Math.max(1, Math.ceil(paymentAuditTotal / auditLimit));
    const filteredPaymentAuditRows = useMemo(
        () => paymentAuditRows.filter((item) => {
            const userSearch = auditUserFilter.trim().toLowerCase();
            if (userSearch) {
                const userHaystack = `${item.userName || ''} ${item.userId || ''}`.toLowerCase();
                if (!userHaystack.includes(userSearch)) {
                    return false;
                }
            }

            const textSearch = auditSearchFilter.trim().toLowerCase();
            if (textSearch) {
                const eventTypeValue = typeof item.details?.eventType === 'string'
                    ? item.details.eventType
                    : '';
                const searchText = [
                    item.action || '',
                    eventTypeValue,
                    formatAuditEventLabel(item.action, eventTypeValue),
                    JSON.stringify(item.details || {}),
                ].join(' ').toLowerCase();
                if (!searchText.includes(textSearch)) {
                    return false;
                }
            }

            return true;
        }),
        [paymentAuditRows, auditUserFilter, auditSearchFilter],
    );
    const outstandingAmount = invoice ? Math.max(0, (invoice.total || 0) - collectedAmount) : 0;

    if (!canReadInvoices) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<Receipt size={20} color="#DC2626" />}
                    title="Fatura Detayi"
                    subtitle="Yetki kontrolü"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana sadece ADMIN, MANAGER, ACCOUNTING ve SEO (SOCIAL_MEDIA) rolleri erisebilir.
                </section>
            </div>
        );
    }

    if (!invoiceId) {
        return <div className="px-8 py-6 text-sm text-red-700">Fatura kimligi bulunamadı.</div>;
    }

    function handleSubmitPayment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const amountNumber = Number(paymentAmount);
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            toast.error('Gecerli bir ödeme tutari girin.');
            return;
        }
        if (editingPaymentId) {
            updatePaymentMutation.mutate();
            return;
        }
        createPaymentMutation.mutate();
    }

    function handleEditPayment(payment: PaymentItem) {
        const method = PAYMENT_METHOD_OPTIONS.some((option) => option.value === payment.method)
            ? (payment.method as PaymentMethod)
            : 'BANK_TRANSFER';
        const currency = PAYMENT_CURRENCY_OPTIONS.some((option) => option.value === payment.currency)
            ? (payment.currency as PaymentCurrency)
            : 'TRY';
        setEditingPaymentId(payment.id);
        setPaymentAmount(String(payment.amount ?? ''));
        setPaymentMethod(method);
        setPaymentCurrency(currency);
        setPaymentDate((payment.paymentDate || '').slice(0, 10));
        setPaymentReference(payment.reference || '');
        setPaymentNotes(payment.notes || '');
        setPaymentReceiptUrl(payment.receiptUrl || '');
    }

    function handleDeletePayment(paymentId: string) {
        const confirmed = window.confirm('Bu ödeme kaydini silmek istiyor musunuz?');
        if (!confirmed) return;
        deletePaymentMutation.mutate(paymentId);
    }

    function handleRefundPayment(payment: PaymentItem) {
        if ((payment.amount || 0) <= 0) {
            toast.error('Iade sadece pozitif ödeme kayıtları icin yapilabilir.');
            return;
        }
        setRefundPaymentTarget(payment);
        setRefundAmount(String(payment.amount));
        setRefundReason('');
        setRefundReceiptUrl('');
        setRefundPaymentDate(new Date().toISOString().slice(0, 10));
        setRefundApprovalConfirmed(false);
    }

    function closeRefundModal() {
        if (refundPaymentMutation.isPending) return;
        setRefundPaymentTarget(null);
        setRefundAmount('');
        setRefundReason('');
        setRefundReceiptUrl('');
        setRefundPaymentDate(new Date().toISOString().slice(0, 10));
        setRefundApprovalConfirmed(false);
    }

    function handleSubmitRefund(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!refundPaymentTarget) {
            return;
        }

        const maxAmount = Number(refundPaymentTarget.amount || 0);
        const parsedAmount = Number(refundAmount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > maxAmount) {
            toast.error(`Iade tutari 0 ile ${maxAmount} arasinda olmali.`);
            return;
        }

        const trimmedUrl = refundReceiptUrl.trim();
        if (trimmedUrl) {
            try {
                new URL(trimmedUrl);
            } catch {
                toast.error('Dekont URL gecersiz.');
                return;
            }
        }
        if (!refundApprovalConfirmed) {
            toast.error('Iade onayi secimini tamamlayin.');
            return;
        }

        refundPaymentMutation.mutate({
            paymentId: refundPaymentTarget.id,
            amount: parsedAmount,
            reason: refundReason.trim() || undefined,
            receiptUrl: trimmedUrl || undefined,
            paymentDate: refundPaymentDate || undefined,
        });
    }

    function toggleAuditDetails(auditId: string) {
        setExpandedAuditRows((prev) => (prev.includes(auditId)
            ? prev.filter((id) => id !== auditId)
            : [...prev, auditId]));
    }

    function renderAuditDiff(item: PaymentAuditItem) {
        const detailsRecord = toRecordValue(item.details);
        const before = toRecordValue(detailsRecord.before);
        const after = toRecordValue(detailsRecord.after);
        const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
        const changedKeys = keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));

        if (changedKeys.length === 0) {
            return (
                <p className="text-xs text-gray-500">
                    Before/after farki bulunmuyor.
                </p>
            );
        }

        return (
            <div className="space-y-1">
                {changedKeys.map((key) => (
                    <div key={`${item.id}-${key}`} className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                        <p className="font-semibold text-gray-900">{key}</p>
                        <p>Eski: {String(before[key] ?? '-')}</p>
                        <p>Yeni: {String(after[key] ?? '-')}</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<Receipt size={20} color="#DC2626" />}
                    title={invoice?.invoiceNumber || 'Fatura Detayi'}
                subtitle={invoice ? `${clientQuery.data?.companyName || invoice.clientName || '-'} - ${formatMoney(invoice.total)}` : 'Fatura verisi yükleniyor'}
                    actions={(
                        <button
                        type="button"
                        onClick={() => navigate('/app/faturalar')}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Faturalara Don
                    </button>
                )}
            />

            {invoiceQuery.isLoading ? (
                <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Fatura detaylari yükleniyor...</section>
            ) : invoiceQuery.isError || !invoice ? (
                <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-700">Fatura detayi yüklenemedi.</section>
            ) : (
                <>
                    <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-8">
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Ara Toplam</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(invoice.subtotal)}</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Vergi</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(invoice.taxAmount)}</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(invoice.total)}</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tahsil Edilen</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(collectedAmount)}</p>
                            <p className="mt-0.5 text-xs text-gray-500">Brut: {formatMoney(totalPositivePayments)} | Iade: {formatMoney(totalRefunds)}</p>
                            <p className="mt-0.5 text-xs text-gray-500">Kalan: {formatMoney(outstandingAmount)}</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Iade</p>
                            <p className="mt-1 text-2xl font-bold text-red-700">{formatMoney(totalRefunds)}</p>
                            <p className="mt-0.5 text-xs text-gray-500">Brut tahsilata göre iade toplami</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Iade Oranı</p>
                            <p className="mt-1 text-2xl font-bold text-amber-700">%{refundRate.toFixed(1)}</p>
                            <p className="mt-0.5 text-xs text-gray-500">Iade / Brut Tahsilat</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Net Tahsilat Oranı</p>
                            <p className="mt-1 text-2xl font-bold text-blue-700">%{collectionRate.toFixed(1)}</p>
                            <p className="mt-0.5 text-xs text-gray-500">Net Tahsilat / Fatura Toplami</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Son Ödeme</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(lastPayment?.amount)}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {lastPayment?.paymentDate ? formatDate(lastPayment.paymentDate) : '-'}
                            </p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(invoice.status)}`}>
                                    {invoice.status}
                                </span>
                                <select
                                    value={invoice.status}
                                    onChange={(event) => {
                                        const nextStatus = event.target.value as InvoiceStatus;
                                        if (nextStatus !== invoice.status) {
                                            statusMutation.mutate({ status: nextStatus });
                                        }
                                    }}
                                    disabled={statusMutation.isPending}
                                    className="h-7 rounded-md border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-700 outline-none focus:border-red-500"
                                >
                                    {STATUS_OPTIONS.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                    </select>
                            </div>
                        </article>
                    </section>

                    <section className="mb-4 grid gap-4 xl:grid-cols-2">
                        <article className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">Fatura Bilgileri</h2>
                            <div className="grid gap-2 text-sm">
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Fatura No</p>
                                    <p className="font-medium text-gray-900">{invoice.invoiceNumber || '-'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Müşteri</p>
                                    <p className="font-medium text-gray-900">{clientQuery.data?.companyName || invoice.clientName || '-'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Proje</p>
                                    <p className="font-medium text-gray-900">{resolvedProjectName}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Duzenleme Tarihi</p>
                                    <p className="font-medium text-gray-900">{invoice.issueDate ? formatDate(invoice.issueDate) : '-'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Vade Tarihi</p>
                                    <p className="font-medium text-gray-900">{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Vergi Oranı</p>
                                    <p className="font-medium text-gray-900">%{invoice.taxRate ?? 0}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Not</p>
                                    <p className="font-medium text-gray-900">{invoice.notes || '-'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Olusturma</p>
                                    <p className="font-medium text-gray-900">{invoice.createdAt ? formatDate(invoice.createdAt) : '-'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500">Guncelleme</p>
                                    <p className="font-medium text-gray-900">{invoice.updatedAt ? formatDate(invoice.updatedAt) : '-'}</p>
                                </div>
                            </div>
                        </article>

                        <article className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">Ödeme Gecmisi</h2>
                            <form onSubmit={handleSubmitPayment} className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                    {editingPaymentId ? 'Ödeme Duzenle' : 'Yeni Ödeme'}
                                </p>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-600">Tutar</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={paymentAmount}
                                            onChange={(event) => setPaymentAmount(event.target.value)}
                                            placeholder="0.00"
                                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            disabled={anyPaymentMutationPending}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-600">Yontem</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            disabled={anyPaymentMutationPending}
                                        >
                                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-600">Para Birimi</label>
                                        <select
                                            value={paymentCurrency}
                                            onChange={(event) => setPaymentCurrency(event.target.value as PaymentCurrency)}
                                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            disabled={anyPaymentMutationPending}
                                        >
                                            {PAYMENT_CURRENCY_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-600">Ödeme Tarihi</label>
                                        <input
                                            type="date"
                                            value={paymentDate}
                                            onChange={(event) => setPaymentDate(event.target.value)}
                                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            disabled={anyPaymentMutationPending}
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 grid gap-2">
                                    <input
                                        type="text"
                                        value={paymentReference}
                                        onChange={(event) => setPaymentReference(event.target.value)}
                                        placeholder="Referans (opsiyonel)"
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        disabled={anyPaymentMutationPending}
                                    />
                                    <input
                                        type="url"
                                        value={paymentReceiptUrl}
                                        onChange={(event) => setPaymentReceiptUrl(event.target.value)}
                                        placeholder="Dekont URL (opsiyonel)"
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        disabled={anyPaymentMutationPending}
                                    />
                                    <textarea
                                        value={paymentNotes}
                                        onChange={(event) => setPaymentNotes(event.target.value)}
                                        placeholder="Not (opsiyonel)"
                                        className="min-h-[72px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        disabled={anyPaymentMutationPending}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={resetPaymentForm}
                                        disabled={anyPaymentMutationPending}
                                        className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {editingPaymentId ? 'Vazgec' : 'Temizle'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={anyPaymentMutationPending}
                                        className="inline-flex h-9 items-center rounded-lg bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {anyPaymentMutationPending
                                            ? 'Kaydediliyor...'
                                            : editingPaymentId
                                                ? 'Degisikligi Kaydet'
                                                : 'Ödeme Ekle'}
                                    </button>
                                </div>
                            </form>
                            <div className="mb-3 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
                                <input
                                    type="text"
                                    value={paymentSearch}
                                    onChange={(event) => setPaymentSearch(event.target.value)}
                                    placeholder="Referans / not / kaydeden ara"
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                                <select
                                    value={paymentTypeFilter}
                                    onChange={(event) => setPaymentTypeFilter(event.target.value as 'ALL' | 'PAYMENT' | 'REFUND')}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                >
                                    <option value="ALL">Tüm Islemler</option>
                                    <option value="PAYMENT">Sadece Odemeler</option>
                                    <option value="REFUND">Sadece Iadeler</option>
                                </select>
                                <select
                                    value={paymentMethodFilter}
                                    onChange={(event) => setPaymentMethodFilter(event.target.value)}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                >
                                    <option value="ALL">Tüm Yontemler</option>
                                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    value={paymentStartDate}
                                    onChange={(event) => setPaymentStartDate(event.target.value)}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                                <input
                                    type="date"
                                    value={paymentEndDate}
                                    onChange={(event) => setPaymentEndDate(event.target.value)}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            {paymentsQuery.isLoading ? (
                                <p className="text-sm text-gray-500">Odemeler yükleniyor...</p>
                            ) : paymentsQuery.isError ? (
                                <p className="text-sm text-red-700">Ödeme gecmisi yüklenemedi.</p>
                            ) : filteredPayments.length === 0 ? (
                                <p className="text-sm text-gray-500">Bu fatura icin ödeme kaydı bulunmuyor.</p>
                            ) : (
                                <div className="space-y-2">
                                    {filteredPayments.map((payment) => (
                                        <div key={payment.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${Number(payment.amount) < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                                                        {formatMoney(payment.amount)}
                                                    </span>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${Number(payment.amount) < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {Number(payment.amount) < 0 ? 'IADE' : 'ODEME'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    Ödeme: {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                                                </span>
                                            </div>
                                            <div className="mt-2 grid gap-x-3 gap-y-1 text-xs text-gray-600 sm:grid-cols-2">
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
                                            <p className="mt-1 text-xs text-gray-700">
                                                Not: {payment.notes || '-'}
                                            </p>
                                            <div className="mt-2 flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditPayment(payment)}
                                                    disabled={anyPaymentMutationPending || Number(payment.amount) < 0}
                                                    className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    Duzenle
                                                </button>
                                                {canRefundPayments ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRefundPayment(payment)}
                                                        disabled={anyPaymentMutationPending || Number(payment.amount) <= 0}
                                                        className="inline-flex h-8 items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        Iade
                                                    </button>
                                                ) : null}
                                                {canDeletePayments ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                        disabled={anyPaymentMutationPending}
                                                        className="inline-flex h-8 items-center rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        Sil
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                        Islem Zaman Cizelgesi
                                    </p>
                                    <p className="text-[11px] text-gray-500">Yeni kayıtlar ustte</p>
                                </div>
                                {paymentTimeline.length === 0 ? (
                                    <p className="text-sm text-gray-500">Zaman cizelgesi olusturmak icin ödeme kaydı ekleyin.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {paymentTimeline.map((item) => (
                                            <div key={`${item.id}-timeline`} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.type === 'REFUND' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {item.type === 'REFUND' ? 'IADE' : 'ODEME'}
                                                        </span>
                                                        <span className={`font-semibold ${item.type === 'REFUND' ? 'text-red-700' : 'text-gray-900'}`}>
                                                            {formatMoney(item.amount)}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-600">
                                                        Tahsilat Etkisi: {formatMoney(item.runningCollected)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 grid gap-x-3 gap-y-1 text-xs text-gray-600 sm:grid-cols-2">
                                                    <p>Kaydeden: {item.recordedByName || '-'}</p>
                                                    <p>Islem Tarihi: {item.paymentDate ? formatDate(item.paymentDate) : '-'}</p>
                                                    <p>Sistem Kaydi: {formatDateTime(item.createdAt)}</p>
                                                    <p>Yontem: {formatPaymentMethod(item.method)}</p>
                                                    <p>Referans: {item.reference || '-'}</p>
                                                    <p>
                                                        Dekont: {item.receiptUrl ? (
                                                            <a
                                                                href={item.receiptUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="font-medium text-red-700 underline"
                                                            >
                                                                Goruntule
                                                            </a>
                                                        ) : '-'}
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-700">Not: {item.notes || '-'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                        Ödeme Audit Olaylari
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        {filteredPaymentAuditRows.length}/{paymentAuditTotal} kayıt
                                    </p>
                                </div>
                                <div className="mb-3 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 md:grid-cols-3">
                                    <select
                                        value={auditEventFilter}
                                        onChange={(event) => {
                                            setAuditEventFilter(event.target.value as 'ALL' | 'PAYMENT_CREATED' | 'PAYMENT_UPDATED' | 'PAYMENT_DELETED' | 'PAYMENT_REFUND_CREATED' | 'OTHER');
                                            setAuditPage(1);
                                        }}
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    >
                                        <option value="ALL">Tüm Eventler</option>
                                        <option value="PAYMENT_CREATED">Ödeme Olusturma</option>
                                        <option value="PAYMENT_UPDATED">Ödeme Guncelleme</option>
                                        <option value="PAYMENT_DELETED">Ödeme Silme</option>
                                        <option value="PAYMENT_REFUND_CREATED">Iade Olusturma</option>
                                        <option value="OTHER">Diger</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={auditStartDate}
                                        onChange={(event) => {
                                            setAuditStartDate(event.target.value);
                                            setAuditPage(1);
                                        }}
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                    <input
                                        type="date"
                                        value={auditEndDate}
                                        onChange={(event) => {
                                            setAuditEndDate(event.target.value);
                                            setAuditPage(1);
                                        }}
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                </div>
                                <div className="mb-3 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 md:grid-cols-3">
                                    <input
                                        type="text"
                                        value={auditUserFilter}
                                        onChange={(event) => {
                                            setAuditUserFilter(event.target.value);
                                            setAuditPage(1);
                                        }}
                                        placeholder="Kullanici ara (ad / id)"
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                    <input
                                        type="text"
                                        value={auditSearchFilter}
                                        onChange={(event) => {
                                            setAuditSearchFilter(event.target.value);
                                            setAuditPage(1);
                                        }}
                                        placeholder="Event / detay ara"
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAuditEventFilter('ALL');
                                            setAuditStartDate('');
                                            setAuditEndDate('');
                                            setAuditUserFilter('');
                                            setAuditSearchFilter('');
                                            setAuditPage(1);
                                        }}
                                        className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                    >
                                        Filtreyi Temizle
                                    </button>
                                </div>
                                <div className="mb-3 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 md:grid-cols-3">
                                    <select
                                        value={auditSortDirection}
                                        onChange={(event) => {
                                            setAuditSortDirection(event.target.value as 'ASC' | 'DESC');
                                            setAuditPage(1);
                                        }}
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    >
                                        <option value="DESC">Yeni kayıtlar ustte</option>
                                        <option value="ASC">Eski kayıtlar ustte</option>
                                    </select>
                                    <select
                                        value={auditLimit}
                                        onChange={(event) => {
                                            setAuditLimit(Number(event.target.value));
                                            setAuditPage(1);
                                        }}
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    >
                                        <option value={10}>10 / sayfa</option>
                                        <option value={20}>20 / sayfa</option>
                                        <option value={50}>50 / sayfa</option>
                                    </select>
                                    <div className="flex h-9 items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                                            disabled={auditPage <= 1}
                                            className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Geri
                                        </button>
                                        <span className="text-xs font-semibold text-gray-600">
                                            {auditPage}/{paymentAuditPageCount}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setAuditPage((prev) => Math.min(paymentAuditPageCount, prev + 1))}
                                            disabled={auditPage >= paymentAuditPageCount}
                                            className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Ileri
                                        </button>
                                    </div>
                                </div>

                                {paymentAuditQuery.isLoading ? (
                                    <p className="text-sm text-gray-500">Audit olaylari yükleniyor...</p>
                                ) : paymentAuditQuery.isError ? (
                                    <p className="text-sm text-red-700">Audit olaylari yüklenemedi.</p>
                                ) : filteredPaymentAuditRows.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        {paymentAuditTotal === 0
                                            ? 'Bu fatura icin audit olayi bulunmuyor.'
                                            : 'Filtreye uygun audit olayi bulunmuyor.'}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredPaymentAuditRows.map((item) => {
                                            const eventTypeValue = typeof item.details?.eventType === 'string'
                                                ? item.details.eventType
                                                : '';
                                            const changedFields = Array.isArray(item.details?.changedFields)
                                                ? item.details.changedFields.map((value) => String(value))
                                                : [];

                                            return (
                                                <div key={`audit-${item.id}`} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${String(item.action).toUpperCase() === 'DELETE' ? 'bg-red-100 text-red-700' : String(item.action).toUpperCase() === 'UPDATE' ? 'bg-blue-100 text-blue-700' : String(item.action).toUpperCase() === 'CREATE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {String(item.action).toUpperCase()}
                                                            </span>
                                                            <span className="font-semibold text-gray-900">
                                                                {formatAuditEventLabel(item.action, eventTypeValue)}
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-600">{formatDateTime(item.createdAt)}</span>
                                                    </div>
                                                    <div className="mt-1 grid gap-x-3 gap-y-1 text-xs text-gray-600 sm:grid-cols-2">
                                                        <p>Kullanici: {item.userName || 'Sistem'}</p>
                                                        <p>Islem Tipi: {eventTypeValue || String(item.action).toUpperCase()}</p>
                                                        {changedFields.length > 0 ? (
                                                            <p className="sm:col-span-2">
                                                                Degisen Alanlar: {changedFields.join(', ')}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleAuditDetails(item.id)}
                                                            className="inline-flex h-7 items-center rounded-md border border-gray-300 bg-white px-2.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100"
                                                        >
                                                            {expandedAuditRows.includes(item.id) ? 'Detayi Gizle' : 'Detayi Goster'}
                                                        </button>
                                                    </div>
                                                    {expandedAuditRows.includes(item.id) ? (
                                                        <div className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-white p-2">
                                                            {renderAuditDiff(item)}
                                                            <details>
                                                                <summary className="cursor-pointer text-xs font-semibold text-gray-700">
                                                                    Ham Payload
                                                                </summary>
                                                                <pre className="mt-1 max-h-44 overflow-auto rounded bg-gray-900 p-2 text-[11px] text-green-300">
                                                                    {JSON.stringify(item.details || {}, null, 2)}
                                                                </pre>
                                                            </details>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </article>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="border-b border-gray-200 px-4 py-3">
                            <h2 className="text-base font-semibold text-gray-900">Fatura Kalemleri</h2>
                        </div>
                        <div className="overflow-x-hidden">
                            <table className="w-full table-fixed border-collapse text-[13px]">
                                <colgroup>
                                    <col style={{ width: '48%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '20%' }} />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Açıklama</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Miktar</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Birim Fiyat</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-10 text-center text-gray-400">Kalem bulunamadı.</td>
                                        </tr>
                                    ) : (
                                        lines.map((line) => (
                                            <tr key={line.id} className="border-b border-gray-100">
                                                <td className="px-3 py-3 text-gray-700">{line.description || '-'}</td>
                                                <td className="px-3 py-3 text-gray-700">{line.quantity}</td>
                                                <td className="px-3 py-3 text-gray-700">{formatMoney(line.unitPrice)}</td>
                                                <td className="px-3 py-3 font-semibold text-gray-900">{formatMoney(line.total)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}

            {refundPaymentTarget ? (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
                    onClick={closeRefundModal}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Ödeme Iadesi</h3>
                                <p className="text-xs text-gray-500">
                                    Maksimum iade: {formatMoney(refundPaymentTarget.amount)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeRefundModal}
                                disabled={refundPaymentMutation.isPending}
                                className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Kapat
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRefund} className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Iade Tutari</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={refundAmount}
                                    onChange={(event) => setRefundAmount(event.target.value)}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    disabled={refundPaymentMutation.isPending}
                                />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-600">Iade Tarihi</label>
                                    <input
                                        type="date"
                                        value={refundPaymentDate}
                                        onChange={(event) => setRefundPaymentDate(event.target.value)}
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        disabled={refundPaymentMutation.isPending}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-600">Dekont URL</label>
                                    <input
                                        type="url"
                                        value={refundReceiptUrl}
                                        onChange={(event) => setRefundReceiptUrl(event.target.value)}
                                        placeholder="https://..."
                                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        disabled={refundPaymentMutation.isPending}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Iade Nedeni</label>
                                <textarea
                                    value={refundReason}
                                    onChange={(event) => setRefundReason(event.target.value)}
                                    placeholder="Iade nedeni (opsiyonel)"
                                    className="min-h-[88px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    disabled={refundPaymentMutation.isPending}
                                />
                            </div>
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                Islem negatif ödeme kaydı olusturur. Kayit tipi: iade.
                            </div>
                            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={refundApprovalConfirmed}
                                    onChange={(event) => setRefundApprovalConfirmed(event.target.checked)}
                                    disabled={refundPaymentMutation.isPending}
                                />
                                Iade onay kontrolunu yaptim ve islemi onayliyorum.
                            </label>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeRefundModal}
                                    disabled={refundPaymentMutation.isPending}
                                    className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Vazgec
                                </button>
                                <button
                                    type="submit"
                                    disabled={refundPaymentMutation.isPending || !refundApprovalConfirmed}
                                    className="inline-flex h-9 items-center rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {refundPaymentMutation.isPending ? 'Kaydediliyor...' : 'Iadeyi Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
