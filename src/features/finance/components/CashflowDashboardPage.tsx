import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, CalendarCheck, Clock, Download, Receipt } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { getClients } from '../../clients/api/clients.api';
import { getCashflowOverview } from '../api/cashflow.api';
import { exportTable, type ExportFormat } from '../utils/tableExport';

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
  const navigate = useNavigate();
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
  const [clientFilter, setClientFilter] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  const overviewQuery = useQuery({
    queryKey: ['cashflow-overview', monthCount],
    queryFn: () => getCashflowOverview({ months: monthCount }),
    enabled: canRead,
  });
  const clientsQuery = useQuery({
    queryKey: ['cashflow-dashboard-clients'],
    queryFn: () => getClients({ page: 1, limit: 100 }),
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

  const isLoading = overviewQuery.isLoading;
  const isError = overviewQuery.isError;

  const overdueInvoices = useMemo(() => overviewQuery.data?.overdueInvoices || [], [overviewQuery.data?.overdueInvoices]);
  const upcomingReceivables = useMemo(() => overviewQuery.data?.upcomingReceivables || [], [overviewQuery.data?.upcomingReceivables]);
  const upcomingExpensePayments = useMemo(() => overviewQuery.data?.upcomingExpensePayments || [], [overviewQuery.data?.upcomingExpensePayments]);
  const normalizedClientFilter = clientFilter.trim().toLocaleLowerCase('tr-TR');

  const clientOptions = useMemo(() => {
    const options = new Set<string>();
    (clientsQuery.data?.data ?? []).forEach((client) => {
      if (client.companyName) options.add(client.companyName);
    });
    overdueInvoices.forEach((row) => {
      if (row.clientName) options.add(row.clientName);
    });
    upcomingReceivables.forEach((row) => {
      if (row.clientName) options.add(row.clientName);
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [clientsQuery.data?.data, overdueInvoices, upcomingReceivables]);

  const filteredOverdueInvoices = useMemo(
    () => overdueInvoices.filter((row) => {
      if (!normalizedClientFilter) return true;
      return String(row.clientName || '')
        .toLocaleLowerCase('tr-TR')
        .includes(normalizedClientFilter);
    }),
    [normalizedClientFilter, overdueInvoices],
  );
  const filteredUpcomingReceivables = useMemo(
    () => upcomingReceivables.filter((row) => {
      if (!normalizedClientFilter) return true;
      return String(row.clientName || '')
        .toLocaleLowerCase('tr-TR')
        .includes(normalizedClientFilter);
    }),
    [normalizedClientFilter, upcomingReceivables],
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

  async function handleExport() {
    try {
      const chartRows = (overviewQuery.data?.chart ?? []).map((point) => ({
        period: point.label,
        inflow: Number(point.inflow || 0),
        outflow: Number(point.outflow || 0),
        net: Number(point.net || 0),
      }));

      await exportTable({
        format: exportFormat,
        fileBaseName: 'finans-dashboard',
        title: 'Finans Dashboard Raporu',
        columns: [
          { key: 'period', label: 'Donem' },
          { key: 'inflow', label: 'Tahsilat' },
          { key: 'outflow', label: 'Gider' },
          { key: 'net', label: 'Net' },
        ],
        rows: chartRows,
        sheetName: 'NakitAkisi',
      });
    } catch {
      toast.error('Rapor disa aktarimi basarisiz oldu.');
    }
  }

  return (
    <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
      <PageHeader
        icon={<BarChart3 size={20} color="#059669" />}
        title="Finans Dashboard"
        subtitle="Tahsilat, gider ve net nakit akis ozeti"
      />

      <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Donem</label>
            <select
              value={monthCount}
              onChange={(event) => setMonthCount(Number(event.target.value) as 6 | 12)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value={6}>Son 6 Ay</option>
              <option value={12}>Son 12 Ay</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Musteri Filtresi</label>
            <select
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="">Tum Musteriler</option>
              {clientOptions.map((clientName) => (
                <option key={clientName} value={clientName}>
                  {clientName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 block text-xs font-semibold text-gray-600">Hizli Aksiyonlar</p>
            <div className="flex h-9 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/app/faturalar')}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
              >
                <Receipt size={14} />
                Faturalar
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/tahsilat-takibi')}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <CalendarCheck size={14} />
                Tahsilat
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/gider-yonetimi')}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <Clock size={14} />
                Gider
              </button>
            </div>
          </div>
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
            disabled={(overviewQuery.data?.chart ?? []).length === 0}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={13} />
            {exportFormat.toUpperCase()} Indir
          </button>
        </div>
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Tahsilat</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(kpis.totalInflow)}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Gider</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">{formatMoney(kpis.totalOutflow)}</p>
        </article>
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
          <button
            type="button"
            onClick={() => navigate('/app/tahsilat-takibi')}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Detayli Tahsilat Ekrani
            <ArrowRight size={14} />
          </button>
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
                {filteredOverdueInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-400">
                      Secilen filtreye uygun geciken fatura bulunmuyor.
                    </td>
                  </tr>
                ) : filteredOverdueInvoices.map((row) => (
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
                {filteredUpcomingReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                      Secilen filtreye uygun yaklasan tahsilat kaydi bulunmuyor.
                    </td>
                  </tr>
                ) : filteredUpcomingReceivables.map((row) => (
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
