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

export async function getLeaveRequests(params?: LeaveListParams): Promise<LeaveRequestItem[]> {
    const { data } = await api.get<{ data?: LeaveRequestItem[] } | LeaveRequestItem[]>('/leaves', { params });
    if (Array.isArray(data)) return data;
    return data.data ?? [];
}

export async function updateLeaveStatus(
    id: string,
    status: LeaveStatus,
): Promise<LeaveRequestItem> {
    const { data } = await api.patch<{ data: LeaveRequestItem }>(`/leaves/${id}/status`, { status });
    return data.data;
}
