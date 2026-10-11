import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getClients, getClientWorkspace } from '../../clients/api/clients.api';

type StatementMovementType = 'ALL' | 'INVOICE' | 'PAYMENT' | 'REFUND';
type StatementExportFormat = 'csv' | 'xlsx' | 'pdf' | 'docx';

interface StatementFilters {
    search: string;
    movementType: StatementMovementType;
    startDate: string;
    endDate: string;
}

interface StatementRow {
    id: string;
    invoiceId: string;
    invoiceNumber: string;
    projectName: string;
    type: Exclude<StatementMovementType, 'ALL'>;
    date: string;
    description: string;
    reference: string;
    debit: number;
    credit: number;
    signedAmount: number;
    balance: number;
}

interface StatementExportRow {
    date: string;
    movement: string;
    description: string;
    invoiceNumber: string;
    project: string;
    reference: string;
    debit: string;
    credit: string;
    balance: string;
}

function toDateValue(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toStartOfDay(value?: string): Date | null {
    const date = toDateValue(value);
    if (!date) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function toEndOfDay(value?: string): Date | null {
    const date = toDateValue(value);
    if (!date) return null;
    date.setHours(23, 59, 59, 999);
    return date;
}

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function typeClass(type: Exclude<StatementMovementType, 'ALL'>) {
    if (type === 'INVOICE') return 'bg-amber-100 text-amber-700';
    if (type === 'PAYMENT') return 'bg-emerald-100 text-emerald-700';
    return 'bg-rose-100 text-rose-700';
}

function typeLabel(type: Exclude<StatementMovementType, 'ALL'>) {
    if (type === 'INVOICE') return 'Fatura';
    if (type === 'PAYMENT') return 'Odeme';
    return 'Iade';
}

function escapeCsv(value: string | number) {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function sanitizeFileSegment(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_ ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'musteri';
}

function toStatementExportRows(rows: StatementRow[]): StatementExportRow[] {
    return rows.map((row) => ({
        date: row.date ? formatDate(row.date) : '-',
        movement: typeLabel(row.type),
        description: row.description,
        invoiceNumber: row.invoiceNumber,
        project: row.projectName,
        reference: row.reference,
        debit: row.debit > 0 ? formatMoney(row.debit) : '-',
        credit: row.credit > 0 ? formatMoney(row.credit) : '-',
        balance: formatMoney(row.balance),
    }));
}

function getStatementBaseName(clientName: string) {
    const datePart = new Date().toISOString().slice(0, 10);
    return `musteri-ekstresi-${sanitizeFileSegment(clientName)}-${datePart}`;
}

function exportStatementAsCsv(rows: StatementExportRow[], fileName: string) {
    const header = ['Tarih', 'Islem', 'Aciklama', 'Fatura No', 'Proje', 'Referans', 'Borc', 'Alacak', 'Bakiye'];
    const body = rows.map((row) => [
        row.date,
        row.movement,
        row.description,
        row.invoiceNumber,
        row.project,
        row.reference,
        row.debit,
        row.credit,
        row.balance,
    ]);

    const escaped = [header, ...body]
        .map((cols) => cols.map((value) => escapeCsv(value)).join(','))
        .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + escaped], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, fileName);
}

async function exportStatementAsExcel(rows: StatementExportRow[], fileName: string) {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(
        rows.map((row) => ({
            Tarih: row.date,
            Islem: row.movement,
            Aciklama: row.description,
            'Fatura No': row.invoiceNumber,
            Proje: row.project,
            Referans: row.reference,
            Borc: row.debit,
            Alacak: row.credit,
            Bakiye: row.balance,
        })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ekstre');
    XLSX.writeFile(workbook, fileName);
}

async function exportStatementAsPdf(clientName: string, rows: StatementExportRow[], fileName: string) {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);
    const autoTable = autoTableModule.default;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
    doc.setFontSize(13);
    doc.text(`Musteri Hesap Ekstresi - ${clientName || 'Musteri'}`, 40, 34);

    autoTable(doc, {
        startY: 48,
        head: [['Tarih', 'Islem', 'Aciklama', 'Fatura No', 'Proje', 'Referans', 'Borc', 'Alacak', 'Bakiye']],
        body: rows.map((row) => [
            row.date,
            row.movement,
            row.description,
            row.invoiceNumber,
            row.project,
            row.reference,
            row.debit,
            row.credit,
            row.balance,
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [5, 150, 105] },
    });

    doc.save(fileName);
}

async function exportStatementAsDocx(clientName: string, rows: StatementExportRow[], fileName: string) {
    const docx = await import('docx');
    const headerCells = ['Tarih', 'Islem', 'Aciklama', 'Fatura No', 'Proje', 'Referans', 'Borc', 'Alacak', 'Bakiye']
        .map((text) => new docx.TableCell({ children: [new docx.Paragraph({ text })] }));

    const dataRows = rows.map((row) => new docx.TableRow({
        children: [
            row.date,
            row.movement,
            row.description,
            row.invoiceNumber,
            row.project,
            row.reference,
            row.debit,
            row.credit,
            row.balance,
        ].map((text) => new docx.TableCell({
            children: [new docx.Paragraph({ text })],
        })),
    }));

    const table = new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        rows: [
            new docx.TableRow({ children: headerCells }),
            ...dataRows,
        ],
    });

    const document = new docx.Document({
        sections: [
            {
                children: [
                    new docx.Paragraph({
                        text: `Musteri Hesap Ekstresi - ${clientName || 'Musteri'}`,
                        heading: docx.HeadingLevel.HEADING_1,
                    }),
                    table,
                ],
            },
        ],
    });

    const blob = await docx.Packer.toBlob(document);
    downloadBlob(blob, fileName);
}

async function runStatementExport(format: StatementExportFormat, clientName: string, rows: StatementRow[]) {
    const exportRows = toStatementExportRows(rows);
    const baseName = getStatementBaseName(clientName);

    if (format === 'csv') {
        exportStatementAsCsv(exportRows, `${baseName}.csv`);
        return;
    }

    if (format === 'xlsx') {
        await exportStatementAsExcel(exportRows, `${baseName}.xlsx`);
        return;
    }

    if (format === 'pdf') {
        await exportStatementAsPdf(clientName, exportRows, `${baseName}.pdf`);
        return;
    }

    await exportStatementAsDocx(clientName, exportRows, `${baseName}.docx`);
}

export function CustomerStatementPage() {
    const navigate = useNavigate();
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

    const [selectedClientId, setSelectedClientId] = useState('');
    const [exportFormat, setExportFormat] = useState<StatementExportFormat>('csv');
    const [filters, setFilters] = useState<StatementFilters>({
        search: '',
        movementType: 'ALL',
        startDate: '',
        endDate: '',
    });

    const clientsQuery = useQuery({
        queryKey: ['statement-clients'],
        queryFn: () => getClients({ page: 1, limit: 100 }),
        enabled: canRead,
    });

    const workspaceQuery = useQuery({
        queryKey: ['client-workspace', 'statement', selectedClientId],
        queryFn: () => getClientWorkspace(selectedClientId),
        enabled: canRead && !!selectedClientId,
    });

    const clientName = useMemo(
        () => clientsQuery.data?.data.find((item) => item.id === selectedClientId)?.companyName || '',
        [clientsQuery.data?.data, selectedClientId],
    );

    const statementRows = useMemo<StatementRow[]>(() => {
        const workspace = workspaceQuery.data;
        if (!workspace) return [];

        const invoiceMap = new Map(workspace.finance.invoices.map((invoice) => [invoice.id, invoice]));
        const baseRows: Array<Omit<StatementRow, 'balance'>> = [];

        workspace.finance.invoices.forEach((invoice) => {
            const total = Number(invoice.total || 0);
            baseRows.push({
                id: `invoice-${invoice.id}`,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber || invoice.id,
                projectName: invoice.projectName || '-',
                type: 'INVOICE',
                date: invoice.issueDate || invoice.dueDate || '',
                description: 'Fatura kesildi',
                reference: '-',
                debit: total,
                credit: 0,
                signedAmount: total,
            });
        });

        workspace.finance.paymentsByInvoice.forEach((bucket) => {
            const invoice = invoiceMap.get(bucket.invoiceId);
            bucket.payments.forEach((payment) => {
                const amount = Number(payment.amount || 0);
                const absAmount = Math.abs(amount);
                const isRefund = amount < 0;

                baseRows.push({
                    id: `payment-${payment.id}`,
                    invoiceId: bucket.invoiceId,
                    invoiceNumber: invoice?.invoiceNumber || payment.invoiceId || bucket.invoiceId,
                    projectName: invoice?.projectName || '-',
                    type: isRefund ? 'REFUND' : 'PAYMENT',
                    date: payment.paymentDate || payment.createdAt || '',
                    description: isRefund ? 'Iade islemi' : 'Odeme alindi',
                    reference: payment.reference || '-',
                    debit: isRefund ? absAmount : 0,
                    credit: isRefund ? 0 : absAmount,
                    signedAmount: isRefund ? absAmount : -absAmount,
                });
            });
        });

        const sortWeight: Record<Exclude<StatementMovementType, 'ALL'>, number> = {
            INVOICE: 0,
            PAYMENT: 1,
            REFUND: 2,
        };

        baseRows.sort((left, right) => {
            const leftDate = toDateValue(left.date)?.getTime() ?? 0;
            const rightDate = toDateValue(right.date)?.getTime() ?? 0;
            if (leftDate !== rightDate) return leftDate - rightDate;
            if (left.invoiceNumber !== right.invoiceNumber) {
                return left.invoiceNumber.localeCompare(right.invoiceNumber, 'tr', { sensitivity: 'base' });
            }
            return sortWeight[left.type] - sortWeight[right.type];
        });

        let runningBalance = 0;
        return baseRows.map((row) => {
            runningBalance += row.signedAmount;
            return {
                ...row,
                balance: runningBalance,
            };
        });
    }, [workspaceQuery.data]);

    const openingBalance = useMemo(() => {
        const start = toStartOfDay(filters.startDate);
        if (!start) return 0;

        return statementRows.reduce((sum, row) => {
            const rowDate = toDateValue(row.date);
            if (!rowDate || rowDate >= start) return sum;
            return sum + row.signedAmount;
        }, 0);
    }, [filters.startDate, statementRows]);

    const filteredRows = useMemo(() => {
        const search = filters.search.trim().toLowerCase();
        const start = toStartOfDay(filters.startDate);
        const end = toEndOfDay(filters.endDate);

        return statementRows.filter((row) => {
            if (filters.movementType !== 'ALL' && row.type !== filters.movementType) return false;
            const rowDate = toDateValue(row.date);
            if (start && (!rowDate || rowDate < start)) return false;
            if (end && (!rowDate || rowDate > end)) return false;

            if (!search) return true;
            const haystack = [
                row.invoiceNumber,
                row.projectName,
                row.description,
                row.reference,
                typeLabel(row.type),
            ].join(' ').toLowerCase();
            return haystack.includes(search);
        });
    }, [filters.endDate, filters.movementType, filters.search, filters.startDate, statementRows]);

    const filteredTotals = useMemo(() => ({
        debit: filteredRows.reduce((sum, row) => sum + row.debit, 0),
        credit: filteredRows.reduce((sum, row) => sum + row.credit, 0),
    }), [filteredRows]);

    const closingBalance = filteredRows.length > 0
        ? filteredRows[filteredRows.length - 1].balance
        : openingBalance;

    function setFilter<K extends keyof StatementFilters>(key: K, value: StatementFilters[K]) {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }

    function resetFilters() {
        setFilters({
            search: '',
            movementType: 'ALL',
            startDate: '',
            endDate: '',
        });
    }

    async function handleExport() {
        if (!selectedClientId || filteredRows.length === 0) return;

        try {
            await runStatementExport(exportFormat, clientName, filteredRows);
            toast.success(`Ekstre ${exportFormat.toUpperCase()} formatinda indirildi.`, { duration: 2500 });
        } catch {
            toast.error('Ekstre disa aktarimi basarisiz oldu.', { duration: 3000 });
        }
    }

    if (!canRead) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<FileText size={20} color="#DC2626" />}
                    title="Musteri Hesap Ekstresi"
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
                icon={<FileText size={20} color="#059669" />}
                title="Musteri Hesap Ekstresi"
                subtitle={selectedClientId
                    ? `${clientName || 'Secilen musteri'} icin hareketler listelenir`
                    : 'Musteri secerek hesap hareketlerini goruntuleyin'}
                actions={(
                    <div className="inline-flex items-center gap-2">
                        <select
                            value={exportFormat}
                            onChange={(event) => setExportFormat(event.target.value as StatementExportFormat)}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm font-semibold text-gray-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="csv">CSV</option>
                            <option value="xlsx">EXCEL</option>
                            <option value="pdf">PDF</option>
                            <option value="docx">WORD</option>
                        </select>
                        <button
                            type="button"
                            disabled={filteredRows.length === 0 || !selectedClientId}
                            onClick={handleExport}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download size={14} />
                            {exportFormat.toUpperCase()} Indir
                        </button>
                    </div>
                )}
            />

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <div className="xl:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Musteri</label>
                        <select
                            value={selectedClientId}
                            onChange={(event) => setSelectedClientId(event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">Musteri secin</option>
                            {(clientsQuery.data?.data ?? []).map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.companyName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Hareket Tipi</label>
                        <select
                            value={filters.movementType}
                            onChange={(event) => setFilter('movementType', event.target.value as StatementMovementType)}
                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="ALL">Tum Islem Tipleri</option>
                            <option value="INVOICE">Fatura</option>
                            <option value="PAYMENT">Odeme</option>
                            <option value="REFUND">Iade</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Baslangic</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(event) => setFilter('startDate', event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Bitis</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(event) => setFilter('endDate', event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Arama</label>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(event) => setFilter('search', event.target.value)}
                            placeholder="Fatura / proje / referans"
                            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>
                </div>

                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Filtreleri Sifirla
                    </button>
                </div>
            </section>

            {!selectedClientId ? (
                <section className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
                    Ekstre olusturmak icin once bir musteri secin.
                </section>
            ) : workspaceQuery.isLoading ? (
                <section className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
                    Ekstre verileri yukleniyor...
                </section>
            ) : workspaceQuery.isError || !workspaceQuery.data ? (
                <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
                    Musteri ekstresi yuklenemedi.
                </section>
            ) : (
                <>
                    <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Fatura</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(workspaceQuery.data.finance.totalInvoiced)}</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Tahsilat</p>
                            <p className="mt-2 text-2xl font-bold text-emerald-700">{formatMoney(workspaceQuery.data.finance.totalCollected)}</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Devreden Bakiye</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(openingBalance)}</p>
                        </article>
                        <article className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Kapanis Bakiye</p>
                            <p className={`mt-2 text-2xl font-bold ${closingBalance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                {formatMoney(closingBalance)}
                            </p>
                        </article>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed border-collapse text-[13px]">
                                <colgroup>
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '11%' }} />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tarih</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Islem</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Aciklama</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Fatura</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Proje / Referans</th>
                                        <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Borc</th>
                                        <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Alacak</th>
                                        <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Bakiye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                                                Bu filtrelere uygun hareket bulunamadi.
                                            </td>
                                        </tr>
                                    )}

                                    {filteredRows.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100 align-top">
                                            <td className="px-3 py-3 text-gray-700">{row.date ? formatDate(row.date) : '-'}</td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeClass(row.type)}`}>
                                                    {typeLabel(row.type)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-gray-700">{row.description}</td>
                                            <td className="px-3 py-3">
                                                <button
                                                    type="button"
                                                    className="font-semibold text-red-700 hover:underline"
                                                    onClick={() => navigate(`/app/faturalar/${row.invoiceId}`)}
                                                >
                                                    {row.invoiceNumber}
                                                </button>
                                            </td>
                                            <td className="px-3 py-3 text-gray-700">
                                                <div>{row.projectName}</div>
                                                <div className="text-xs text-gray-500">{row.reference}</div>
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-700">{row.debit > 0 ? formatMoney(row.debit) : '-'}</td>
                                            <td className="px-3 py-3 text-right text-gray-700">{row.credit > 0 ? formatMoney(row.credit) : '-'}</td>
                                            <td className="px-3 py-3 text-right font-semibold text-gray-900">{formatMoney(row.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50">
                                        <td colSpan={5} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                            Filtre Toplami
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-semibold text-gray-900">{formatMoney(filteredTotals.debit)}</td>
                                        <td className="px-3 py-3 text-right text-sm font-semibold text-gray-900">{formatMoney(filteredTotals.credit)}</td>
                                        <td className="px-3 py-3 text-right text-sm font-semibold text-gray-900">{formatMoney(closingBalance)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
