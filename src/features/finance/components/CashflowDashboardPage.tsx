import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getExpenses, type ExpenseItem } from '../api/expenses.api';
import { getInvoices, type InvoiceEntity } from '../api/invoices.api';
import { getPaymentsByInvoice, type PaymentItem } from '../api/payments.api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type InvoiceBalanceRow = InvoiceEntity & {
    collected: number;
    outstanding: number;
    dueDateObj: Date | null;
    overdueDays: number;
};

type CashflowPoint = {
    key: string;
    label: string;
    inflow: number;
    outflow: number;
    net: number;
};

const CHART_OPTIONS: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: { position: 'top' },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const value = Number(context.raw ?? 0);
                    return `${context.dataset.label}: ${formatMoney(value)}`;
                },
            },
        },
    },
    scales: {
        x: {
            ticks: {
                maxRotation: 0,
            },
        },
        y: {
            ticks: {
                callback: (value) => formatMoney(Number(value)),
            },
        },
    },
};

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function toDateOnly(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function getMonthKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function getMonthLabel(key: string) {
    const [year, month] = key.split('-');
    return `${month}.${year}`;
}

function getRecentMonthKeys(monthCount: number) {
    const months: string[] = [];
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);

    for (let i = monthCount - 1; i >= 0; i -= 1) {
        const cursor = new Date(now);
        cursor.setMonth(now.getMonth() - i);
        months.push(getMonthKey(cursor));
    }

    return months;
}

function calcOverdueDays(dueDateObj: Date | null, outstanding: number) {
    if (!dueDateObj || outstanding <= 0) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (dueDateObj.getTime() >= now.getTime()) return 0;
    return Math.floor((now.getTime() - dueDateObj.getTime()) / 86_400_000);
}

function expenseStatus(value: string | undefined) {
    return String(value || '').toUpperCase();
}

function toPaymentListMap(rawMap?: Map<string, PaymentItem[]>) {
    if (!rawMap) return new Map<string, PaymentItem[]>();
    return rawMap;
}

export function CashflowDashboardPage() {
    const userRole = useAuthStore((state) => state.user?.role);
    const role = String(userRole || '').toUpperCase();
    const hasAccountingRole = role === ROLES.ACCOUNTING || role.includes('ACCOUNTING') || role.includes('MUHASEBE');
    const canRead = role === ROLES.ADMIN
        || role === ROLES.CEO
        || role === ROLES.MANAGER
        || role === ROLES.SOCIAL_MEDIA
        || role === 'SEO'
        || hasAccountingRole;

    const [monthCount, setMonthCount] = useState<6 | 12>(6);

    const invoicesQuery = useQuery({
        queryKey: ['cashflow-invoices'],
        queryFn: () => getInvoices({ page: 1, limit: 500 }),
        enabled: canRead,
    });

    const expensesQuery = useQuery({
        queryKey: ['cashflow-expenses'],
        queryFn: getExpenses,
        enabled: canRead,
    });

    const invoiceIds = useMemo(
        () => (invoicesQuery.data ?? []).map((invoice) => invoice.id),
        [invoicesQuery.data],
    );

    const paymentMapQuery = useQuery({
        queryKey: ['cashflow-payments-map', invoiceIds],
        queryFn: async () => {
            const rows = await Promise.all(
                invoiceIds.map(async (invoiceId) => {
                    try {
                        const payments = await getPaymentsByInvoice(invoiceId);
                        return [invoiceId, payments] as const;
                    } catch {
                        return [invoiceId, [] as PaymentItem[]] as const;
                    }
                }),
            );
            return new Map(rows);
        },
        enabled: canRead && invoiceIds.length > 0,
    });

    const paymentsMap = useMemo(
        () => toPaymentListMap(paymentMapQuery.data),
        [paymentMapQuery.data],
    );

    const balanceRows = useMemo<InvoiceBalanceRow[]>(() => {
        return (invoicesQuery.data ?? []).map((invoice) => {
            const payments = paymentsMap.get(invoice.id) ?? [];
            const collected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            const total = Number(invoice.total || 0);
            const outstanding = Math.max(0, total - collected);
            const dueDateObj = toDateOnly(invoice.dueDate);

            return {
                ...invoice,
                collected,
                outstanding,
                dueDateObj,
                overdueDays: calcOverdueDays(dueDateObj, outstanding),
            };
        });
    }, [invoicesQuery.data, paymentsMap]);

    const kpis = useMemo(() => {
        const expenses = expensesQuery.data ?? [];
        const allPayments = [...paymentsMap.values()].flat();
        const totalInflow = allPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const totalOutflow = expenses
            .filter((expense) => expenseStatus(expense.status) === 'PAID')
            .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
        const outstanding = balanceRows.reduce((sum, row) => sum + row.outstanding, 0);
        const overdueRows = balanceRows.filter((row) => row.overdueDays > 0 && row.outstanding > 0);
        const overdueAmount = overdueRows.reduce((sum, row) => sum + row.outstanding, 0);
        const upcomingAmount = balanceRows
            .filter((row) => {
                if (!row.dueDateObj || row.outstanding <= 0) return false;
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((row.dueDateObj.getTime() - now.getTime()) / 86_400_000);
                return diffDays >= 0 && diffDays <= 14;
            })
            .reduce((sum, row) => sum + row.outstanding, 0);

        return {
            totalInflow,
            totalOutflow,
            netCash: totalInflow - totalOutflow,
            outstanding,
            overdueAmount,
            overdueCount: overdueRows.length,
            upcomingAmount,
        };
    }, [balanceRows, expensesQuery.data, paymentsMap]);

    const cashflowPoints = useMemo<CashflowPoint[]>(() => {
        const monthKeys = getRecentMonthKeys(monthCount);
        const map = new Map<string, { inflow: number; outflow: number }>();
        monthKeys.forEach((key) => {
            map.set(key, { inflow: 0, outflow: 0 });
        });

        paymentsMap.forEach((payments) => {
            payments.forEach((payment) => {
                const date = toDateOnly(payment.paymentDate);
                if (!date) return;
                const key = getMonthKey(date);
                const row = map.get(key);
                if (!row) return;
                row.inflow += Number(payment.amount || 0);
            });
        });

        (expensesQuery.data ?? [])
            .filter((expense) => {
                const status = expenseStatus(expense.status);
                return status === 'PAID' || status === 'APPROVED';
            })
            .forEach((expense) => {
                const date = toDateOnly(expense.expenseDate);
                if (!date) return;
                const key = getMonthKey(date);
                const row = map.get(key);
                if (!row) return;
                row.outflow += Number(expense.amount || 0);
            });

        return monthKeys.map((key) => {
            const row = map.get(key) ?? { inflow: 0, outflow: 0 };
            return {
                key,
                label: getMonthLabel(key),
                inflow: row.inflow,
                outflow: row.outflow,
                net: row.inflow - row.outflow,
            };
        });
    }, [expensesQuery.data, monthCount, paymentsMap]);

    const overdueInvoices = useMemo(
        () =>
            balanceRows
                .filter((row) => row.overdueDays > 0 && row.outstanding > 0)
                .sort((a, b) => b.overdueDays - a.overdueDays)
                .slice(0, 8),
        [balanceRows],
    );

    const upcomingReceivables = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return balanceRows
            .filter((row) => {
                if (!row.dueDateObj || row.outstanding <= 0) return false;
                return row.dueDateObj.getTime() >= today.getTime();
            })
            .sort((a, b) => (a.dueDateObj?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueDateObj?.getTime() ?? Number.MAX_SAFE_INTEGER))
            .slice(0, 8);
    }, [balanceRows]);

    const upcomingExpensePayments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return (expensesQuery.data ?? [])
            .filter((expense) => {
                const status = expenseStatus(expense.status);
                if (status !== 'PENDING' && status !== 'APPROVED') return false;
                const expenseDate = toDateOnly(expense.expenseDate);
                if (!expenseDate) return false;
                return expenseDate.getTime() >= today.getTime();
            })
            .sort((a, b) => (toDateOnly(a.expenseDate)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (toDateOnly(b.expenseDate)?.getTime() ?? Number.MAX_SAFE_INTEGER))
            .slice(0, 8);
    }, [expensesQuery.data]);

    const chartData = useMemo(
        () => ({
            labels: cashflowPoints.map((point) => point.label),
            datasets: [
                {
                    label: 'Tahsilat',
                    data: cashflowPoints.map((point) => point.inflow),
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderRadius: 6,
                },
                {
                    label: 'Gider',
                    data: cashflowPoints.map((point) => point.outflow),
                    backgroundColor: 'rgba(239, 68, 68, 0.75)',
                    borderRadius: 6,
                },
                {
                    label: 'Net',
                    data: cashflowPoints.map((point) => point.net),
                    backgroundColor: 'rgba(59, 130, 246, 0.75)',
                    borderRadius: 6,
                },
            ],
        }),
        [cashflowPoints],
    );

    if (!canRead) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<BarChart3 size={20} color="#DC2626" />}
                    title="Nakit Akisi Dashboard"
                    subtitle="Yetki kontrolu"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana sadece finans erisimi olan roller girebilir.
                </section>
            </div>
        );
    }

    const isLoading = invoicesQuery.isLoading || expensesQuery.isLoading || paymentMapQuery.isLoading;
    const isError = invoicesQuery.isError || expensesQuery.isError;

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<BarChart3 size={20} color="#059669" />}
                title="Nakit Akisi Dashboard"
                subtitle="Tahsilat, gider ve net nakit akis gorunumu"
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Net Nakit</p>
                    <p className={`mt-1 text-2xl font-bold ${kpis.netCash >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatMoney(kpis.netCash)}
                    </p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Kalan Alacak</p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">{formatMoney(kpis.outstanding)}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Geciken Alacak</p>
                    <p className="mt-1 text-2xl font-bold text-rose-700">{formatMoney(kpis.overdueAmount)}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{kpis.overdueCount} fatura</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">14 Gun Icinde Tahsilat</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">{formatMoney(kpis.upcomingAmount)}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Aylik Nakit Akisi</h2>
                        <p className="text-xs text-gray-500">Gerceklesen tahsilat, gider ve net bakiye</p>
                    </div>
                    <select
                        value={monthCount}
                        onChange={(event) => setMonthCount(Number(event.target.value) as 6 | 12)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value={6}>Son 6 Ay</option>
                        <option value={12}>Son 12 Ay</option>
                    </select>
                </div>
                <div className="h-[340px]">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">Veriler yukleniyor...</div>
                    ) : isError ? (
                        <div className="flex h-full items-center justify-center text-sm text-red-600">Nakit akisi verileri yuklenemedi.</div>
                    ) : (
                        <Bar data={chartData} options={CHART_OPTIONS} />
                    )}
                </div>
            </section>

            <section className="mb-4 grid gap-4 xl:grid-cols-2">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Geciken Faturalar</h3>
                    <p className="mb-3 text-xs text-gray-500">Vadesi gecmis ve tahsil edilmemis kayitlar</p>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-gray-500">
                                    <th className="px-2 py-2 font-semibold">Fatura</th>
                                    <th className="px-2 py-2 font-semibold">Musteri</th>
                                    <th className="px-2 py-2 font-semibold">Vade</th>
                                    <th className="px-2 py-2 font-semibold">Gecikme</th>
                                    <th className="px-2 py-2 font-semibold">Kalan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdueInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-2 py-4 text-center text-gray-400">
                                            Geciken fatura bulunmuyor.
                                        </td>
                                    </tr>
                                ) : overdueInvoices.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-100">
                                        <td className="px-2 py-2 text-gray-700">{row.invoiceNumber || '-'}</td>
                                        <td className="px-2 py-2 text-gray-700">{row.clientName || '-'}</td>
                                        <td className="px-2 py-2 text-gray-700">{row.dueDate ? formatDate(row.dueDate) : '-'}</td>
                                        <td className="px-2 py-2 text-rose-700">{row.overdueDays} gun</td>
                                        <td className="px-2 py-2 font-semibold text-rose-700">{formatMoney(row.outstanding)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Yaklasan Tahsilatlar</h3>
                    <p className="mb-3 text-xs text-gray-500">Vadesi gelmekte olan alacaklar</p>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-gray-500">
                                    <th className="px-2 py-2 font-semibold">Fatura</th>
                                    <th className="px-2 py-2 font-semibold">Musteri</th>
                                    <th className="px-2 py-2 font-semibold">Vade</th>
                                    <th className="px-2 py-2 font-semibold">Kalan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingReceivables.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                                            Yaklasan tahsilat kaydi bulunmuyor.
                                        </td>
                                    </tr>
                                ) : upcomingReceivables.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-100">
                                        <td className="px-2 py-2 text-gray-700">{row.invoiceNumber || '-'}</td>
                                        <td className="px-2 py-2 text-gray-700">{row.clientName || '-'}</td>
                                        <td className="px-2 py-2 text-gray-700">{row.dueDate ? formatDate(row.dueDate) : '-'}</td>
                                        <td className="px-2 py-2 font-semibold text-amber-700">{formatMoney(row.outstanding)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Yaklasan Gider Odemeleri</h3>
                <p className="mb-3 text-xs text-gray-500">Beklemede veya onayda olan gider talepleri</p>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500">
                                <th className="px-2 py-2 font-semibold">Aciklama</th>
                                <th className="px-2 py-2 font-semibold">Departman</th>
                                <th className="px-2 py-2 font-semibold">Tarih</th>
                                <th className="px-2 py-2 font-semibold">Durum</th>
                                <th className="px-2 py-2 font-semibold">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingExpensePayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-2 py-4 text-center text-gray-400">
                                        Yaklasan gider odemesi bulunmuyor.
                                    </td>
                                </tr>
                            ) : upcomingExpensePayments.map((expense: ExpenseItem) => (
                                <tr key={expense.id} className="border-b border-gray-100">
                                    <td className="px-2 py-2 text-gray-700">{expense.description || '-'}</td>
                                    <td className="px-2 py-2 text-gray-700">{expense.department || '-'}</td>
                                    <td className="px-2 py-2 text-gray-700">{expense.expenseDate ? formatDate(expense.expenseDate) : '-'}</td>
                                    <td className="px-2 py-2 text-gray-700">{expenseStatus(expense.status)}</td>
                                    <td className="px-2 py-2 font-semibold text-red-700">{formatMoney(Number(expense.amount || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
