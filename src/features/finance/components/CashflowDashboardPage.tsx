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
import { getCashflowOverview } from '../api/cashflow.api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

function normalizeStatus(value: string | undefined) {
  return String(value || '').toUpperCase();
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

  const overviewQuery = useQuery({
    queryKey: ['cashflow-overview', monthCount],
    queryFn: () => getCashflowOverview({ months: monthCount }),
    enabled: canRead,
  });

  const kpis = overviewQuery.data?.kpis ?? {
    totalInflow: 0,
    totalOutflow: 0,
    netCash: 0,
    outstanding: 0,
    overdueAmount: 0,
    overdueCount: 0,
    upcomingAmount: 0,
  };

  const chartData = useMemo(
    () => ({
      labels: (overviewQuery.data?.chart ?? []).map((point) => point.label),
      datasets: [
        {
          label: 'Tahsilat',
          data: (overviewQuery.data?.chart ?? []).map((point) => point.inflow),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderRadius: 6,
        },
        {
          label: 'Gider',
          data: (overviewQuery.data?.chart ?? []).map((point) => point.outflow),
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderRadius: 6,
        },
        {
          label: 'Net',
          data: (overviewQuery.data?.chart ?? []).map((point) => point.net),
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderRadius: 6,
        },
      ],
    }),
    [overviewQuery.data?.chart],
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

  const isLoading = overviewQuery.isLoading;
  const isError = overviewQuery.isError;

  const overdueInvoices = overviewQuery.data?.overdueInvoices ?? [];
  const upcomingReceivables = overviewQuery.data?.upcomingReceivables ?? [];
  const upcomingExpensePayments = overviewQuery.data?.upcomingExpensePayments ?? [];

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
              ) : upcomingExpensePayments.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-100">
                  <td className="px-2 py-2 text-gray-700">{expense.description || '-'}</td>
                  <td className="px-2 py-2 text-gray-700">{expense.department || '-'}</td>
                  <td className="px-2 py-2 text-gray-700">{expense.expenseDate ? formatDate(expense.expenseDate) : '-'}</td>
                  <td className="px-2 py-2 text-gray-700">{normalizeStatus(expense.status)}</td>
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
