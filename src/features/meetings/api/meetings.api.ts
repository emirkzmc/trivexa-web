import api from '../../../shared/lib/axios';

type MaybeWrapped<T> = { data?: T } | T;

export interface MeetingItem {
    id: string;
    title: string;
    date: string;
    durationMinutes: number;
    clientId?: string;
    projectId?: string;
    link?: string;
    notes?: string;
    summary?: string;
    organizerId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MeetingListParams {
    clientId?: string;
    projectId?: string;
}

export interface MeetingCreatePayload {
    title: string;
    date: string;
    durationMinutes?: number;
    clientId?: string;
    projectId?: string;
    link?: string;
    notes?: string;
}

export interface MeetingUpdatePayload extends Partial<MeetingCreatePayload> {
    summary?: string;
}

export interface ConvertToTicketPayload {
    title: string;
    description?: string;
    priority?: string;
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

function extractRows(payload: unknown): unknown[] {
    const first = unwrapData(payload as MaybeWrapped<unknown>);
    if (Array.isArray(first)) return first;

    const record = toRecord(first);
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;

    const nested = unwrapData(first as MaybeWrapped<unknown>);
    if (Array.isArray(nested)) return nested;

    return [];
}

function normalizeMeeting(raw: unknown): MeetingItem {
    const row = toRecord(raw);

    return {
        id: toStringValue(row.id),
        title: toStringValue(row.title) || 'Toplanti',
        date: toStringValue(row.date),
        durationMinutes: toNumberValue(row.durationMinutes ?? row.duration_minutes) || 30,
        clientId: toStringValue(row.clientId ?? row.client_id) || undefined,
        projectId: toStringValue(row.projectId ?? row.project_id) || undefined,
        link: toStringValue(row.link) || undefined,
        notes: toStringValue(row.notes) || undefined,
        summary: toStringValue(row.summary) || undefined,
        organizerId: toStringValue(row.organizerId ?? row.organizer_id) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at),
    };
}

export async function getMeetings(params?: MeetingListParams): Promise<MeetingItem[]> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/meetings', { params });
    const rows = extractRows(data);
    return rows.map((row) => normalizeMeeting(row));
}

export async function getMeetingById(id: string): Promise<MeetingItem> {
    const { data } = await api.get<MaybeWrapped<unknown>>(`/meetings/${id}`);
    const payload = unwrapData(data);
    return normalizeMeeting(payload);
}

export async function createMeeting(payload: MeetingCreatePayload): Promise<MeetingItem> {
    const { data } = await api.post<MaybeWrapped<unknown>>('/meetings', payload);
    const responsePayload = unwrapData(data);
    return normalizeMeeting(responsePayload);
}

export async function updateMeeting(
    id: string,
    payload: MeetingUpdatePayload,
): Promise<MeetingItem> {
    const { data } = await api.put<MaybeWrapped<unknown>>(`/meetings/${id}`, payload);
    const responsePayload = unwrapData(data);
    return normalizeMeeting(responsePayload);
}

export async function convertMeetingToTicket(
    meetingId: string,
    payload: ConvertToTicketPayload,
): Promise<void> {
    await api.post(`/meetings/${meetingId}/convert-to-ticket`, payload);
}
