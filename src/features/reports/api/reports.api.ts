import api from '../../../shared/lib/axios';

export interface DashboardSummary {
    totalUsers: number;
    totalProjects: number;
    totalClients: number;
    totalRevenue: number;
    [key: string]: unknown;
}

export interface FinancialReportParams {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
}

export interface ProjectAnalyticsParams {
    startDate?: string;
    endDate?: string;
    projectId?: string;
}

type MaybeWrapped<T> = { data?: T } | T;

type DashboardSummaryBackend = {
    totalUsers?: number;
    totalProjects?: number;
    totalClients?: number;
    totalRevenue?: number;
    users?: { active?: number };
    clients?: { total?: number };
    projects?: { total?: number };
    finance?: { totalAmount?: number };
    [key: string]: unknown;
};

function toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
    }
    return {};
}

function toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function unwrapData<T>(payload: MaybeWrapped<T>): T {
    if (
        typeof payload === 'object'
        && payload !== null
        && 'data' in payload
        && (payload as { data?: unknown }).data !== undefined
    ) {
        return (payload as { data: T }).data;
    }
    return payload as T;
}

function normalizeDashboardSummary(raw: unknown): DashboardSummary {
    const payload = toRecord(raw) as DashboardSummaryBackend;
    const users = toRecord(payload.users);
    const clients = toRecord(payload.clients);
    const projects = toRecord(payload.projects);
    const finance = toRecord(payload.finance);

    return {
        totalUsers: toNumber(payload.totalUsers ?? users.active),
        totalProjects: toNumber(payload.totalProjects ?? projects.total),
        totalClients: toNumber(payload.totalClients ?? clients.total),
        totalRevenue: toNumber(payload.totalRevenue ?? finance.totalAmount),
        ...payload,
    };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/reports/dashboard');
    const payload = unwrapData(data);
    return normalizeDashboardSummary(payload);
}

export async function getFinancialReport(params?: FinancialReportParams): Promise<unknown> {
    const { data } = await api.get('/reports/financial', { params });
    return data;
}

export async function getProjectAnalytics(params?: ProjectAnalyticsParams): Promise<unknown> {
    const { data } = await api.get('/reports/projects', { params });
    return data;
}
