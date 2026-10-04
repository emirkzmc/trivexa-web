import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, FilterX, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getClients } from '../../clients/api/clients.api';
import { getInvoices, type InvoiceEntity, type InvoiceStatus } from '../api/invoices.api';
import { exportTable, type ExportFormat } from '../utils/tableExport';

const STATUS_OPTIONS: Array<{ label: string; value: InvoiceStatus }> = [
    { label: 'DRAFT', value: 'DRAFT' },
    { label: 'SENT', value: 'SENT' },
    { label: 'PAID', value: 'PAID' },
    { label: 'PARTIALLY PAID', value: 'PARTIALLY_PAID' },
    { label: 'OVERDUE', value: 'OVERDUE' },
    { label: 'CANCELLED', value: 'CANCELLED' },
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
    if (['PAID'].includes(normalized)) return 'bg-emerald-100 text-emerald-700';
    if (['PARTIALLY_PAID', 'SENT', 'DRAFT'].includes(normalized)) return 'bg-amber-100 text-amber-700';
    if (['OVERDUE', 'CANCELLED'].includes(normalized)) return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
}

interface InvoiceFilters {
    status: '' | InvoiceStatus;
    clientId: string;
    startDate: string;
    endDate: string;
    page: number;
    limit: number;
}

type FocusPreset = 'ALL' | 'COLLECTION' | 'OVERDUE' | 'DUE_7_DAYS' | 'DRAFT';

function normalizeStatus(status?: string): string {
    return String(status || '').toUpperCase();
}

function isClosedStatus(status?: string): boolean {
    const normalized = normalizeStatus(status);
    return normalized === 'PAID' || normalized === 'CANCELLED';
}

function dueStatusSummary(invoice: InvoiceEntity): { label: string; className: string; days: number } {
    const dueDateValue = invoice.dueDate ? new Date(invoice.dueDate) : null;
    if (!dueDateValue || Number.isNaN(dueDateValue.getTime())) {
        return { label: 'Vade tanimsiz', className: 'text-gray-600', days: 0 };
    }

    const now = new Date();
    const dueDate = new Date(dueDateValue);
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor((dueDate.getTime() - now.getTime()) / 86_400_000);
    if (dayDiff < 0) {
        return { label: `${Math.abs(dayDiff)} gun gecikti`, className: 'text-rose-700', days: dayDiff };
    }
    if (dayDiff === 0) {
        return { label: 'Bugun vade', className: 'text-amber-700', days: dayDiff };
    }
    if (dayDiff <= 7) {
        return { label: `${dayDiff} gun kaldi`, className: 'text-amber-700', days: dayDiff };
    }
    return { label: `${dayDiff} gun kaldi`, className: 'text-emerald-700', days: dayDiff };
}

export function InvoicesPage() {
    const navigate = useNavigate();
    const userRole = useAuthStore((state) => state.user?.role);
    const normalizedRole = String(userRole ?? '').toUpperCase();
    const hasAccountingRole = normalizedRole === ROLES.ACCOUNTING
        || normalizedRole.includes('ACCOUNTING')
        || normalizedRole.includes('MUHASEBE');
    const canReadInvoices = normalizedRole === ROLES.ADMIN
        || normalizedRole === ROLES.MANAGER
        || normalizedRole === ROLES.SOCIAL_MEDIA
        || normalizedRole === 'SEO'
        || hasAccountingRole;
    const [focusPreset, setFocusPreset] = useState<FocusPreset>('ALL');
    const [quickSearch, setQuickSearch] = useState('');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
    const [filters, setFilters] = useState<InvoiceFilters>({
        status: '',
        clientId: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 20,
    });

    const invoicesQuery = useQuery({
        queryKey: ['invoices-list', filters],
        queryFn: () =>
            getInvoices({
                page: filters.page,
                limit: filters.limit,
                status: filters.status || undefined,
                clientId: filters.clientId || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            }),
        enabled: canReadInvoices,
    });

    const clientsQuery = useQuery({
        queryKey: ['invoice-filter-clients'],
        queryFn: () => getClients({ page: 1, limit: 100 }),
        enabled: canReadInvoices,
    });

    const rows = useMemo(() => invoicesQuery.data || [], [invoicesQuery.data]);
    const clientMap = useMemo(
        () => new Map((clientsQuery.data?.data ?? []).map((client) => [client.id, client.companyName])),
        [clientsQuery.data?.data],
    );
    const filteredRows = useMemo(() => {
        const normalizedSearch = quickSearch.trim().toLowerCase();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const next7Days = new Date(now);
        next7Days.setDate(now.getDate() + 7);

        return rows.filter((invoice) => {
            const normalized = normalizeStatus(invoice.status);
            const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
            if (dueDate && !Number.isNaN(dueDate.getTime())) {
                dueDate.setHours(0, 0, 0, 0);
            }
            const collectible = !isClosedStatus(normalized);
            const overdue = collectible && !!dueDate && dueDate.getTime() < now.getTime();
            const dueSoon = collectible && !!dueDate && dueDate.getTime() >= now.getTime() && dueDate.getTime() <= next7Days.getTime();

            if (focusPreset === 'COLLECTION' && !collectible) return false;
            if (focusPreset === 'OVERDUE' && !overdue) return false;
            if (focusPreset === 'DUE_7_DAYS' && !dueSoon) return false;
            if (focusPreset === 'DRAFT' && normalized !== 'DRAFT') return false;

            if (!normalizedSearch) return true;
            const haystack = [
                invoice.invoiceNumber || '',
                invoice.clientName || clientMap.get(invoice.clientId) || '',
                invoice.projectName || invoice.projectId || '',
                normalized,
            ].join(' ').toLowerCase();
            return haystack.includes(normalizedSearch);
        });
    }, [clientMap, focusPreset, quickSearch, rows]);

    const metrics = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const next7Days = new Date(now);
        next7Days.setDate(now.getDate() + 7);

        let totalAmount = 0;
        let collectibleAmount = 0;
        let overdueAmount = 0;
        let overdueCount = 0;
        let dueSoonAmount = 0;

        filteredRows.forEach((invoice) => {
            const total = Number(invoice.total || 0);
            totalAmount += total;

            const normalized = normalizeStatus(invoice.status);
            if (isClosedStatus(normalized)) return;

            collectibleAmount += total;
            const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
            if (!dueDate || Number.isNaN(dueDate.getTime())) return;
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate.getTime() < now.getTime()) {
                overdueCount += 1;
                overdueAmount += total;
                return;
            }
            if (dueDate.getTime() <= next7Days.getTime()) {
                dueSoonAmount += total;
            }
        });

        const collectionRate = totalAmount > 0
            ? Math.max(0, Math.round(((totalAmount - collectibleAmount) / totalAmount) * 100))
            : 0;

        return {
            totalAmount,
            collectibleAmount,
            overdueAmount,
            overdueCount,
            dueSoonAmount,
            collectionRate,
        };
    }, [filteredRows]);

    function setFilter<K extends keyof InvoiceFilters>(key: K, value: InvoiceFilters[K]) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? (value as number) : 1,
        }));
    }

    function resetFilters() {
        setQuickSearch('');
        setFocusPreset('ALL');
        setFilters({
            status: '',
            clientId: '',
            startDate: '',
            endDate: '',
            page: 1,
            limit: 20,
        });
    }

    async function exportCurrentRows() {
        try {
            await exportTable({
                format: exportFormat,
                fileBaseName: 'fatura-yonetimi',
                title: 'Fatura Yonetimi Raporu',
                columns: [
                    { key: 'invoiceNumber', label: 'Fatura No' },
                    { key: 'client', label: 'Musteri' },
                    { key: 'project', label: 'Proje' },
                    { key: 'status', label: 'Durum' },
                    { key: 'amount', label: 'Tutar' },
                    { key: 'issueDate', label: 'Duzenleme' },
                    { key: 'dueDate', label: 'Vade' },
                    { key: 'dueSummary', label: 'Vade Ozeti' },
                ],
                rows: filteredRows.map((invoice) => {
                    const dueSummary = dueStatusSummary(invoice);
                    return {
                        invoiceNumber: invoice.invoiceNumber || invoice.id,
                        client: clientMap.get(invoice.clientId) || invoice.clientName || '-',
                        project: invoice.projectName || invoice.projectId || '-',
                        status: normalizeStatus(invoice.status),
                        amount: Number(invoice.total || 0),
                        issueDate: invoice.issueDate ? formatDate(invoice.issueDate) : '-',
                        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : '-',
                        dueSummary: dueSummary.label,
                    };
                }),
                sheetName: 'Faturalar',
            });
        } catch {
            toast.error('Rapor disa aktarimi basarisiz oldu.');
        }
    }

    if (!canReadInvoices) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<Receipt size={20} color="#DC2626" />}
                    title="Fatura YÃ¶netimi"
                    subtitle="Yetki kontrolÃ¼"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana ADMIN, MANAGER, ACCOUNTING ve muhasebe rolleri erisebilir.
                </section>
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<Receipt size={20} color="#DC2626" />}
                title="Fatura YÃ¶netimi"
                subtitle={`Sayfada ${filteredRows.length} fatura goruntuleniyor`}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Fatura Tutari</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{formatMoney(metrics.totalAmount)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tahsilat Bekleyen</p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">{formatMoney(metrics.collectibleAmount)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Geciken Fatura</p>
                    <p className="mt-1 text-2xl font-bold text-rose-700">{metrics.overdueCount}</p>
                    <p className="text-xs text-rose-600">{formatMoney(metrics.overdueAmount)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tahsilat Orani (yaklasik)</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">%{metrics.collectionRate}</p>
                    <p className="text-xs text-emerald-600">7 gun: {formatMoney(metrics.dueSoonAmount)}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-2.5">
                <div className="overflow-x-auto">
                    <div className="flex min-w-max items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-500">Odak</span>
                        <button
                            type="button"
                            onClick={() => setFocusPreset('ALL')}
                            className={`inline-flex h-8 items-center rounded-md border px-2.5 text-[11px] font-semibold transition ${
                                focusPreset === 'ALL' ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Tum
                        </button>
                        <button
                            type="button"
                            onClick={() => setFocusPreset('COLLECTION')}
                            className={`inline-flex h-8 items-center rounded-md border px-2.5 text-[11px] font-semibold transition ${
                                focusPreset === 'COLLECTION' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Tahsilat
                        </button>
                        <button
                            type="button"
                            onClick={() => setFocusPreset('OVERDUE')}
                            className={`inline-flex h-8 items-center rounded-md border px-2.5 text-[11px] font-semibold transition ${
                                focusPreset === 'OVERDUE' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Geciken
                        </button>
                        <button
                            type="button"
                            onClick={() => setFocusPreset('DUE_7_DAYS')}
                            className={`inline-flex h-8 items-center rounded-md border px-2.5 text-[11px] font-semibold transition ${
                                focusPreset === 'DUE_7_DAYS' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            7 Gun
                        </button>
                        <button
                            type="button"
                            onClick={() => setFocusPreset('DRAFT')}
                            className={`inline-flex h-8 items-center rounded-md border px-2.5 text-[11px] font-semibold transition ${
                                focusPreset === 'DRAFT' ? 'border-gray-400 bg-gray-100 text-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Taslak
                        </button>

                        <div className="mx-1 h-5 w-px bg-gray-200" />

                        <input
                            type="text"
                            value={quickSearch}
                            onChange={(event) => setQuickSearch(event.target.value)}
                            placeholder="Fatura / musteri / proje"
                            aria-label="Hizli arama"
                            className="h-9 w-56 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                        <select
                            value={filters.status}
                            onChange={(event) => setFilter('status', event.target.value as InvoiceFilters['status'])}
                            aria-label="Durum"
                            className="h-9 w-36 rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">Tüm Durumlar</option>
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.clientId}
                            onChange={(event) => setFilter('clientId', event.target.value)}
                            aria-label="Musteri"
                            className="h-9 w-44 rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">Tüm Müsteriler</option>
                            {(clientsQuery.data?.data ?? []).map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.companyName}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-gray-600">Baslangic</span>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(event) => setFilter('startDate', event.target.value)}
                                aria-label="Baslangic tarihi"
                                className="h-9 w-36 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-gray-600">Bitis</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(event) => setFilter('endDate', event.target.value)}
                                aria-label="Bitis tarihi"
                                className="h-9 w-36 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>

                        <div className="mx-1 h-5 w-px bg-gray-200" />

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                            <FilterX size={13} />
                            Sifirla
                        </button>
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
                            onClick={exportCurrentRows}
                            disabled={filteredRows.length === 0}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Download size={13} />
                            {exportFormat.toUpperCase()}
                        </button>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-hidden">
                    <table className="w-full table-fixed border-collapse text-[13px]">
                        <colgroup>
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '19%' }} />
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '7%' }} />
                            <col style={{ width: '5%' }} />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Fatura No</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">MÃ¼ÅŸteri</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Proje</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tutar</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Duzenleme</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Vade</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Vade Ozeti</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoicesQuery.isLoading && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">YÃ¼kleniyor...</td>
                                </tr>
                            )}
                            {invoicesQuery.isError && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-red-600">Faturalar yÃ¼klenemedi.</td>
                                </tr>
                            )}
                            {!invoicesQuery.isLoading && !invoicesQuery.isError && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">Bu filtrelere uygun fatura yok.</td>
                                </tr>
                            )}
                            {filteredRows.map((invoice: InvoiceEntity) => (
                                <tr
                                    key={invoice.id}
                                    className={`cursor-pointer border-b border-gray-100 transition hover:bg-gray-50 ${
                                        dueStatusSummary(invoice).days < 0 && !isClosedStatus(invoice.status) ? 'bg-rose-50/40' : ''
                                    }`}
                                    onClick={() => navigate(`/app/faturalar/${invoice.id}`)}
                                >
                                    <td className="px-3 py-3 font-medium text-gray-900">
                                        {invoice.invoiceNumber || invoice.id}
                                    </td>
                                    <td className="px-3 py-3 text-gray-700">
                                        {clientMap.get(invoice.clientId) || invoice.clientId || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-gray-700">
                                        {invoice.projectName || invoice.projectId || '-'}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-gray-700">{formatMoney(invoice.total)}</td>
                                    <td className="px-3 py-3 text-gray-700">{invoice.issueDate ? formatDate(invoice.issueDate) : '-'}</td>
                                    <td className="px-3 py-3 text-gray-700">{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</td>
                                    <td className={`px-3 py-3 text-[12px] font-semibold ${dueStatusSummary(invoice).className}`}>
                                        {dueStatusSummary(invoice).label}
                                    </td>
                                    <td className="px-3 py-3">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                navigate(`/app/faturalar/${invoice.id}`);
                                            }}
                                            className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100"
                                        >
                                            Detay
                                            <ExternalLink size={11} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs text-gray-500">Sayfa: {filters.page}</p>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600">Sayfa Boyutu</label>
                        <select
                            value={filters.limit}
                            onChange={(event) => setFilter('limit', Number(event.target.value))}
                            className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilter('page', Math.max(1, filters.page - 1))}
                        disabled={filters.page <= 1 || invoicesQuery.isFetching}
                        className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:opacity-50"
                    >
                        Ã–nceki
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('page', filters.page + 1)}
                        disabled={rows.length < filters.limit || invoicesQuery.isFetching}
                        className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:opacity-50"
                    >
                        Sonraki
                    </button>
                </div>
            </section>
        </div>
    );
}




