import api from '../../../shared/lib/axios';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveType = 'YILLIK' | 'MAZERET' | 'RAPOR' | 'UCRETSIZ' | 'DIGER';

export interface LeaveRequestItem {
    id: string;
    userId: string;
    employeeName: string;
    employeeEmail?: string | null;
    department: string | null;
    type: LeaveType;
    status: LeaveStatus;
    startDate: string;
    endDate: string;
    durationDays: number;
    reason?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LeaveListParams {
    status?: LeaveStatus;
    type?: LeaveType;
    department?: string;
    search?: string;
}

export interface LeaveCreatePayload {
    userId?: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    durationDays: number;
    reason?: string;
    department?: string;
}

type MaybeWrapped<T> = { data?: T } | T;

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

export async function getLeaveRequests(params?: LeaveListParams): Promise<LeaveRequestItem[]> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/leaves', { params });
    const payload = unwrapData<unknown>(data);

    if (Array.isArray(payload)) {
        return payload as LeaveRequestItem[];
    }

    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        const inner = unwrapData<unknown>((payload as { data?: unknown }).data);
        return Array.isArray(inner) ? (inner as LeaveRequestItem[]) : [];
    }

    return [];
}

export async function createLeaveRequest(
    payload: LeaveCreatePayload,
): Promise<LeaveRequestItem> {
    const { data } = await api.post<MaybeWrapped<LeaveRequestItem>>('/leaves', payload);
    return unwrapData<LeaveRequestItem>(data);
}

export async function updateLeaveStatus(
    id: string,
    status: LeaveStatus,
): Promise<LeaveRequestItem> {
    const { data } = await api.patch<MaybeWrapped<LeaveRequestItem>>(
        `/leaves/${id}/status`,
        { status },
    );
    return unwrapData<LeaveRequestItem>(data);
}
