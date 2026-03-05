import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
    const { data } = await api.get<{ data: DashboardSummary }>('/reports/dashboard');
    return data.data;
}

export async function getFinancialReport(params?: FinancialReportParams): Promise<unknown> {
    const { data } = await api.get('/reports/financial', { params });
    return data;
}

export async function getProjectAnalytics(params?: ProjectAnalyticsParams): Promise<unknown> {
    const { data } = await api.get('/reports/projects', { params });
    return data;
}
