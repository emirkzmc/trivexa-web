import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getClients } from '../../clients/api/clients.api';
import { getInvoices, type InvoiceEntity, type InvoiceStatus } from '../api/invoices.api';

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

    const rows = invoicesQuery.data ?? [];
    const clientMap = useMemo(
        () => new Map((clientsQuery.data?.data ?? []).map((client) => [client.id, client.companyName])),
        [clientsQuery.data?.data],
    );

    function setFilter<K extends keyof InvoiceFilters>(key: K, value: InvoiceFilters[K]) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? (value as number) : 1,
        }));
    }

    if (!canReadInvoices) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<Receipt size={20} color="#DC2626" />}
                    title="Fatura Yönetimi"
                    subtitle="Yetki kontrolü"
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
                title="Fatura Yönetimi"
                subtitle={`Sayfada ${rows.length} fatura goruntuleniyor`}
            />

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Durum</label>
                        <select
                            value={filters.status}
                            onChange={(event) => setFilter('status', event.target.value as InvoiceFilters['status'])}
                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">Tüm Durumlar</option>
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Müşteri</label>
                        <select
                            value={filters.clientId}
                            onChange={(event) => setFilter('clientId', event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">Tüm Müşteriler</option>
                            {(clientsQuery.data?.data ?? []).map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.companyName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Baslangic Tarihi</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(event) => setFilter('startDate', event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Bitis Tarihi</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(event) => setFilter('endDate', event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Sayfa Boyutu</label>
                        <select
                            value={filters.limit}
                            onChange={(event) => setFilter('limit', Number(event.target.value))}
                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-hidden">
                    <table className="w-full table-fixed border-collapse text-[13px]">
                        <colgroup>
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '18%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '8%' }} />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Fatura No</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Müşteri</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Proje</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tutar</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Duzenleme</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Vade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoicesQuery.isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Yükleniyor...</td>
                                </tr>
                            )}
                            {invoicesQuery.isError && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-red-600">Faturalar yüklenemedi.</td>
                                </tr>
                            )}
                            {!invoicesQuery.isLoading && !invoicesQuery.isError && rows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Bu filtrelere uygun fatura yok.</td>
                                </tr>
                            )}
                            {rows.map((invoice: InvoiceEntity) => (
                                <tr
                                    key={invoice.id}
                                    className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs text-gray-500">Sayfa: {filters.page}</p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilter('page', Math.max(1, filters.page - 1))}
                        disabled={filters.page <= 1 || invoicesQuery.isFetching}
                        className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:opacity-50"
                    >
                        Önceki
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
