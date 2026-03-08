import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calculator, CheckSquare, ClipboardList, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getExpenses } from '../api/expenses.api';
import { getInvoices } from '../api/invoices.api';
import { exportTable, type ExportFormat } from '../utils/tableExport';

type PeriodPreset = 'CURRENT_MONTH' | 'LAST_MONTH' | 'CURRENT_QUARTER' | 'CUSTOM';

interface DeclarationChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

const ESTIMATED_EXPENSE_VAT_RATE: Record<string, number> = {
    OFFICE: 0.2,
    TRAVEL: 0.1,
    SOFTWARE: 0.2,
    MEALS: 0.1,
    OTHER: 0.2,
};

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function toDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function startOfMonth(base: Date) {
    return new Date(base.getFullYear(), base.getMonth(), 1);
}

function endOfMonth(base: Date) {
    return new Date(base.getFullYear(), base.getMonth() + 1, 0);
}

function startOfQuarter(base: Date) {
    const quarterStartMonth = Math.floor(base.getMonth() / 3) * 3;
    return new Date(base.getFullYear(), quarterStartMonth, 1);
}

function endOfQuarter(base: Date) {
    const quarterStartMonth = Math.floor(base.getMonth() / 3) * 3;
    return new Date(base.getFullYear(), quarterStartMonth + 3, 0);
}

function toInputDate(value: Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function normalizeInvoiceStatus(status?: string) {
    return String(status || '').toUpperCase();
}

function invoiceCanBeDeclared(status?: string) {
    const normalized = normalizeInvoiceStatus(status);
    return normalized !== 'DRAFT' && normalized !== 'CANCELLED';
}

function toNumberString(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function TaxDeclarationPrepPage() {
    const userRole = useAuthStore((state) => state.user?.role);
    const role = String(userRole ?? '').toUpperCase();
    const hasAccountingRole = role === ROLES.ACCOUNTING || role.includes('ACCOUNTING') || role.includes('MUHASEBE');
    const canRead = role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.CEO || role === 'SEO' || hasAccountingRole;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('CURRENT_MONTH');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
    const [startDate, setStartDate] = useState(toInputDate(currentMonthStart));
    const [endDate, setEndDate] = useState(toInputDate(currentMonthEnd));
    const [previousVatCredit, setPreviousVatCredit] = useState('0');
    const [withholdingCredit, setWithholdingCredit] = useState('0');
    const [otherCredit, setOtherCredit] = useState('0');
    const [checklist, setChecklist] = useState<DeclarationChecklistItem[]>([
        { id: 'docs', label: 'Fatura ve gider belgeleri tamamlandi', checked: false },
        { id: 'bank', label: 'Banka/POS mutabakati yapildi', checked: false },
        { id: 'payroll', label: 'Muhtasar ve SGK kontrol edildi', checked: false },
        { id: 'review', label: 'Mali musavir on inceleme tamamladi', checked: false },
    ]);

    const invoicesQuery = useQuery({
        queryKey: ['tax-prep-invoices'],
        queryFn: () => getInvoices({ page: 1, limit: 500 }),
        enabled: canRead,
    });
    const expensesQuery = useQuery({
        queryKey: ['tax-prep-expenses'],
        queryFn: getExpenses,
        enabled: canRead,
    });

    const periodRange = useMemo(() => {
        const base = new Date();
        if (periodPreset === 'CURRENT_MONTH') {
            return {
                start: startOfMonth(base),
                end: endOfMonth(base),
            };
        }
        if (periodPreset === 'LAST_MONTH') {
            const lastMonthBase = new Date(base.getFullYear(), base.getMonth() - 1, 1);
            return {
                start: startOfMonth(lastMonthBase),
                end: endOfMonth(lastMonthBase),
            };
        }
        if (periodPreset === 'CURRENT_QUARTER') {
            return {
                start: startOfQuarter(base),
                end: endOfQuarter(base),
            };
        }

        const customStart = toDate(startDate);
        const customEnd = toDate(endDate);
        return {
            start: customStart ?? startOfMonth(base),
            end: customEnd ?? endOfMonth(base),
        };
    }, [endDate, periodPreset, startDate]);

    const filteredInvoices = useMemo(() => (invoicesQuery.data ?? []).filter((invoice) => {
        if (!invoiceCanBeDeclared(invoice.status)) return false;
        const dateValue = toDate(invoice.issueDate || invoice.createdAt);
        if (!dateValue) return false;
        return dateValue >= periodRange.start && dateValue <= periodRange.end;
    }), [invoicesQuery.data, periodRange.end, periodRange.start]);

    const filteredExpenses = useMemo(() => (expensesQuery.data ?? []).filter((expense) => {
        const normalizedStatus = String(expense.status || '').toUpperCase();
        if (normalizedStatus === 'REJECTED') return false;
        const dateValue = toDate(expense.expenseDate || expense.createdAt);
        if (!dateValue) return false;
        return dateValue >= periodRange.start && dateValue <= periodRange.end;
    }), [expensesQuery.data, periodRange.end, periodRange.start]);

    const totals = useMemo(() => {
        const invoiceBase = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.subtotal || 0), 0);
        const outputVat = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.taxAmount || 0), 0);

        const expenseBase = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
        const estimatedInputVat = filteredExpenses.reduce((sum, expense) => {
            const category = String(expense.category || 'OTHER').toUpperCase();
            const rate = ESTIMATED_EXPENSE_VAT_RATE[category] ?? ESTIMATED_EXPENSE_VAT_RATE.OTHER;
            return sum + Number(expense.amount || 0) * rate;
        }, 0);

        const netVat = outputVat - estimatedInputVat;
        const vatToPayBeforeCredits = Math.max(0, netVat);
        const carryForwardVat = Math.max(0, -netVat);

        const credits = toNumberString(previousVatCredit) + toNumberString(withholdingCredit) + toNumberString(otherCredit);
        const finalVatPayable = Math.max(0, vatToPayBeforeCredits - credits);
        const remainingCredit = Math.max(0, credits - vatToPayBeforeCredits) + carryForwardVat;

        return {
            invoiceBase,
            outputVat,
            expenseBase,
            estimatedInputVat,
            vatToPayBeforeCredits,
            finalVatPayable,
            remainingCredit,
            credits,
        };
    }, [filteredExpenses, filteredInvoices, otherCredit, previousVatCredit, withholdingCredit]);

    const checklistProgress = useMemo(() => {
        const done = checklist.filter((item) => item.checked).length;
        return checklist.length > 0 ? Math.round((done / checklist.length) * 100) : 0;
    }, [checklist]);

    const dataWarnings = useMemo(() => {
        const missingInvoiceDate = filteredInvoices.filter((invoice) => !invoice.issueDate).length;
        const missingExpenseDoc = filteredExpenses.filter((expense) => !expense.receiptUrl).length;
        return { missingInvoiceDate, missingExpenseDoc };
    }, [filteredExpenses, filteredInvoices]);

    function applyPreset(preset: PeriodPreset) {
        setPeriodPreset(preset);
        const base = new Date();
        if (preset === 'CURRENT_MONTH') {
            setStartDate(toInputDate(startOfMonth(base)));
            setEndDate(toInputDate(endOfMonth(base)));
            return;
        }
        if (preset === 'LAST_MONTH') {
            const lastMonth = new Date(base.getFullYear(), base.getMonth() - 1, 1);
            setStartDate(toInputDate(startOfMonth(lastMonth)));
            setEndDate(toInputDate(endOfMonth(lastMonth)));
            return;
        }
        if (preset === 'CURRENT_QUARTER') {
            setStartDate(toInputDate(startOfQuarter(base)));
            setEndDate(toInputDate(endOfQuarter(base)));
        }
    }

    function toggleChecklist(id: string) {
        setChecklist((prev) => prev.map((item) => (
            item.id === id ? { ...item, checked: !item.checked } : item
        )));
    }

    async function exportDeclarationReport() {
        try {
            const rows: Array<Record<string, string | number>> = [
                { section: 'Ozet', item: 'Donem Baslangic', value: startDate },
                { section: 'Ozet', item: 'Donem Bitis', value: endDate },
                { section: 'Ozet', item: 'Fatura Matrahi', value: totals.invoiceBase },
                { section: 'Ozet', item: 'Hesaplanan KDV', value: totals.outputVat },
                { section: 'Ozet', item: 'Gider Matrahi', value: totals.expenseBase },
                { section: 'Ozet', item: 'Indirilecek KDV (Tahmini)', value: totals.estimatedInputVat },
                { section: 'Ozet', item: 'Gecmis Donem Devreden', value: toNumberString(previousVatCredit) },
                { section: 'Ozet', item: 'Tevkifat Mahsubu', value: toNumberString(withholdingCredit) },
                { section: 'Ozet', item: 'Diger Mahsup', value: toNumberString(otherCredit) },
                { section: 'Ozet', item: 'Odenecek KDV', value: totals.finalVatPayable },
                { section: 'Ozet', item: 'Sonraki Doneme Devreden', value: totals.remainingCredit },
                ...filteredInvoices.map((invoice) => ({
                    section: 'Fatura',
                    item: `${invoice.invoiceNumber || invoice.id} / ${normalizeInvoiceStatus(invoice.status)}`,
                    value: `${invoice.issueDate ? formatDate(invoice.issueDate, 'file') : '-'} | Matrah:${Number(invoice.subtotal || 0)} | KDV:${Number(invoice.taxAmount || 0)} | Toplam:${Number(invoice.total || 0)}`,
                })),
                ...filteredExpenses.map((expense) => {
                    const category = String(expense.category || 'OTHER').toUpperCase();
                    const rate = ESTIMATED_EXPENSE_VAT_RATE[category] ?? ESTIMATED_EXPENSE_VAT_RATE.OTHER;
                    return {
                        section: 'Gider',
                        item: `${expense.description || expense.id} / ${category}`,
                        value: `${expense.expenseDate ? formatDate(expense.expenseDate, 'file') : '-'} | Tutar:${Number(expense.amount || 0)} | Tahmini KDV:${Number(expense.amount || 0) * rate}`,
                    };
                }),
            ];

            await exportTable({
                format: exportFormat,
                fileBaseName: `vergi-beyan-hazirlik-${startDate}-${endDate}`,
                title: 'Vergi Beyan Hazirlik Raporu',
                columns: [
                    { key: 'section', label: 'Bolum' },
                    { key: 'item', label: 'Kayit' },
                    { key: 'value', label: 'Deger' },
                ],
                rows,
                sheetName: 'VergiBeyan',
            });
        } catch {
            toast.error('Rapor disa aktarimi basarisiz oldu.');
        }
    }

    if (!canRead) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<ClipboardList size={20} color="#DC2626" />}
                    title="Vergi Beyan Hazirlik"
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
                icon={<ClipboardList size={20} color="#DC2626" />}
                title="Vergi Beyan Hazirlik"
                subtitle="KDV beyan donemi icin on-hazirlik kontrol ve tutar ozeti"
            />

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => applyPreset('CURRENT_MONTH')} className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold ${periodPreset === 'CURRENT_MONTH' ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-gray-300 bg-white text-gray-700'}`}>Bu Ay</button>
                    <button type="button" onClick={() => applyPreset('LAST_MONTH')} className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold ${periodPreset === 'LAST_MONTH' ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-gray-300 bg-white text-gray-700'}`}>Gecen Ay</button>
                    <button type="button" onClick={() => applyPreset('CURRENT_QUARTER')} className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold ${periodPreset === 'CURRENT_QUARTER' ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-gray-300 bg-white text-gray-700'}`}>Bu Ceyrek</button>
                    <button type="button" onClick={() => setPeriodPreset('CUSTOM')} className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold ${periodPreset === 'CUSTOM' ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-gray-300 bg-white text-gray-700'}`}>Ozel</button>
                    <div className="mx-1 h-5 w-px bg-gray-200" />
                    <input type="date" value={startDate} onChange={(event) => { setPeriodPreset('CUSTOM'); setStartDate(event.target.value); }} className="h-8 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <input type="date" value={endDate} onChange={(event) => { setPeriodPreset('CUSTOM'); setEndDate(event.target.value); }} className="h-8 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <div className="mx-1 h-5 w-px bg-gray-200" />
                    <input type="number" value={previousVatCredit} onChange={(event) => setPreviousVatCredit(event.target.value)} placeholder="Devreden KDV" className="h-8 w-32 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <input type="number" value={withholdingCredit} onChange={(event) => setWithholdingCredit(event.target.value)} placeholder="Tevkifat" className="h-8 w-24 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <input type="number" value={otherCredit} onChange={(event) => setOtherCredit(event.target.value)} placeholder="Diger Mahsup" className="h-8 w-28 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <select
                        value={exportFormat}
                        onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="csv">CSV</option>
                        <option value="xlsx">EXCEL</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">WORD</option>
                    </select>
                    <button type="button" onClick={exportDeclarationReport} className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                        <Download size={13} />
                        {exportFormat.toUpperCase()}
                    </button>
                </div>
            </section>

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Hesaplanan KDV</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{formatMoney(totals.outputVat)}</p>
                    <p className="text-xs text-gray-500">Matrah: {formatMoney(totals.invoiceBase)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Indirilecek KDV (Tahmini)</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(totals.estimatedInputVat)}</p>
                    <p className="text-xs text-gray-500">Gider Matrahi: {formatMoney(totals.expenseBase)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Odenecek KDV</p>
                    <p className="mt-1 text-2xl font-bold text-rose-700">{formatMoney(totals.finalVatPayable)}</p>
                    <p className="text-xs text-gray-500">Mahsup toplam: {formatMoney(totals.credits)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Devreden Kredi</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">{formatMoney(totals.remainingCredit)}</p>
                    <p className="text-xs text-gray-500">Kontrol ilerleme: %{checklistProgress}</p>
                </article>
            </section>

            <section className="mb-4 grid gap-3 lg:grid-cols-3">
                <article className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
                    <div className="mb-2 flex items-center gap-2">
                        <Calculator size={16} className="text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-900">Beyan Onizleme</h3>
                    </div>
                    <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                            <span>Hesaplanan KDV</span>
                            <strong>{formatMoney(totals.outputVat)}</strong>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                            <span>Indirilecek KDV (Tahmini)</span>
                            <strong>{formatMoney(totals.estimatedInputVat)}</strong>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                            <span>Mahsup/Kredi Toplami</span>
                            <strong>{formatMoney(totals.credits)}</strong>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                            <span>Nihai Odenecek KDV</span>
                            <strong>{formatMoney(totals.finalVatPayable)}</strong>
                        </div>
                    </div>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <CheckSquare size={16} className="text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-900">Beyan Checklist</h3>
                    </div>
                    <div className="space-y-2">
                        {checklist.map((item) => (
                            <label key={item.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 px-2 py-2 text-xs">
                                <input type="checkbox" checked={item.checked} onChange={() => toggleChecklist(item.id)} className="mt-0.5" />
                                <span className={item.checked ? 'text-emerald-700' : 'text-gray-700'}>{item.label}</span>
                            </label>
                        ))}
                    </div>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Veri Uyarilari</h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Tarih alani eksik fatura: <strong>{dataWarnings.missingInvoiceDate}</strong>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Belgesi eksik gider: <strong>{dataWarnings.missingExpenseDoc}</strong>
                    </div>
                </div>
            </section>

            <section className="grid gap-3 xl:grid-cols-2">
                <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <header className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Donem Faturalari ({filteredInvoices.length})</h3>
                    </header>
                    <div className="max-h-80 overflow-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">No</th>
                                    <th className="px-3 py-2 text-left">Tarih</th>
                                    <th className="px-3 py-2 text-right">KDV</th>
                                    <th className="px-3 py-2 text-right">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-t border-gray-100">
                                        <td className="px-3 py-2">{invoice.invoiceNumber || invoice.id}</td>
                                        <td className="px-3 py-2">{invoice.issueDate ? formatDate(invoice.issueDate, 'file') : '-'}</td>
                                        <td className="px-3 py-2 text-right">{formatMoney(invoice.taxAmount)}</td>
                                        <td className="px-3 py-2 text-right">{formatMoney(invoice.total)}</td>
                                    </tr>
                                ))}
                                {!invoicesQuery.isLoading && filteredInvoices.length === 0 && (
                                    <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Kayit yok.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <header className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Donem Giderleri ({filteredExpenses.length})</h3>
                    </header>
                    <div className="max-h-80 overflow-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">Aciklama</th>
                                    <th className="px-3 py-2 text-left">Kategori</th>
                                    <th className="px-3 py-2 text-right">Tutar</th>
                                    <th className="px-3 py-2 text-right">Tahmini KDV</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map((expense) => {
                                    const category = String(expense.category || 'OTHER').toUpperCase();
                                    const rate = ESTIMATED_EXPENSE_VAT_RATE[category] ?? ESTIMATED_EXPENSE_VAT_RATE.OTHER;
                                    return (
                                        <tr key={expense.id} className="border-t border-gray-100">
                                            <td className="px-3 py-2">{expense.description || expense.id}</td>
                                            <td className="px-3 py-2">{category}</td>
                                            <td className="px-3 py-2 text-right">{formatMoney(expense.amount)}</td>
                                            <td className="px-3 py-2 text-right">{formatMoney(Number(expense.amount || 0) * rate)}</td>
                                        </tr>
                                    );
                                })}
                                {!expensesQuery.isLoading && filteredExpenses.length === 0 && (
                                    <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Kayit yok.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>
            </section>
        </div>
    );
}
