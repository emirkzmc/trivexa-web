import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MeetingItem {
    id: string;
    title: string;
    description?: string;
    clientId?: string;
    projectId?: string;
    meetingDate: string;
    organizerId: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MeetingListParams {
    clientId?: string;
    projectId?: string;
}

export interface MeetingCreatePayload {
    title: string;
    description?: string;
    clientId?: string;
    projectId?: string;
    meetingDate: string;
    notes?: string;
}

export type MeetingUpdatePayload = Partial<MeetingCreatePayload>;

export interface ConvertToTicketPayload {
    title: string;
    description?: string;
    priority?: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getMeetings(params?: MeetingListParams): Promise<MeetingItem[]> {
    const { data } = await api.get<{ data: MeetingItem[] }>('/meetings', { params });
    return data.data;
}

export async function getMeetingById(id: string): Promise<MeetingItem> {
    const { data } = await api.get<{ data: MeetingItem }>(`/meetings/${id}`);
    return data.data;
}

export async function createMeeting(payload: MeetingCreatePayload): Promise<MeetingItem> {
    const { data } = await api.post<{ data: MeetingItem }>('/meetings', payload);
    return data.data;
}

export async function updateMeeting(
    id: string,
    payload: MeetingUpdatePayload,
): Promise<MeetingItem> {
    const { data } = await api.put<{ data: MeetingItem }>(`/meetings/${id}`, payload);
    return data.data;
}

export async function convertMeetingToTicket(
    meetingId: string,
    payload: ConvertToTicketPayload,
): Promise<void> {
    await api.post(`/meetings/${meetingId}/convert-to-ticket`, payload);
}
