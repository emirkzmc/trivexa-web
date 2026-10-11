import api from '../../../shared/lib/axios';

export type CustomerContractStatus =
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'SIGNED'
    | 'EXPIRED'
    | 'TERMINATED';

export interface CustomerContractItem {
    id: string;
    title: string;
    description?: string;
    status: CustomerContractStatus | string;
    startDate?: string;
    endDate?: string;
    value?: number;
    signedUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomerContractsParams {
    status?: CustomerContractStatus;
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

function toNumberValue(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function normalizeContract(raw: unknown): CustomerContractItem {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id ?? row.contractId ?? row.contract_id),
        title: toStringValue(row.title ?? row.contractTitle ?? row.contract_title ?? row.name),
        description: toStringValue(row.description) || undefined,
        status: toStringValue(row.status) || 'DRAFT',
        startDate: toStringValue(row.startDate ?? row.start_date) || undefined,
        endDate: toStringValue(row.endDate ?? row.end_date) || undefined,
        value: toNumberValue(row.value ?? row.totalAmount ?? row.total_amount),
        signedUrl: toStringValue(row.signedUrl ?? row.signed_url) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at) || undefined,
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at) || undefined,
    };
}

export async function getCustomerContracts(
    params: CustomerContractsParams = {},
): Promise<CustomerContractItem[]> {
    const { data } = await api.get<MaybeWrapped<unknown>>('/portal/contracts', { params });
    const payload = unwrapData<unknown>(data);
    const row = toRecord(payload);
    const rowsRaw = Array.isArray(payload)
        ? payload
        : Array.isArray(row.data)
            ? row.data
            : Array.isArray(row.items)
                ? row.items
                : Array.isArray(row.contracts)
                    ? row.contracts
                    : [];

    return rowsRaw.map((item) => normalizeContract(item));
}
