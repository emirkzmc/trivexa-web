import api from '../../../shared/lib/axios';

type MaybeWrapped<T> = { data?: T } | T;

export interface CashflowKpis {
  totalInflow: number;
  totalOutflow: number;
  netCash: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  upcomingAmount: number;
}

export interface CashflowChartPoint {
  key: string;
  label: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface CashflowInvoiceRow {
  id: string;
  invoiceNumber: string;
  clientName: string;
  dueDate?: string | null;
  outstanding: number;
  overdueDays: number;
}

export interface CashflowExpenseRow {
  id: string;
  description: string;
  department: string;
  expenseDate?: string | null;
  status: string;
  amount: number;
}

export interface CashflowOverviewResponse {
  months: number;
  kpis: CashflowKpis;
  chart: CashflowChartPoint[];
  overdueInvoices: CashflowInvoiceRow[];
  upcomingReceivables: CashflowInvoiceRow[];
  upcomingExpensePayments: CashflowExpenseRow[];
}

interface CashflowOverviewQuery {
  months?: number;
}

function unwrapData<T>(payload: unknown): T {
  if (
    typeof payload === 'object'
    && payload !== null
    && 'data' in payload
    && (payload as { data?: unknown }).data !== undefined
  ) {
    return (payload as { data: unknown }).data as T;
  }
  return payload as T;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function toNumberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeInvoiceRow(raw: unknown): CashflowInvoiceRow {
  const row = toRecord(raw);
  return {
    id: toStringValue(row.id),
    invoiceNumber: toStringValue(row.invoiceNumber ?? row.invoice_number),
    clientName: toStringValue(row.clientName ?? row.client_name),
    dueDate: toStringValue(row.dueDate ?? row.due_date) || null,
    outstanding: toNumberValue(row.outstanding),
    overdueDays: toNumberValue(row.overdueDays ?? row.overdue_days),
  };
}

function normalizeExpenseRow(raw: unknown): CashflowExpenseRow {
  const row = toRecord(raw);
  return {
    id: toStringValue(row.id),
    description: toStringValue(row.description),
    department: toStringValue(row.department),
    expenseDate: toStringValue(row.expenseDate ?? row.expense_date) || null,
    status: toStringValue(row.status),
    amount: toNumberValue(row.amount),
  };
}

function normalizeChartPoint(raw: unknown): CashflowChartPoint {
  const row = toRecord(raw);
  return {
    key: toStringValue(row.key),
    label: toStringValue(row.label),
    inflow: toNumberValue(row.inflow),
    outflow: toNumberValue(row.outflow),
    net: toNumberValue(row.net),
  };
}

function normalizeOverview(raw: unknown): CashflowOverviewResponse {
  const row = toRecord(raw);
  const kpisRaw = toRecord(row.kpis);

  return {
    months: toNumberValue(row.months) || 6,
    kpis: {
      totalInflow: toNumberValue(kpisRaw.totalInflow ?? kpisRaw.total_inflow),
      totalOutflow: toNumberValue(kpisRaw.totalOutflow ?? kpisRaw.total_outflow),
      netCash: toNumberValue(kpisRaw.netCash ?? kpisRaw.net_cash),
      outstanding: toNumberValue(kpisRaw.outstanding),
      overdueAmount: toNumberValue(kpisRaw.overdueAmount ?? kpisRaw.overdue_amount),
      overdueCount: toNumberValue(kpisRaw.overdueCount ?? kpisRaw.overdue_count),
      upcomingAmount: toNumberValue(kpisRaw.upcomingAmount ?? kpisRaw.upcoming_amount),
    },
    chart: Array.isArray(row.chart) ? row.chart.map(normalizeChartPoint) : [],
    overdueInvoices: Array.isArray(row.overdueInvoices)
      ? row.overdueInvoices.map(normalizeInvoiceRow)
      : [],
    upcomingReceivables: Array.isArray(row.upcomingReceivables)
      ? row.upcomingReceivables.map(normalizeInvoiceRow)
      : [],
    upcomingExpensePayments: Array.isArray(row.upcomingExpensePayments)
      ? row.upcomingExpensePayments.map(normalizeExpenseRow)
      : [],
  };
}

export async function getCashflowOverview(
  params: CashflowOverviewQuery = {},
): Promise<CashflowOverviewResponse> {
  const { data } = await api.get<MaybeWrapped<unknown>>('/payments/cashflow/overview', {
    params,
  });
  const payload = unwrapData<unknown>(data);
  return normalizeOverview(payload);
}

