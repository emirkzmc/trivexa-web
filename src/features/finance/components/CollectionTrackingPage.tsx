import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarCheck } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getClients } from '../../clients/api/clients.api';
import { getInvoices, type InvoiceEntity, type InvoiceStatus } from '../api/invoices.api';
import { getPaymentsByInvoice } from '../api/payments.api';

type DueState = 'PAID' | 'OVERDUE' | 'DUE_SOON' | 'OPEN';
type SortDirection = 'asc' | 'desc';
type TableSortField =
    | 'invoiceNumber'
    | 'clientName'
    | 'projectName'
    | 'total'
    | 'collected'
    | 'outstanding'
    | 'dueDate'
    | 'overdueDays'
    | 'dueState';
type TableColumnKey = TableSortField;

interface CollectionRow extends InvoiceEntity {
    collected: number;
    outstanding: number;
    overdueDays: number;
    dueState: DueState;
}

interface CollectionFilters {
    search: string;
    projectSearch: string;
    clientId: string;
    status: '' | InvoiceStatus;
    dueStart: string;
    dueEnd: string;
    onlyOverdue: boolean;
    page: number;
    limit: number;
}

interface TableColumn {
    key: TableColumnKey;
    label: string;
}

const MIN_COLUMN_WIDTH = 90;
const AUTO_MIN_COLUMN_WIDTH = 72;
const COLUMNS: TableColumn[] = [
    { key: 'invoiceNumber', label: 'Fatura' },
    { key: 'clientName', label: 'Müşteri' },
    { key: 'projectName', label: 'Proje' },
    { key: 'total', label: 'Toplam' },
    { key: 'collected', label: 'Tahsilat' },
    { key: 'outstanding', label: 'Kalan' },
    { key: 'dueDate', label: 'Vade' },
    { key: 'overdueDays', label: 'Gecikme' },
    { key: 'dueState', label: 'Durum' },
];
const INITIAL_COLUMN_WIDTHS: Record<TableColumnKey, number> = {
    invoiceNumber: 300,
    clientName: 230,
    projectName: 210,
    total: 140,
    collected: 140,
    outstanding: 140,
    dueDate: 120,
    overdueDays: 100,
    dueState: 120,
};

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function toStartOfDay(input?: string): Date | null {
    if (!input) return null;
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function getDueStateClass(state: DueState) {
    if (state === 'PAID') return 'bg-emerald-100 text-emerald-700';
    if (state === 'OVERDUE') return 'bg-rose-100 text-rose-700';
    if (state === 'DUE_SOON') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
}

function getDueStateLabel(state: DueState) {
    if (state === 'PAID') return 'Ödendi';
    if (state === 'OVERDUE') return 'Gecikmede';
    if (state === 'DUE_SOON') return 'Vadesi Yaklaşıyor';
    return 'Açılmamış';
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
    if (!active) return <ArrowUpDown size={13} className="text-gray-400" />;
    return direction === 'asc'
        ? <ArrowUp size={13} className="text-red-600" />
        : <ArrowDown size={13} className="text-red-600" />;
}

function renderCell(
    key: TableColumnKey,
    row: CollectionRow,
    clientMap: Map<string, string>,
    paymentLoading: boolean,
): ReactNode {
    if (key === 'invoiceNumber') return <p className="truncate">{row.invoiceNumber || '-'}</p>;
    if (key === 'clientName') return <p className="truncate">{row.clientName || clientMap.get(row.clientId) || '-'}</p>;
    if (key === 'projectName') return <p className="truncate">{row.projectName || '-'}</p>;
    if (key === 'total') return formatMoney(row.total);
    if (key === 'collected') return paymentLoading ? 'Hesaplanıyor...' : formatMoney(row.collected);
    if (key === 'outstanding') return paymentLoading ? 'Hesaplanıyor...' : formatMoney(row.outstanding);
    if (key === 'dueDate') return row.dueDate ? formatDate(row.dueDate) : '-';
    if (key === 'overdueDays') return row.overdueDays > 0 ? `${row.overdueDays} gün` : '-';
    return (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getDueStateClass(row.dueState)}`}>
            {getDueStateLabel(row.dueState)}
        </span>
    );
}

export function CollectionTrackingPage() {
    const navigate = useNavigate();
    const userRole = useAuthStore((state) => state.user?.role);
    const canRead = userRole === ROLES.ADMIN
        || userRole === ROLES.CEO
        || userRole === ROLES.MANAGER
        || userRole === ROLES.ACCOUNTING
        || userRole === ROLES.SOCIAL_MEDIA
        || String(userRole || '').toUpperCase() === 'SEO';

    const [filters, setFilters] = useState<CollectionFilters>({
        search: '',
        projectSearch: '',
        clientId: '',
        status: '',
        dueStart: '',
        dueEnd: '',
        onlyOverdue: false,
        page: 1,
        limit: 20,
    });
    const [sortField, setSortField] = useState<TableSortField>('overdueDays');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [columnWidths, setColumnWidths] = useState<Record<TableColumnKey, number>>(INITIAL_COLUMN_WIDTHS);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const resizeStateRef = useRef<{
        column: TableColumnKey;
        adjacentColumn: TableColumnKey;
        startX: number;
        startWidth: number;
        startAdjacentWidth: number;
    } | null>(null);

    const invoicesQuery = useQuery({
        queryKey: ['collections-invoices', filters.page, filters.limit, filters.clientId, filters.status],
        queryFn: () =>
            getInvoices({
                page: filters.page,
                limit: filters.limit,
                status: filters.status || undefined,
                clientId: filters.clientId || undefined,
            }),
        enabled: canRead,
    });
    const clientsQuery = useQuery({
        queryKey: ['collections-clients'],
        queryFn: () => getClients({ page: 1, limit: 100 }),
        enabled: canRead,
    });

    const invoiceIds = useMemo(
        () => (invoicesQuery.data ?? []).map((invoice) => invoice.id),
        [invoicesQuery.data],
    );

    const paymentSummaryQuery = useQuery({
        queryKey: ['collections-payments-summary', invoiceIds],
        queryFn: async () => {
            const summaryRows = await Promise.all(
                invoiceIds.map(async (invoiceId) => {
                    try {
                        const payments = await getPaymentsByInvoice(invoiceId);
                        const collected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
                        return [invoiceId, collected] as const;
                    } catch {
                        return [invoiceId, 0] as const;
                    }
                }),
            );
            return new Map(summaryRows);
        },
        enabled: canRead && invoiceIds.length > 0,
    });

    const clientMap = useMemo(
        () => new Map((clientsQuery.data?.data ?? []).map((client) => [client.id, client.companyName])),
        [clientsQuery.data?.data],
    );

    const rows = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueStart = toStartOfDay(filters.dueStart);
        const dueEnd = toStartOfDay(filters.dueEnd);
        const search = filters.search.trim().toLowerCase();
        const projectSearch = filters.projectSearch.trim().toLowerCase();
        const paymentMap = paymentSummaryQuery.data ?? new Map<string, number>();

        return (invoicesQuery.data ?? [])
            .map((invoice): CollectionRow => {
                const total = Number(invoice.total || 0);
                const collected = Number(paymentMap.get(invoice.id) ?? 0);
                const outstanding = Math.max(0, total - collected);
                const dueDate = toStartOfDay(invoice.dueDate);
                const overdueDays = dueDate && outstanding > 0 && dueDate.getTime() < now.getTime()
                    ? Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000)
                    : 0;

                let dueState: DueState = 'OPEN';
                if (outstanding <= 0) dueState = 'PAID';
                else if (overdueDays > 0) dueState = 'OVERDUE';
                else if (dueDate) {
                    const dueInDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86_400_000);
                    if (dueInDays <= 7) dueState = 'DUE_SOON';
                }

                return { ...invoice, collected, outstanding, overdueDays, dueState };
            })
            .filter((row) => {
                if (search) {
                    const haystack = [
                        row.invoiceNumber,
                        row.clientName || clientMap.get(row.clientId),
                        row.projectName,
                    ].join(' ').toLowerCase();
                    if (!haystack.includes(search)) return false;
                }
                if (projectSearch) {
                    const projectText = String(row.projectName || '').toLowerCase();
                    if (!projectText.includes(projectSearch)) return false;
                }
                const dueDate = toStartOfDay(row.dueDate);
                if (dueStart && (!dueDate || dueDate.getTime() < dueStart.getTime())) return false;
                if (dueEnd && (!dueDate || dueDate.getTime() > dueEnd.getTime())) return false;
                if (filters.onlyOverdue && row.overdueDays <= 0) return false;
                return true;
            });
    }, [
        clientMap,
        filters.search,
        filters.projectSearch,
        filters.dueStart,
        filters.dueEnd,
        filters.onlyOverdue,
        invoicesQuery.data,
        paymentSummaryQuery.data,
    ]);

    const sortedRows = useMemo(() => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        const dueStateOrder: Record<DueState, number> = { OVERDUE: 4, DUE_SOON: 3, OPEN: 2, PAID: 1 };

        return [...rows].sort((a, b) => {
            if (sortField === 'invoiceNumber') return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '', 'tr-TR', { sensitivity: 'base' }) * direction;
            if (sortField === 'clientName') return (a.clientName || clientMap.get(a.clientId) || '').localeCompare(b.clientName || clientMap.get(b.clientId) || '', 'tr-TR', { sensitivity: 'base' }) * direction;
            if (sortField === 'projectName') return (a.projectName || '').localeCompare(b.projectName || '', 'tr-TR', { sensitivity: 'base' }) * direction;
            if (sortField === 'total') return (a.total - b.total) * direction;
            if (sortField === 'collected') return (a.collected - b.collected) * direction;
            if (sortField === 'outstanding') return (a.outstanding - b.outstanding) * direction;
            if (sortField === 'dueDate') return ((toStartOfDay(a.dueDate)?.getTime() ?? 0) - (toStartOfDay(b.dueDate)?.getTime() ?? 0)) * direction;
            if (sortField === 'overdueDays') return (a.overdueDays - b.overdueDays) * direction;
            return (dueStateOrder[a.dueState] - dueStateOrder[b.dueState]) * direction;
        });
    }, [clientMap, rows, sortDirection, sortField]);

    const kpi = useMemo(() => {
        const totalAmount = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
        const totalCollected = rows.reduce((sum, row) => sum + row.collected, 0);
        const totalOutstanding = rows.reduce((sum, row) => sum + row.outstanding, 0);
        const overdueRows = rows.filter((row) => row.overdueDays > 0 && row.outstanding > 0);
        const overdueAmount = overdueRows.reduce((sum, row) => sum + row.outstanding, 0);
        const collectionRate = totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0;
        return { totalOutstanding, overdueCount: overdueRows.length, overdueAmount, collectionRate };
    }, [rows]);

    const resizeColumnsToContainer = useCallback((containerWidth: number) => {
        if (containerWidth <= 0) return;
        const targetTotal = Math.round(Math.max(AUTO_MIN_COLUMN_WIDTH * COLUMNS.length, containerWidth));

        setColumnWidths((prev) => {
            const prevTotal = Object.values(prev).reduce((sum, width) => sum + width, 0);
            if (prevTotal <= 0 || Math.abs(prevTotal - targetTotal) < 1) return prev;

            const ratio = targetTotal / prevTotal;
            const nextEntries = (Object.entries(prev) as Array<[TableColumnKey, number]>)
                .map(([key, width]) => [key, Math.max(AUTO_MIN_COLUMN_WIDTH, Math.round(width * ratio))] as const);
            const nextTotal = nextEntries.reduce((sum, [, width]) => sum + width, 0);
            const delta = targetTotal - nextTotal;

            if (delta !== 0) {
                const [firstKey, firstWidth] = nextEntries[0];
                nextEntries[0] = [firstKey, Math.max(AUTO_MIN_COLUMN_WIDTH, firstWidth + delta)];
            }

            const next = Object.fromEntries(nextEntries) as Record<TableColumnKey, number>;
            const unchanged = (Object.keys(prev) as TableColumnKey[]).every((key) => prev[key] === next[key]);
            return unchanged ? prev : next;
        });
    }, []);

    useEffect(() => {
        function handleMouseMove(event: MouseEvent) {
            const active = resizeStateRef.current;
            if (!active) return;

            const deltaX = event.clientX - active.startX;
            const maxShrink = active.startWidth - MIN_COLUMN_WIDTH;
            const maxGrow = active.startAdjacentWidth - MIN_COLUMN_WIDTH;
            const boundedDelta = Math.max(-maxShrink, Math.min(maxGrow, deltaX));

            const nextWidth = Math.max(MIN_COLUMN_WIDTH, active.startWidth + boundedDelta);
            const nextAdjacentWidth = Math.max(MIN_COLUMN_WIDTH, active.startAdjacentWidth - boundedDelta);

            setColumnWidths((prev) => ({
                ...prev,
                [active.column]: nextWidth,
                [active.adjacentColumn]: nextAdjacentWidth,
            }));
        }

        function stopResize() {
            if (!resizeStateRef.current) return;
            resizeStateRef.current = null;
            document.body.style.removeProperty('cursor');
            document.body.style.removeProperty('user-select');
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopResize);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopResize);
            stopResize();
        };
    }, []);

    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') return;

        const observer = new ResizeObserver((entries) => {
            const containerWidth = entries[0]?.contentRect.width ?? 0;
            resizeColumnsToContainer(containerWidth);
        });
        observer.observe(container);
        resizeColumnsToContainer(container.clientWidth);
        return () => observer.disconnect();
    }, [resizeColumnsToContainer]);

    const tableColumnPercentages = useMemo(() => {
        const total = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
        return Object.fromEntries(
            COLUMNS.map((column) => [column.key, (columnWidths[column.key] / total) * 100]),
        ) as Record<TableColumnKey, number>;
    }, [columnWidths]);

    function handleSort(field: TableSortField) {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortField(field);
        setSortDirection('asc');
    }

    function setFilter<K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? (value as number) : 1,
        }));
    }

    function handleColumnResizeStart(column: TableColumnKey, event: ReactMouseEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();
        const currentIndex = COLUMNS.findIndex((item) => item.key === column);
        const adjacentColumn = COLUMNS[currentIndex + 1]?.key;
        if (!adjacentColumn) return;

        resizeStateRef.current = {
            column,
            adjacentColumn,
            startX: event.clientX,
            startWidth: columnWidths[column],
            startAdjacentWidth: columnWidths[adjacentColumn],
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    if (!canRead) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader icon={<CalendarCheck size={20} color="#DC2626" />} title="Tahsilat Takibi" subtitle="Yetki kontrolü" />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana sadece finans erişimi olan roller girebilir.
                </section>
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarCheck size={20} color="#DC2626" />}
                title="Tahsilat Takibi"
                subtitle={`Görünen ${sortedRows.length} fatura kaydı`}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Kalan Alacak</p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">{formatMoney(kpi.totalOutstanding)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Gecikmeli Fatura</p>
                    <p className="mt-1 text-2xl font-bold text-rose-700">{kpi.overdueCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Gecikmeli Alacak</p>
                    <p className="mt-1 text-2xl font-bold text-rose-700">{formatMoney(kpi.overdueAmount)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tahsilat Oranı</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">%{kpi.collectionRate}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input type="text" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Fatura no / müşteri / proje ara" className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <input type="text" value={filters.projectSearch} onChange={(e) => setFilter('projectSearch', e.target.value)} placeholder="Proje adı filtrele" className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <select value={filters.clientId} onChange={(e) => setFilter('clientId', e.target.value)} className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
                        <option value="">Tüm Müşteriler</option>
                        {(clientsQuery.data?.data ?? []).map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}
                    </select>
                    <select value={filters.status} onChange={(e) => setFilter('status', e.target.value as CollectionFilters['status'])} className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
                        <option value="">Tüm Durumlar</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="SENT">SENT</option>
                        <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                        <option value="PAID">PAID</option>
                        <option value="OVERDUE">OVERDUE</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>
                    <input type="date" value={filters.dueStart} onChange={(e) => setFilter('dueStart', e.target.value)} className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <input type="date" value={filters.dueEnd} onChange={(e) => setFilter('dueEnd', e.target.value)} className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-700">
                        <input type="checkbox" checked={filters.onlyOverdue} onChange={(e) => setFilter('onlyOverdue', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                        Sadece gecikmeliler
                    </label>
                    <select value={filters.limit} onChange={(e) => setFilter('limit', Number(e.target.value))} className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div ref={tableContainerRef} className="overflow-x-hidden">
                    <table className="w-full table-fixed border-collapse text-[13px]">
                        <colgroup>
                            {COLUMNS.map((column) => <col key={column.key} style={{ width: `${tableColumnPercentages[column.key]}%` }} />)}
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                {COLUMNS.map((column, index) => (
                                    <th key={column.key} className="group relative px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                        <button type="button" className="flex items-center gap-1" onClick={() => handleSort(column.key)}>
                                            {column.label}
                                            <SortIcon active={sortField === column.key} direction={sortDirection} />
                                        </button>
                                        {index < COLUMNS.length - 1 && (
                                            <div
                                                role="separator"
                                                aria-orientation="vertical"
                                                aria-label={`${column.label} sütunu genişliğini değiştir`}
                                                className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                                onMouseDown={(event) => handleColumnResizeStart(column.key, event)}
                                            >
                                                <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {invoicesQuery.isLoading && <tr><td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-gray-400">Yükleniyor...</td></tr>}
                            {invoicesQuery.isError && <tr><td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-red-600">Tahsilat verileri yüklenemedi.</td></tr>}
                            {!invoicesQuery.isLoading && !invoicesQuery.isError && sortedRows.length === 0 && <tr><td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-gray-400">Bu filtrelere uygun kayıt bulunamadı.</td></tr>}
                            {sortedRows.map((row) => (
                                <tr key={row.id} onClick={() => navigate(`/app/faturalar/${row.id}`)} className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50">
                                    {COLUMNS.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-3 py-3 ${column.key === 'invoiceNumber' ? 'font-medium text-gray-900' : 'text-gray-700'} ${
                                                column.key === 'collected' ? 'text-emerald-700' : ''
                                            } ${column.key === 'outstanding' ? 'font-semibold text-amber-700' : ''} ${
                                                column.key === 'overdueDays' ? 'text-rose-700' : ''
                                            }`}
                                        >
                                            {renderCell(column.key, row, clientMap, paymentSummaryQuery.isLoading)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs text-gray-500">Sayfa: {filters.page}</p>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setFilter('page', Math.max(1, filters.page - 1))} disabled={filters.page <= 1 || invoicesQuery.isFetching} className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:opacity-50">Önceki</button>
                    <button type="button" onClick={() => setFilter('page', filters.page + 1)} disabled={(invoicesQuery.data ?? []).length < filters.limit || invoicesQuery.isFetching} className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:opacity-50">Sonraki</button>
                </div>
            </section>
        </div>
    );
}
