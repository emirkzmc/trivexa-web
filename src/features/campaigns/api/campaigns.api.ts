import api from '../../../shared/lib/axios';

type MaybeWrapped<T> = { data?: T } | T;

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type CampaignPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'GOOGLE_ADS' | 'LINKEDIN';
export type CampaignObjective = 'AWARENESS' | 'ENGAGEMENT' | 'LEADS' | 'SALES';

export interface CampaignItem {
    id: string;
    projectId?: string;
    projectName?: string;
    title: string;
    description?: string;
    platform: CampaignPlatform;
    objective: CampaignObjective;
    status: CampaignStatus;
    startDate: string;
    endDate: string;
    budget: number;
    owner?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CampaignListParams {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: CampaignStatus;
    platform?: CampaignPlatform;
    objective?: CampaignObjective;
    search?: string;
}

export interface PaginatedCampaignResponse {
    data: CampaignItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CampaignCreatePayload {
    title: string;
    projectId?: string;
    description?: string;
    platform: CampaignPlatform;
    objective: CampaignObjective;
    status?: CampaignStatus;
    startDate: string;
    endDate: string;
    budget?: number;
    owner?: string;
}

export type CampaignUpdatePayload = Partial<CampaignCreatePayload>;

function toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
    }
    return {};
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

function extractRowsAndMeta(payload: unknown): { rows: unknown[]; meta: Record<string, unknown> } {
    const first = unwrapData(payload as MaybeWrapped<unknown>);
    const record = toRecord(first);

    if (Array.isArray(first)) {
        return { rows: first, meta: {} };
    }

    if (Array.isArray(record.data)) {
        return { rows: record.data as unknown[], meta: toRecord(record.meta) };
    }

    if (Array.isArray(record.items)) {
        return { rows: record.items as unknown[], meta: toRecord(record.meta) };
    }

    const nested = unwrapData(record.data as MaybeWrapped<unknown>);
    if (Array.isArray(nested)) {
        return { rows: nested, meta: toRecord(record.meta) };
    }

    return { rows: [], meta: toRecord(record.meta) };
}

function normalizeCampaign(raw: unknown): CampaignItem {
    const row = toRecord(raw);

    return {
        id: toStringValue(row.id),
        projectId: toStringValue(row.projectId ?? row.project_id) || undefined,
        projectName: toStringValue(row.projectName ?? row.project_name) || undefined,
        title: toStringValue(row.title) || 'Kampanya',
        description: toStringValue(row.description) || undefined,
        platform: (toStringValue(row.platform).toUpperCase() as CampaignPlatform) || 'INSTAGRAM',
        objective: (toStringValue(row.objective).toUpperCase() as CampaignObjective) || 'AWARENESS',
        status: (toStringValue(row.status).toUpperCase() as CampaignStatus) || 'DRAFT',
        startDate: toStringValue(row.startDate ?? row.start_date),
        endDate: toStringValue(row.endDate ?? row.end_date),
        budget: toNumberValue(row.budget),
        owner: toStringValue(row.owner) || undefined,
        createdBy: toStringValue(row.createdBy ?? row.created_by) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at),
    };
}

export async function getCampaigns(params: CampaignListParams = {}): Promise<PaginatedCampaignResponse> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/campaigns', { params });
    const { rows, meta } = extractRowsAndMeta(data);
    const total = toNumberValue(meta.total ?? rows.length);
    const page = Math.max(1, toNumberValue(meta.page ?? 1));
    const fallbackLimit = rows.length > 0 ? rows.length : 20;
    const limit = Math.max(1, toNumberValue(meta.limit ?? fallbackLimit));
    const totalPages = Math.max(1, toNumberValue(meta.totalPages ?? Math.ceil(total / limit)));

    return {
        data: rows.map((row) => normalizeCampaign(row)),
        meta: { total, page, limit, totalPages },
    };
}

export async function getCampaignById(id: string): Promise<CampaignItem> {
    const { data } = await api.get<MaybeWrapped<unknown>>(`/campaigns/${id}`);
    return normalizeCampaign(unwrapData(data));
}

export async function createCampaign(payload: CampaignCreatePayload): Promise<CampaignItem> {
    const { data } = await api.post<MaybeWrapped<unknown>>('/campaigns', payload);
    return normalizeCampaign(unwrapData(data));
}

export async function updateCampaign(id: string, payload: CampaignUpdatePayload): Promise<CampaignItem> {
    const { data } = await api.put<MaybeWrapped<unknown>>(`/campaigns/${id}`, payload);
    return normalizeCampaign(unwrapData(data));
}

export async function updateCampaignStatus(id: string, status: CampaignStatus): Promise<CampaignItem> {
    const { data } = await api.patch<MaybeWrapped<unknown>>(`/campaigns/${id}/status`, { status });
    return normalizeCampaign(unwrapData(data));
}

export async function deleteCampaign(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
}
