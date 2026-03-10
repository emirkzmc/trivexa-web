import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { ArrowRight, BarChart3, LayoutDashboard, Receipt, Inbox, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { usePermission } from '../../../shared/hooks/usePermission';
import {
  CLIENT_PERMS,
  CONTRACT_PERMS,
  EXPENSE_PERMS,
  INVOICE_PERMS,
  PAYMENT_PERMS,
  PROJECT_PERMS,
  TICKET_PERMS,
  USER_PERMS,
} from '../../../shared/constants/navPermissions';
import { getDashboardSummary } from '../../reports/api/reports.api';
import { getCashflowOverview } from '../../finance/api/cashflow.api';
import { getSupportRequests } from '../../tickets/api/tickets.api';
import { getContracts } from '../../contracts/api/contracts.api';
import { getInvoices } from '../../finance/api/invoices.api';
import { getProjects } from '../../projects/api/projects.api';
import { getActiveTimer, getTimerHistory } from '../../time-tracker/api/timeTracker.api';
import { getMeetings } from '../../meetings/api/meetings.api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

type StatusEntry = {
  key: string;
  label: string;
  value: number;
};

const STATUS_COLORS = [
  '#2563EB',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#14B8A6',
  '#6B7280',
  '#EAB308',
];

const CASHFLOW_OPTIONS: ChartOptions<'bar'> = {
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
      ticks: { maxRotation: 0 },
    },
    y: {
      ticks: {
        callback: (value) => formatMoney(Number(value)),
      },
    },
  },
};

const BAR_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true },
  },
};

const DOUGHNUT_OPTIONS: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
  },
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Acik',
  IN_PROGRESS: 'Devam',
  COMPLETED: 'Tamamlandi',
  CANCELLED: 'Iptal',
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandi',
  REJECTED: 'Reddedildi',
  OVERDUE: 'Gecikmis',
  PARTIALLY_PAID: 'Kismi Odendi',
  PAID: 'Odendi',
  SENT: 'Gonderildi',
  DRAFT: 'Taslak',
  ACTIVE: 'Aktif',
  SIGNED: 'Imzali',
  EXPIRED: 'Suresi Doldu',
  OTHER: 'Diger',
  UNKNOWN: 'Bilinmiyor',
};

function formatMoney(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatHours(seconds?: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0.0';
  const hours = seconds / 3600;
  return hours.toFixed(1);
}

function isActiveProject(status?: string): boolean {
  const normalized = String(status ?? '').toUpperCase();
  return !['COMPLETED', 'DONE', 'CANCELLED', 'PASIF', 'INACTIVE'].includes(normalized);
}

function isSameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function parseDateValue(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatCount(value?: number, loading?: boolean) {
  if (loading) return '...';
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('tr-TR').format(value);
}

function normalizeStatus(value: string | undefined): string {
  const normalized = String(value || '').trim();
  if (!normalized) return 'UNKNOWN';
  return normalized.toUpperCase();
}

function formatStatusLabel(value: string): string {
  const normalized = normalizeStatus(value);
  if (STATUS_LABELS[normalized]) return STATUS_LABELS[normalized];
  return normalized
    .toLowerCase()
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
}

function buildStatusEntries<T>(items: T[], getValue: (item: T) => string | undefined): StatusEntry[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = normalizeStatus(getValue(item));
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return [...map.entries()]
    .map(([key, value]) => ({ key, label: formatStatusLabel(key), value }))
    .sort((a, b) => b.value - a.value);
}

function limitStatusEntries(entries: StatusEntry[], limit: number): StatusEntry[] {
  if (entries.length <= limit) return entries;
  const top = entries.slice(0, Math.max(1, limit - 1));
  const rest = entries.slice(Math.max(1, limit - 1));
  const restValue = rest.reduce((sum, entry) => sum + entry.value, 0);
  return [...top, { key: 'OTHER', label: STATUS_LABELS.OTHER, value: restValue }];
}

function buildDoughnutData(entries: StatusEntry[]) {
  return {
    labels: entries.map((entry) => entry.label),
    datasets: [
      {
        data: entries.map((entry) => entry.value),
        backgroundColor: entries.map((_, index) => STATUS_COLORS[index % STATUS_COLORS.length]),
        borderWidth: 0,
      },
    ],
  };
}

function buildBarData(entries: StatusEntry[]) {
  return {
    labels: entries.map((entry) => entry.label),
    datasets: [
      {
        label: 'Adet',
        data: entries.map((entry) => entry.value),
        backgroundColor: entries.map((_, index) => STATUS_COLORS[index % STATUS_COLORS.length]),
        borderRadius: 6,
      },
    ],
  };
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const normalizedRole = String(role ?? '').toUpperCase();
  const { hasAnyPermission } = usePermission();
  const [monthCount, setMonthCount] = useState<6 | 12>(6);
  const showPersonalWidgets = Boolean(user?.id);
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(today), [today]);
  const weekEnd = useMemo(() => endOfWeek(today), [today]);
  const weekStartIso = useMemo(() => weekStart.toISOString(), [weekStart]);
  const weekEndIso = useMemo(() => weekEnd.toISOString(), [weekEnd]);

  const canViewUsers = hasAnyPermission(USER_PERMS);
  const canViewProjects = hasAnyPermission(PROJECT_PERMS);
  const canViewClients = hasAnyPermission(CLIENT_PERMS);
  const canViewInvoices = hasAnyPermission(INVOICE_PERMS);
  const canAccessContractsEndpoint = normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER';
  const canViewContracts = canAccessContractsEndpoint;
  const canViewTickets = hasAnyPermission(TICKET_PERMS);
  const canViewFinance = hasAnyPermission([...PAYMENT_PERMS, ...INVOICE_PERMS, ...EXPENSE_PERMS]);
  const personalProjectsEnabled = showPersonalWidgets;
  const personalTimeEnabled = showPersonalWidgets;
  const personalMeetingsEnabled = showPersonalWidgets;
  const canViewRevenue = canViewFinance || canViewInvoices;
  const canAccessSummaryEndpoint = normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER';
  const wantsSummary = canViewUsers || canViewProjects || canViewClients || canViewRevenue;

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    enabled: wantsSummary && canAccessSummaryEndpoint,
  });

  const cashflowQuery = useQuery({
    queryKey: ['dashboard-cashflow', monthCount],
    queryFn: () => getCashflowOverview({ months: monthCount }),
    enabled: canViewFinance,
  });

  const supportQuery = useQuery({
    queryKey: ['dashboard-support-requests'],
    queryFn: () => getSupportRequests({ page: 1, limit: 100 }),
    enabled: canViewTickets,
  });

  const contractQuery = useQuery({
    queryKey: ['dashboard-contracts'],
    queryFn: () => getContracts({ page: 1, limit: 100 }),
    enabled: canViewContracts,
  });

  const invoiceQuery = useQuery({
    queryKey: ['dashboard-invoices'],
    queryFn: () => getInvoices({ page: 1, limit: 100 }),
    enabled: canViewInvoices,
  });

  const myProjectsQuery = useQuery({
    queryKey: ['dashboard-my-projects'],
    queryFn: () => getProjects({ page: 1, limit: 50, myProjectsOnly: true }),
    enabled: personalProjectsEnabled,
  });

  const myTimeQuery = useQuery({
    queryKey: ['dashboard-my-time', weekStartIso, weekEndIso],
    queryFn: () => getTimerHistory({
      page: 1,
      limit: 100,
      userId: user?.id,
      startDate: weekStartIso,
      endDate: weekEndIso,
    }),
    enabled: personalTimeEnabled && Boolean(user?.id),
  });

  const activeTimerQuery = useQuery({
    queryKey: ['dashboard-active-timer'],
    queryFn: getActiveTimer,
    enabled: personalTimeEnabled,
    refetchInterval: 30_000,
  });

  const meetingsQuery = useQuery({
    queryKey: ['dashboard-my-meetings'],
    queryFn: () => getMeetings(),
    enabled: personalMeetingsEnabled,
  });

  const summary = summaryQuery.data;
  const cashflow = cashflowQuery.data;

  const supportRows = supportQuery.data?.data ?? [];
  const contractRows = contractQuery.data?.data ?? [];
  const invoiceRows = invoiceQuery.data ?? [];
  const myProjects = myProjectsQuery.data?.data ?? [];
  const myProjectCount = myProjects.length;
  const myActiveProjects = myProjects.filter((project) => isActiveProject(project.status)).length;
  const timeRows = myTimeQuery.data?.data ?? [];
  const weeklySeconds = timeRows.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);
  const todaySeconds = timeRows.reduce((sum, entry) => {
    const started = parseDateValue(entry.startedAt);
    if (!started) return sum;
    return isSameDay(started, today) ? sum + (entry.duration ?? 0) : sum;
  }, 0);
  const meetings = meetingsQuery.data ?? [];
  const upcomingMeetings = meetings.filter((meeting) => {
    const date = parseDateValue(meeting.date);
    if (!date) return false;
    return date >= today && date <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  const approvalEntries = useMemo(
    () => limitStatusEntries(buildStatusEntries(supportRows, (row) => row.approvalStatus), 5),
    [supportRows],
  );

  const stageEntries = useMemo(
    () => limitStatusEntries(buildStatusEntries(supportRows, (row) => row.stage), 5),
    [supportRows],
  );

  const contractEntries = useMemo(
    () => limitStatusEntries(buildStatusEntries(contractRows, (row) => row.status), 6),
    [contractRows],
  );

  const invoiceEntries = useMemo(
    () => limitStatusEntries(buildStatusEntries(invoiceRows, (row) => row.status), 6),
    [invoiceRows],
  );

  const cashflowChartData = useMemo(
    () => ({
      labels: (cashflow?.chart ?? []).map((point) => point.label),
      datasets: [
        {
          label: 'Tahsilat',
          data: (cashflow?.chart ?? []).map((point) => point.inflow),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderRadius: 6,
        },
        {
          label: 'Gider',
          data: (cashflow?.chart ?? []).map((point) => point.outflow),
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderRadius: 6,
        },
        {
          label: 'Net',
          data: (cashflow?.chart ?? []).map((point) => point.net),
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderRadius: 6,
        },
      ],
    }),
    [cashflow?.chart],
  );

  const overdueInvoices = cashflow?.overdueInvoices ?? [];
  const recentSupportRequests = useMemo(
    () => [...supportRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [supportRows],
  );

  const hasCashflowChart = cashflowChartData.labels.length > 0;
  const hasApprovalChart = approvalEntries.length > 0;
  const hasContractChart = contractEntries.length > 0;
  const hasInvoiceChart = invoiceEntries.length > 0;

  const kpis = cashflow?.kpis ?? {
    totalInflow: 0,
    totalOutflow: 0,
    netCash: 0,
    outstanding: 0,
    overdueAmount: 0,
    overdueCount: 0,
    upcomingAmount: 0,
  };

  return (
    <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
      <PageHeader
        icon={<LayoutDashboard size={20} color="#1F2937" />}
        title="Dashboard"
        subtitle="Rolunuze uygun ozet, finans ve talep gorunumu"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            {canViewTickets && (
              <button
                type="button"
                onClick={() => navigate('/app/portal-talepleri')}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <Inbox size={14} />
                Portal Talepleri
              </button>
            )}
            {canViewFinance && (
              <button
                type="button"
                onClick={() => navigate('/app/finans')}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <BarChart3 size={14} />
                Finans Paneli
              </button>
            )}
            {canViewContracts && (
              <button
                type="button"
                onClick={() => navigate('/app/sozlesmeler')}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
              >
                <FileText size={14} />
                Sozlesmeler
              </button>
            )}
          </div>
        )}
      />

      {showPersonalWidgets && (
        <section className="mb-4 grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Profil</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{user?.name || '-'}</p>
            <p className="mt-1 text-xs text-gray-500">{user?.role || '-'}</p>
            <p className="mt-1 text-xs text-gray-500">{user?.department || '-'}</p>
          </article>
          {personalProjectsEnabled && (
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Projelerim</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">
                {myProjectsQuery.isLoading ? '...' : myProjectCount}
              </p>
              <p className="mt-1 text-xs text-gray-500">Aktif proje: {myActiveProjects}</p>
            </article>
          )}
          {personalTimeEnabled && (
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Bu Hafta Calisma</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {myTimeQuery.isLoading ? '...' : `${formatHours(weeklySeconds)}s`}
              </p>
              <p className="mt-1 text-xs text-gray-500">Bugun: {formatHours(todaySeconds)}s</p>
            </article>
          )}
          {personalMeetingsEnabled && (
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplantilar</p>
              <p className="mt-1 text-2xl font-bold text-sky-700">
                {meetingsQuery.isLoading ? '...' : upcomingMeetings.length}
              </p>
              <p className="mt-1 text-xs text-gray-500">7 gun icinde</p>
            </article>
          )}
        </section>
      )}

      {showPersonalWidgets && (
        <section className="mb-4 grid gap-3 md:grid-cols-2">
          {personalTimeEnabled && (
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Aktif Zamanlayici</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {activeTimerQuery.isLoading
                      ? 'Yukleniyor...'
                      : activeTimerQuery.data
                        ? `${activeTimerQuery.data.projectName || 'Proje'}`
                        : 'Aktif zamanlayici yok'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/app/time-tracker')}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Time Tracker
                  <ArrowRight size={12} />
                </button>
              </div>
              {activeTimerQuery.data && (
                <p className="mt-2 text-xs text-gray-500">
                  Gorev: {activeTimerQuery.data.taskTitle || '—'}
                </p>
              )}
            </article>
          )}

          <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Hizli Aksiyonlar</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Kisa yollar</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {personalProjectsEnabled && (
                <button
                  type="button"
                  onClick={() => navigate('/app/projelerim')}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Projelerim
                  <ArrowRight size={12} />
                </button>
              )}
              {personalMeetingsEnabled && (
                <button
                  type="button"
                  onClick={() => navigate('/app/toplanti-takvimi')}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Toplantilar
                  <ArrowRight size={12} />
                </button>
              )}
              {personalTimeEnabled && (
                <button
                  type="button"
                  onClick={() => navigate('/app/time-tracker')}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Zaman Takibi
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </article>
        </section>
      )}

      {wantsSummary && (
        <section className="mb-4 grid gap-3 md:grid-cols-4">
          {canViewUsers && (
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Kullanici</p>
              <p className="mt-1 text-2xl font-bold text-sky-700">{formatCount(summary?.totalUsers, summaryQuery.isLoading)}</p>
              <p className="mt-1 text-xs text-gray-500">Aktif personel ve admin sayisi</p>
            </article>
          )}
          {canViewProjects && (
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Proje</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">{formatCount(summary?.totalProjects, summaryQuery.isLoading)}</p>
              <p className="mt-1 text-xs text-gray-500">Sistemdeki toplam proje</p>
            </article>
          )}
          {canViewClients && (
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Musteri</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCount(summary?.totalClients, summaryQuery.isLoading)}</p>
              <p className="mt-1 text-xs text-gray-500">Yonetilen aktif musteri</p>
            </article>
          )}
          {canViewRevenue && (
            <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Ciro</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{summaryQuery.isLoading ? '...' : formatMoney(summary?.totalRevenue)}</p>
              <p className="mt-1 text-xs text-gray-500">Raporlanan toplam gelir</p>
            </article>
          )}
        </section>
      )}

      {canViewFinance && (
        <section className="mb-4 grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Tahsilat</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{formatMoney(kpis.totalInflow)}</p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Gider</p>
            <p className="mt-1 text-xl font-bold text-rose-700">{formatMoney(kpis.totalOutflow)}</p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Net Nakit</p>
            <p className={`mt-1 text-xl font-bold ${kpis.netCash >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatMoney(kpis.netCash)}
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Geciken Alacak</p>
            <p className="mt-1 text-xl font-bold text-rose-700">{formatMoney(kpis.overdueAmount)}</p>
            <p className="mt-0.5 text-xs text-gray-500">{kpis.overdueCount} fatura</p>
          </article>
        </section>
      )}

      {canViewFinance && (
        <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Nakit Akisi Ozeti</h2>
              <p className="text-xs text-gray-500">Finans panelindeki nakit akis grafiginin ozet gorunumu</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={monthCount}
                onChange={(event) => setMonthCount(Number(event.target.value) as 6 | 12)}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                <option value={6}>Son 6 Ay</option>
                <option value={12}>Son 12 Ay</option>
              </select>
              <button
                type="button"
                onClick={() => navigate('/app/finans')}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Finans Detayi
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="mt-4 h-[300px]">
            {cashflowQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Veriler yukleniyor...</div>
            ) : cashflowQuery.isError ? (
              <div className="flex h-full items-center justify-center text-sm text-red-600">Finans verileri alinamadi.</div>
            ) : !hasCashflowChart ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Grafik verisi bulunamadi.</div>
            ) : (
              <Bar data={cashflowChartData} options={CASHFLOW_OPTIONS} />
            )}
          </div>
        </section>
      )}

      {(canViewTickets || canViewInvoices) && (
        <section className="mb-4 grid gap-4 xl:grid-cols-2">
          {canViewTickets && (
            <article className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Portal Talep Onay Dagilimi</h3>
              <p className="text-xs text-gray-500">Son 100 talep uzerinden onay durumu</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/portal-talepleri')}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Detaylar
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="h-[260px]">
            {supportQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Veriler yukleniyor...</div>
            ) : supportQuery.isError ? (
              <div className="flex h-full items-center justify-center text-sm text-red-600">Talep verileri alinamadi.</div>
            ) : !hasApprovalChart ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Talep bulunamadi.</div>
            ) : (
              <Doughnut data={buildDoughnutData(approvalEntries)} options={DOUGHNUT_OPTIONS} />
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {stageEntries.length === 0 ? (
              <p className="col-span-2 text-center text-gray-400">Surec verisi bulunamadi.</p>
            ) : (
              stageEntries.map((entry, index) => (
                <div key={entry.key} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{entry.label}</span>
                    <span className="font-semibold" style={{ color: STATUS_COLORS[index % STATUS_COLORS.length] }}>
                      {entry.value}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
            </article>
          )}

          {canViewInvoices && (
            <article className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Fatura Durumlari</h3>
              <p className="text-xs text-gray-500">Son 100 kayitta fatura status dagilimi</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/faturalar')}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Fatura Paneli
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="h-[260px]">
            {invoiceQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Veriler yukleniyor...</div>
            ) : invoiceQuery.isError ? (
              <div className="flex h-full items-center justify-center text-sm text-red-600">Fatura verileri alinamadi.</div>
            ) : !hasInvoiceChart ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Fatura kaydi bulunamadi.</div>
            ) : (
              <Bar data={buildBarData(invoiceEntries)} options={BAR_OPTIONS} />
            )}
          </div>
            </article>
          )}
        </section>
      )}

      {(canViewContracts || canViewFinance) && (
        <section className="mb-4 grid gap-4 xl:grid-cols-2">
          {canViewContracts && (
            <article className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Sozlesme Durumlari</h3>
              <p className="text-xs text-gray-500">Son 100 kayitta sozlesme durumu</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/sozlesmeler')}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Sozlesme Paneli
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="h-[240px]">
            {contractQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Veriler yukleniyor...</div>
            ) : contractQuery.isError ? (
              <div className="flex h-full items-center justify-center text-sm text-red-600">Sozlesme verileri alinamadi.</div>
            ) : !hasContractChart ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Sozlesme kaydi bulunamadi.</div>
            ) : (
              <Bar data={buildBarData(contractEntries)} options={BAR_OPTIONS} />
            )}
          </div>
            </article>
          )}

          {canViewFinance && (
            <article className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Geciken Faturalar</h3>
              <p className="text-xs text-gray-500">Finans panelindeki geciken fatura listesi</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/tahsilat-takibi')}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Tahsilat Takibi
              <ArrowRight size={12} />
            </button>
          </div>
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
                {cashflowQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-400">Veriler yukleniyor...</td>
                  </tr>
                ) : overdueInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-400">Geciken fatura bulunmuyor.</td>
                  </tr>
                ) : (
                  overdueInvoices.slice(0, 6).map((row) => (
                    <tr key={row.id} className="border-b border-gray-100">
                      <td className="px-2 py-2 text-gray-700">{row.invoiceNumber || '-'}</td>
                      <td className="px-2 py-2 text-gray-700">{row.clientName || '-'}</td>
                      <td className="px-2 py-2 text-gray-700">{row.dueDate ? formatDate(row.dueDate) : '-'}</td>
                      <td className="px-2 py-2 text-rose-700">{row.overdueDays} gun</td>
                      <td className="px-2 py-2 font-semibold text-rose-700">{formatMoney(row.outstanding)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
            </article>
          )}
        </section>
      )}

      {(canViewTickets || canViewFinance || canViewInvoices || canViewContracts) && (
        <section className="grid gap-4 xl:grid-cols-2">
          {canViewTickets && (
            <article className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Son Portal Talepleri</h3>
              <p className="text-xs text-gray-500">En yeni 6 talep</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/portal-talepleri')}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Taleplere Git
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {supportQuery.isLoading ? (
              <p className="text-sm text-gray-400">Veriler yukleniyor...</p>
            ) : recentSupportRequests.length === 0 ? (
              <p className="text-sm text-gray-400">Talep bulunamadi.</p>
            ) : (
              recentSupportRequests.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.subject || 'Talep'}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                      {formatStatusLabel(item.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{item.clientCompanyName || 'Musteri'} - {item.requesterEmail || '-'}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{formatDate(item.createdAt)}</p>
                </div>
              ))
            )}
          </div>
            </article>
          )}

          <article className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Hizli Ozet</h3>
              <p className="text-xs text-gray-500">Paneldeki ana aksiyonlar</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {canViewInvoices && (
              <button
                type="button"
                onClick={() => navigate('/app/faturalar')}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Receipt size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Fatura Akisi</p>
                  <p className="text-xs text-gray-500">Durum dagilimi ve tahsilat planlari</p>
                </div>
              </button>
            )}
            {canViewTickets && (
              <button
                type="button"
                onClick={() => navigate('/app/portal-talepleri')}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Inbox size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Talep Takibi</p>
                  <p className="text-xs text-gray-500">Onay ve surec durumlari</p>
                </div>
              </button>
            )}
            {canViewContracts && (
              <button
                type="button"
                onClick={() => navigate('/app/sozlesmeler')}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                  <FileText size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sozlesmeler</p>
                  <p className="text-xs text-gray-500">Aktif ve taslak sozlesmeler</p>
                </div>
              </button>
            )}
            {canViewFinance && (
              <button
                type="button"
                onClick={() => navigate('/app/finans')}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <BarChart3 size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Finans Paneli</p>
                  <p className="text-xs text-gray-500">Nakit akis ve gider analizi</p>
                </div>
              </button>
            )}
            {!canViewInvoices && !canViewTickets && !canViewContracts && !canViewFinance && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
                Bu rolde gosterilecek hizli aksiyon bulunmuyor.
              </div>
            )}
          </div>
          </article>
        </section>
      )}

      {!wantsSummary && !canViewFinance && !canViewTickets && !canViewContracts && !canViewInvoices && (
        <section className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          Bu rolde goruntulenecek dashboard bilgisi bulunmuyor.
        </section>
      )}
    </div>
  );
}
