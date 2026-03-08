import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Download, ReceiptText, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getDepartments } from '../../departments/api/departments.api';
import {
    approveExpense,
    createExpense,
    getExpenses,
    rejectExpense,
    type ExpenseCategory,
    type ExpenseCurrency,
    type ExpenseStatus,
} from '../api/expenses.api';
import { exportTable, type ExportFormat } from '../utils/tableExport';

const CATEGORY_OPTIONS: Array<{ value: ExpenseCategory; label: string }> = [
    { value: 'OFFICE', label: 'Ofis' },
    { value: 'TRAVEL', label: 'Seyahat' },
    { value: 'SOFTWARE', label: 'Yazilim' },
    { value: 'MEALS', label: 'Yemek' },
    { value: 'OTHER', label: 'Diger' },
];
const STATUS_OPTIONS: Array<{ value: '' | ExpenseStatus; label: string }> = [
    { value: '', label: 'Tum Durumlar' },
    { value: 'PENDING', label: 'Beklemede' },
    { value: 'APPROVED', label: 'Onaylandi' },
    { value: 'REJECTED', label: 'Reddedildi' },
    { value: 'PAID', label: 'Odendi' },
];

function formatMoney(value: number, currency: string = 'TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);
}

function statusClass(status: string) {
    if (status === 'APPROVED' || status === 'PAID') return 'bg-emerald-100 text-emerald-700';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-700';
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
}

export function ExpenseManagementPage() {
    const queryClient = useQueryClient();
    const userRole = useAuthStore((state) => state.user?.role);
    const role = String(userRole ?? '').toUpperCase();
    const hasAccountingRole = role === ROLES.ACCOUNTING || role.includes('ACCOUNTING') || role.includes('MUHASEBE');
    const canRead = role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.CEO || role === ROLES.SOCIAL_MEDIA || role === 'SEO' || hasAccountingRole;
    const canCreate = role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.SOCIAL_MEDIA || role === 'SEO' || hasAccountingRole;
    const canApprove = role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.SOCIAL_MEDIA || role === 'SEO' || hasAccountingRole;

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'' | ExpenseStatus>('');
    const [categoryFilter, setCategoryFilter] = useState<'' | ExpenseCategory>('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
    const [form, setForm] = useState({
        description: '',
        amount: '',
        currency: 'TRY' as ExpenseCurrency,
        category: 'OFFICE' as ExpenseCategory,
        department: '',
        expenseDate: new Date().toISOString().slice(0, 10),
    });

    const expensesQuery = useQuery({ queryKey: ['expenses-list'], queryFn: getExpenses, enabled: canRead });
    const departmentsQuery = useQuery({
        queryKey: ['departments', 'expense-management'],
        queryFn: getDepartments,
        enabled: canRead,
    });
    const createMutation = useMutation({
        mutationFn: createExpense,
        onSuccess: async () => {
            toast.success('Gider olusturuldu.');
            await queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
            setForm((prev) => ({ ...prev, description: '', amount: '', department: '' }));
        },
        onError: () => toast.error('Gider olusturulamadi.'),
    });
    const approveMutation = useMutation({
        mutationFn: approveExpense,
        onSuccess: async () => {
            toast.success('Gider onaylandi.');
            await queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
        },
        onError: () => toast.error('Onay islemi basarisiz.'),
    });
    const rejectMutation = useMutation({
        mutationFn: rejectExpense,
        onSuccess: async () => {
            toast.success('Gider reddedildi.');
            await queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
        },
        onError: () => toast.error('Red islemi basarisiz.'),
    });

    const rows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return (expensesQuery.data ?? []).filter((row) => {
            if (statusFilter && String(row.status).toUpperCase() !== statusFilter) return false;
            if (categoryFilter && String(row.category).toUpperCase() !== categoryFilter) return false;
            if (departmentFilter && String(row.department || '').toUpperCase() !== departmentFilter.toUpperCase()) return false;
            if (!query) return true;
            const haystack = `${row.description} ${row.department} ${row.requesterName || ''} ${row.category} ${row.status}`.toLowerCase();
            return haystack.includes(query);
        });
    }, [categoryFilter, departmentFilter, expensesQuery.data, search, statusFilter]);

    const departmentOptions = useMemo(
        () => (departmentsQuery.data ?? [])
            .map((department) => department.name)
            .filter((name) => !!name)
            .sort((a, b) => a.localeCompare(b, 'tr-TR', { sensitivity: 'base' })),
        [departmentsQuery.data],
    );

    const totalAmount = useMemo(() => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0), [rows]);

    function submitCreate() {
        const amount = Number(form.amount);
        if (!form.description.trim() || !form.department.trim() || !Number.isFinite(amount) || amount <= 0) {
            toast.error('Aciklama, departman ve gecerli tutar zorunludur.');
            return;
        }
        createMutation.mutate({
            description: form.description.trim(),
            amount,
            currency: form.currency,
            category: form.category,
            department: form.department.trim(),
            expenseDate: form.expenseDate || undefined,
        });
    }

    async function handleExport() {
        try {
            await exportTable({
                format: exportFormat,
                fileBaseName: 'gider-yonetimi',
                title: 'Gider Yonetimi Raporu',
                columns: [
                    { key: 'description', label: 'Aciklama' },
                    { key: 'category', label: 'Kategori' },
                    { key: 'department', label: 'Departman' },
                    { key: 'amount', label: 'Tutar' },
                    { key: 'date', label: 'Tarih' },
                    { key: 'status', label: 'Durum' },
                ],
                rows: rows.map((row) => ({
                    description: row.description || '-',
                    category: CATEGORY_OPTIONS.find((item) => item.value === String(row.category || '').toUpperCase() as ExpenseCategory)?.label || String(row.category || '-'),
                    department: row.department || '-',
                    amount: Number(row.amount || 0),
                    date: row.expenseDate ? formatDate(row.expenseDate) : '-',
                    status: String(row.status || '').toUpperCase(),
                })),
                sheetName: 'Giderler',
            });
        } catch {
            toast.error('Rapor disa aktarimi basarisiz oldu.');
        }
    }

    if (!canRead) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader icon={<ReceiptText size={20} color="#DC2626" />} title="Gider Yonetimi" subtitle="Yetki kontrolu" />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana ADMIN, MANAGER, ACCOUNTING ve finance rolleri erisebilir.
                </section>
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader icon={<ReceiptText size={20} color="#DC2626" />} title="Gider Yonetimi" subtitle={`Toplam ${rows.length} gider`} />

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Gider Tutarı</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(totalAmount)}</p>
            </section>

            {canCreate && (
                <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-800">Yeni Gider Kaydi</p>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Aciklama" className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 xl:col-span-2" />
                        <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Tutar" className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                        <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as ExpenseCategory }))} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                        <select
                            value={form.department}
                            onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                            disabled={departmentsQuery.isLoading || departmentOptions.length === 0}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">
                                {departmentsQuery.isLoading ? 'Departmanlar yukleniyor...' : 'Departman seciniz'}
                            </option>
                            {departmentOptions.map((department) => (
                                <option key={department} value={department}>
                                    {department}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <button type="button" onClick={submitCreate} disabled={createMutation.isPending} className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{createMutation.isPending ? 'Kaydediliyor...' : 'Gider Ekle'}</button>
                    </div>
                </section>
            )}

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | ExpenseStatus)} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">{STATUS_OPTIONS.map((option) => <option key={option.value || 'ALL'} value={option.value}>{option.label}</option>)}</select>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as '' | ExpenseCategory)} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"><option value="">Tum Kategoriler</option>{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="">Tum Departmanlar</option>
                        {departmentOptions.map((department) => (
                            <option key={department} value={department}>
                                {department}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mt-3 flex justify-end gap-2">
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
                        disabled={rows.length === 0}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Download size={13} />
                        {exportFormat.toUpperCase()} Indir
                    </button>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-hidden">
                    <table className="w-full table-fixed border-collapse text-[13px]">
                        <thead><tr className="border-b border-gray-200 bg-gray-50"><th className="w-[30%] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Aciklama</th><th className="w-[12%] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Kategori</th><th className="w-[14%] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Departman</th><th className="w-[12%] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tutar</th><th className="w-[12%] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tarih</th><th className="w-[10%] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</th><th className="w-[10%] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Islem</th></tr></thead>
                        <tbody>
                            {expensesQuery.isLoading && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Yukleniyor...</td></tr>}
                            {expensesQuery.isError && <tr><td colSpan={7} className="px-4 py-10 text-center text-red-600">Giderler yuklenemedi.</td></tr>}
                            {!expensesQuery.isLoading && !expensesQuery.isError && rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Kayit bulunamadi.</td></tr>}
                            {rows.map((row) => {
                                const normalizedStatus = String(row.status || '').toUpperCase();
                                return (
                                    <tr key={row.id} className="border-b border-gray-100 transition hover:bg-gray-50">
                                        <td className="px-3 py-3 text-gray-900"><p className="truncate font-medium">{row.description}</p></td>
                                        <td className="px-3 py-3 text-gray-700">
                                            {CATEGORY_OPTIONS.find((item) => item.value === String(row.category || '').toUpperCase() as ExpenseCategory)?.label || String(row.category || '-')}
                                        </td>
                                        <td className="px-3 py-3 text-gray-700">{row.department || '-'}</td>
                                        <td className="px-3 py-3 text-gray-700">{formatMoney(Number(row.amount || 0), row.currency)}</td>
                                        <td className="px-3 py-3 text-gray-700">{row.expenseDate ? formatDate(row.expenseDate) : '-'}</td>
                                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(normalizedStatus)}`}>{normalizedStatus}</span></td>
                                        <td className="px-3 py-3">
                                            {canApprove && normalizedStatus === 'PENDING' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <button type="button" onClick={() => approveMutation.mutate(row.id)} disabled={approveMutation.isPending || rejectMutation.isPending} className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"><Check size={13} /></button>
                                                    <button type="button" onClick={() => rejectMutation.mutate(row.id)} disabled={approveMutation.isPending || rejectMutation.isPending} className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"><X size={13} /></button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
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
