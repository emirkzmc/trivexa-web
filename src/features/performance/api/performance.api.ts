import api from '../../../shared/lib/axios';

export interface PerformanceRecord {
    id: string;
    userId: string;
    userName: string;
    userEmail?: string | null;
    periodStart: string;
    periodEnd: string;
    score: number;
    bonusAmount: number;
    notes?: string | null;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PerformanceQueryParams {
    userId?: string;
    startDate?: string;
    endDate?: string;
}

export interface PerformanceUpsertPayload {
    userId: string;
    periodStart: string;
    periodEnd: string;
    score: number;
    bonusAmount: number;
    notes?: string;
}

export async function getPerformanceRecords(
    params?: PerformanceQueryParams,
): Promise<PerformanceRecord[]> {
    const { data } = await api.get<{ data?: PerformanceRecord[] } | PerformanceRecord[]>(
        '/performance',
        { params },
    );
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as { data?: PerformanceRecord[] }).data)) {
        return (data as { data?: PerformanceRecord[] }).data ?? [];
    }
    return [];
}

export async function upsertPerformanceRecord(
    payload: PerformanceUpsertPayload,
): Promise<PerformanceRecord> {
    const { data } = await api.post<{ data: PerformanceRecord }>('/performance', payload);
    return data.data;
}
