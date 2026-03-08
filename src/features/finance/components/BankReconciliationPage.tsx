import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, Landmark, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import {
    createPayment,
    deletePayment,
    getPayments,
    type PaymentItem,
    type PaymentMethod,
} from '../api/payments.api';
import { getClients } from '../../clients/api/clients.api';
import { getInvoices, type InvoiceEntity } from '../api/invoices.api';
import { exportTable, type ExportFormat } from '../utils/tableExport';

type TxChannel = 'POS' | 'EFT' | 'HAVALE';

interface ReconciliationRow {
    id: string;
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    date: string;
    amount: number;
    method: PaymentMethod | string;
    channel: TxChannel;
    reference: string;
    notes: string;
}

const CHANNEL_OPTIONS: Array<{ value: TxChannel; label: string }> = [
    { value: 'POS', label: 'POS' },
    { value: 'EFT', label: 'EFT' },
    { value: 'HAVALE', label: 'Havale' },
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

function normalizeText(value: string) {
    return value.trim().toLowerCase();
}

function isClosedInvoice(status?: string) {
    const normalized = String(status || '').toUpperCase();
    return normalized === 'PAID' || normalized === 'CANCELLED';
}

function channelToMethod(channel: TxChannel): PaymentMethod {
    if (channel === 'POS') return 'CREDIT_CARD';
    return 'BANK_TRANSFER';
}

function methodToChannel(method?: string): TxChannel {
    const normalized = String(method || '').toUpperCase();
    if (normalized === 'CREDIT_CARD') return 'POS';
    if (normalized === 'BANK_TRANSFER') return 'EFT';
    return 'HAVALE';
}

export function BankReconciliationPage() {
    const queryClient = useQueryClient();
    const userRole = useAuthStore((state) => state.user?.role);
    const role = String(userRole ?? '').toUpperCase();
    const hasAccountingRole = role === ROLES.ACCOUNTING
        || role.includes('ACCOUNTING')
        || role.includes('MUHASEBE');
    const canRead = role === ROLES.ADMIN
        || role === ROLES.MANAGER
        || role === ROLES.CEO
        || role === ROLES.SOCIAL_MEDIA
        || role === 'SEO'
        || hasAccountingRole;

    const [search, setSearch] = useState('');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
    const [form, setForm] = useState({
        invoiceId: '',
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        reference: '',
        notes: '',
        channel: 'POS' as TxChannel,
    });

    const invoicesQuery = useQuery({
        queryKey: ['bank-reconciliation-invoices'],
        queryFn: () => getInvoices({ page: 1, limit: 200 }),
        enabled: canRead,
    });
    const clientsQuery = useQuery({
        queryKey: ['bank-reconciliation-clients'],
        queryFn: () => getClients({ page: 1, limit: 200 }),
        enabled: canRead,
    });
    const paymentsQuery = useQuery({
        queryKey: ['bank-reconciliation-payments'],
        queryFn: () => getPayments({ page: 1, limit: 500 }),
        enabled: canRead,
    });

    const createMutation = useMutation({
        mutationFn: createPayment,
        onSuccess: async () => {
            toast.success('Banka hareketi kaydedildi.');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-payments'] }),
                queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-invoices'] }),
                queryClient.invalidateQueries({ queryKey: ['invoices-list'] }),
            ]);
            setForm((prev) => ({
                ...prev,
                amount: '',
                reference: '',
                notes: '',
            }));
        },
        onError: () => toast.error('Banka hareketi kaydedilemedi.'),
    });

    const deleteMutation = useMutation({
        mutationFn: deletePayment,
        onSuccess: async () => {
            toast.success('Hareket silindi.');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-payments'] }),
                queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-invoices'] }),
                queryClient.invalidateQueries({ queryKey: ['invoices-list'] }),
            ]);
        },
        onError: () => toast.error('Hareket silinemedi.'),
    });

    const clientMap = useMemo(
        () => new Map((clientsQuery.data?.data ?? []).map((client) => [client.id, client.companyName])),
        [clientsQuery.data?.data],
    );

    const invoiceMap = useMemo(
        () => new Map((invoicesQuery.data ?? []).map((invoice) => [invoice.id, invoice])),
        [invoicesQuery.data],
    );

    const openInvoices = useMemo(
        () => (invoicesQuery.data ?? []).filter((invoice) => !isClosedInvoice(invoice.status)),
        [invoicesQuery.data],
    );

    const rows = useMemo<ReconciliationRow[]>(() => (paymentsQuery.data ?? []).map((payment: PaymentItem) => {
        const invoice = invoiceMap.get(payment.invoiceId);
        const clientName = payment.clientName
            || invoice?.clientName
            || (invoice ? clientMap.get(invoice.clientId) : undefined)
            || '-';
        return {
            id: payment.id,
            invoiceId: payment.invoiceId,
            invoiceNumber: payment.invoiceNumber || invoice?.invoiceNumber || payment.invoiceId,
            clientName,
            date: payment.paymentDate || payment.createdAt,
            amount: Number(payment.amount || 0),
            method: payment.method || 'OTHER',
            channel: methodToChannel(payment.method),
            reference: payment.reference || '-',
            notes: payment.notes || '-',
        };
    }), [clientMap, invoiceMap, paymentsQuery.data]);

    const filteredRows = useMemo(() => {
        const query = normalizeText(search);
        if (!query) return rows;
        return rows.filter((row) => {
            const haystack = [
                row.invoiceNumber,
                row.clientName,
                row.reference,
                row.notes,
                row.channel,
                String(row.method),
            ].join(' ').toLowerCase();
            return haystack.includes(query);
        });
    }, [rows, search]);

    const paymentByInvoiceId = useMemo(() => {
        const map = new Map<string, number>();
        rows.forEach((row) => {
            map.set(row.invoiceId, (map.get(row.invoiceId) ?? 0) + row.amount);
        });
        return map;
    }, [rows]);

    const metrics = useMemo(() => {
        const transactionTotal = rows.reduce((sum, row) => sum + row.amount, 0);
        const positiveMatched = rows.filter((row) => row.amount > 0);
        const matchedAmount = positiveMatched.reduce((sum, row) => sum + row.amount, 0);
        const unmatchedCount = rows.filter((row) => !row.invoiceId).length;

        const invoiceOpenTotal = openInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
        const matchedInvoiceTotal = openInvoices.reduce((sum, invoice) => {
            const paid = Math.max(0, paymentByInvoiceId.get(invoice.id) ?? 0);
            return sum + Math.min(Number(invoice.total || 0), paid);
        }, 0);

        return {
            transactionTotal,
            matchedAmount,
            unmatchedCount,
            invoiceOpenTotal,
            matchedInvoiceTotal,
            difference: Math.max(0, invoiceOpenTotal - matchedInvoiceTotal),
        };
    }, [openInvoices, paymentByInvoiceId, rows]);

    async function handleExport() {
        try {
            await exportTable({
                format: exportFormat,
                fileBaseName: 'banka-pos-mutabakat',
                title: 'Banka POS Mutabakat Raporu',
                columns: [
                    { key: 'date', label: 'Tarih' },
                    { key: 'invoice', label: 'Fatura' },
                    { key: 'client', label: 'Musteri' },
                    { key: 'channel', label: 'Kanal' },
                    { key: 'amount', label: 'Tutar' },
                    { key: 'reference', label: 'Referans' },
                    { key: 'notes', label: 'Aciklama' },
                ],
                rows: filteredRows.map((row) => ({
                    date: row.date ? formatDate(row.date) : '-',
                    invoice: row.invoiceNumber,
                    client: row.clientName,
                    channel: row.channel,
                    amount: row.amount,
                    reference: row.reference,
                    notes: row.notes,
                })),
                sheetName: 'Mutabakat',
            });
        } catch {
            toast.error('Rapor disa aktarimi basarisiz oldu.');
        }
    }

    function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function submitTransaction() {
        const amount = Number(form.amount);
        if (!form.invoiceId) {
            toast.error('Fatura secimi zorunludur.');
            return;
        }
        if (!form.date || !Number.isFinite(amount) || amount <= 0) {
            toast.error('Tarih ve gecerli tutar zorunludur.');
            return;
        }

        createMutation.mutate({
            invoiceId: form.invoiceId,
            amount,
            method: channelToMethod(form.channel),
            paymentDate: form.date,
            reference: form.reference.trim() || undefined,
            notes: form.notes.trim() || undefined,
        });
    }

    function getInvoiceLabel(invoice: InvoiceEntity) {
        const clientName = clientMap.get(invoice.clientId) || invoice.clientName || invoice.clientId || '-';
        return `${invoice.invoiceNumber || invoice.id} - ${clientName}`;
    }

    if (!canRead) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<Landmark size={20} color="#DC2626" />}
                    title="Banka POS Mutabakat"
                    subtitle="Yetki kontrolu"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana erisim yetkiniz bulunmuyor.
                </section>
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<Landmark size={20} color="#DC2626" />}
                title="Banka POS Mutabakat"
                subtitle="Banka hareketlerini sistem odeme kayitlari ile canli mutabakat edin"
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Acik Fatura</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{openInvoices.length}</p>
                    <p className="text-xs text-gray-500">{formatMoney(metrics.invoiceOpenTotal)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Kayitli Hareket</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{rows.length}</p>
                    <p className="text-xs text-gray-500">{formatMoney(metrics.transactionTotal)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tahsilat</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(metrics.matchedAmount)}</p>
                    <p className="text-xs text-gray-500">Eslesmeyen hareket: {metrics.unmatchedCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Kalan Alacak</p>
                    <p className={`mt-1 text-2xl font-bold ${metrics.difference > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {formatMoney(metrics.difference)}
                    </p>
                    <p className="text-xs text-gray-500">Karsilanan: {formatMoney(metrics.matchedInvoiceTotal)}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Yeni Banka Hareketi (Kalici Kayit)</h3>
                <p className="mb-3 text-xs text-gray-500">Hareket olusturma dogrudan odeme kaydi olusturur ve faturayi gunceller.</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                    <select
                        value={form.invoiceId}
                        onChange={(event) => updateForm('invoiceId', event.target.value)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 xl:col-span-2"
                    >
                        <option value="">Fatura secin</option>
                        {openInvoices.map((invoice) => (
                            <option key={invoice.id} value={invoice.id}>
                                {getInvoiceLabel(invoice)}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={form.date}
                        onChange={(event) => updateForm('date', event.target.value)}
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.amount}
                        onChange={(event) => updateForm('amount', event.target.value)}
                        placeholder="Tutar"
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <input
                        type="text"
                        value={form.reference}
                        onChange={(event) => updateForm('reference', event.target.value)}
                        placeholder="Referans / slip no"
                        className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <select
                        value={form.channel}
                        onChange={(event) => updateForm('channel', event.target.value as TxChannel)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        {CHANNEL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={submitTransaction}
                        disabled={createMutation.isPending}
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Plus size={13} />
                        {createMutation.isPending ? 'Kaydediliyor...' : 'Ekle'}
                    </button>
                </div>
                <div className="mt-3">
                    <input
                        type="text"
                        value={form.notes}
                        onChange={(event) => updateForm('notes', event.target.value)}
                        placeholder="Aciklama / not"
                        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">Banka Hareketleri (API)</h3>
                    <div className="flex w-full max-w-3xl items-center justify-end gap-2">
                        <div className="relative w-full max-w-sm">
                            <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Hareket ara"
                                className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                        <select
                            value={exportFormat}
                            onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="csv">CSV</option>
                            <option value="xlsx">EXCEL</option>
                            <option value="pdf">PDF</option>
                            <option value="docx">WORD</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={filteredRows.length === 0}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Download size={13} />
                            {exportFormat.toUpperCase()}
                        </button>
                    </div>
                </div>

                <div className="mt-3 overflow-x-auto">
                    <table className="w-full table-fixed border-collapse text-[13px]">
                        <colgroup>
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '17%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '28%' }} />
                            <col style={{ width: '12%' }} />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tarih</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Musteri/Fatura</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Kanal</th>
                                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tutar</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Referans</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Aciklama</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsQuery.isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Hareketler yukleniyor...</td>
                                </tr>
                            )}
                            {paymentsQuery.isError && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-red-600">Hareketler yuklenemedi.</td>
                                </tr>
                            )}
                            {!paymentsQuery.isLoading && !paymentsQuery.isError && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Hareket bulunamadi.</td>
                                </tr>
                            )}
                            {filteredRows.map((row) => (
                                <tr key={row.id} className="border-b border-gray-100">
                                    <td className="px-3 py-3 text-gray-700">{row.date ? formatDate(row.date) : '-'}</td>
                                    <td className="px-3 py-3 text-gray-700">
                                        <div className="font-semibold text-gray-900">{row.invoiceNumber}</div>
                                        <div className="text-xs text-gray-500">{row.clientName}</div>
                                    </td>
                                    <td className="px-3 py-3 text-gray-700">{row.channel}</td>
                                    <td className="px-3 py-3 text-right font-semibold text-gray-900">{formatMoney(row.amount)}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.reference}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.notes}</td>
                                    <td className="px-3 py-3">
                                        <button
                                            type="button"
                                            onClick={() => deleteMutation.mutate(row.id)}
                                            disabled={deleteMutation.isPending}
                                            className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Trash2 size={12} />
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">Acik Faturalar ve Tahsilat Durumu</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse text-[13px]">
                        <colgroup>
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '24%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Fatura</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Musteri</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Vade</th>
                                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam</th>
                                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tahsilat</th>
                                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Kalan</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoicesQuery.isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Faturalar yukleniyor...</td>
                                </tr>
                            )}
                            {invoicesQuery.isError && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-red-600">Faturalar yuklenemedi.</td>
                                </tr>
                            )}
                            {!invoicesQuery.isLoading && !invoicesQuery.isError && openInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Acik fatura bulunamadi.</td>
                                </tr>
                            )}
                            {openInvoices.map((invoice) => {
                                const paid = Math.max(0, paymentByInvoiceId.get(invoice.id) ?? 0);
                                const remaining = Math.max(0, Number(invoice.total || 0) - paid);
                                const isMatched = paid > 0;
                                return (
                                    <tr key={invoice.id} className="border-b border-gray-100">
                                        <td className="px-3 py-3 font-medium text-gray-900">{invoice.invoiceNumber || invoice.id}</td>
                                        <td className="px-3 py-3 text-gray-700">{clientMap.get(invoice.clientId) || invoice.clientName || invoice.clientId || '-'}</td>
                                        <td className="px-3 py-3 text-gray-700">{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</td>
                                        <td className="px-3 py-3 text-right text-gray-900">{formatMoney(invoice.total)}</td>
                                        <td className="px-3 py-3 text-right text-emerald-700">{formatMoney(paid)}</td>
                                        <td className="px-3 py-3 text-right text-rose-700">{formatMoney(remaining)}</td>
                                        <td className="px-3 py-3">
                                            {isMatched ? (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                                    <CheckCircle2 size={12} />
                                                    Eslesti
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500">
                                                    Bekliyor
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
