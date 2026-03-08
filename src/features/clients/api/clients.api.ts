import api from '../../../shared/lib/axios';

export interface ClientItem {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ClientListParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string;
}

export interface PaginatedClientResponse {
    data: ClientItem[];
    total: number;
    page: number;
    limit: number;
}

export interface ClientCreatePayload {
    companyName: string;
    contactPerson: string;
    email: string;
    phone?: string;
    address?: string;
}

export type ClientUpdatePayload = Partial<ClientCreatePayload>;

export interface ClientPortalAccessResponse {
    success?: boolean;
    message?: string;
    expiresAt?: string;
    magicLink?: string;
    portalUrl?: string;
}

export interface ClientWorkspaceProject {
    id: string;
    name: string;
    status?: string;
    budget?: number;
    description?: string;
    startDate?: string;
    deadline?: string;
    createdAt?: string;
}

export interface ClientWorkspaceFeedback {
    id: string;
    title: string;
    date?: string;
    durationMinutes?: number;
    notes?: string;
    summary?: string;
    projectId?: string;
}

export interface ClientWorkspaceTicket {
    id: string;
    subject: string;
    description?: string;
    type?: string;
    status?: string;
    priority?: string;
    createdAt?: string;
}

export interface ClientWorkspaceInvoice {
    id: string;
    invoiceNumber?: string;
    projectId?: string;
    projectName?: string;
    status?: string;
    total?: number;
    issueDate?: string;
    dueDate?: string;
}

export interface ClientWorkspacePayment {
    id: string;
    invoiceId?: string;
    amount?: number;
    paymentDate?: string;
    method?: string;
    currency?: string;
    reference?: string;
    notes?: string;
    receiptUrl?: string;
    recordedBy?: string;
    recordedByName?: string;
    createdAt?: string;
}

export interface ClientWorkspaceContract {
    id: string;
    title: string;
    description?: string;
    status?: string;
    value?: number;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
}

export interface ClientWorkspaceResponse {
    client: ClientItem;
    summary: {
        totalProjects: number;
        activeProjects: number;
        totalFeedbacks: number;
        totalTickets: number;
        totalContracts: number;
        pendingInvoices: number;
        totalInvoiced: number;
        totalCollected: number;
        outstandingAmount: number;
    };
    projects: ClientWorkspaceProject[];
    feedbacks: ClientWorkspaceFeedback[];
    tickets: ClientWorkspaceTicket[];
    finance: {
        invoices: ClientWorkspaceInvoice[];
        paymentsByInvoice: Array<{
            invoiceId: string;
            payments: ClientWorkspacePayment[];
        }>;
        totalInvoiced: number;
        totalCollected: number;
        outstandingAmount: number;
    };
    contracts: ClientWorkspaceContract[];
}

export type LandingContactRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LandingContactRequestItem {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    subject: string;
    message: string;
    status: LandingContactRequestStatus;
    source: string;
    reason?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    linkedClientId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LandingContactRequestListParams {
    page?: number;
    limit?: number;
    status?: LandingContactRequestStatus;
    search?: string;
}

export interface LandingContactRequestListResponse {
    data: LandingContactRequestItem[];
    total: number;
    page: number;
    limit: number;
}

type RawClientRow = Partial<{
    id: unknown;
    companyName: unknown;
    company_name: unknown;
    contactPerson: unknown;
    contact_person: unknown;
    email: unknown;
    phone: unknown;
    address: unknown;
    isActive: unknown;
    is_active: unknown;
    status: unknown;
    createdAt: unknown;
    created_at: unknown;
    updatedAt: unknown;
    updated_at: unknown;
}>;

type ClientsPayload = {
    data?: unknown;
    total?: unknown;
    page?: unknown;
    limit?: unknown;
    meta?: {
        total?: unknown;
        page?: unknown;
        limit?: unknown;
    };
};

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

function toStringValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number') {
        return String(value);
    }

    return '';
}

function toNumberValue(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function toOptionalNumberValue(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const parsed = toNumberValue(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
        return value as Record<string, unknown>;
    }
    return {};
}

function toBooleanValue(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === 'active' || normalized === 'aktif') {
            return true;
        }
        if (normalized === 'false' || normalized === 'inactive' || normalized === 'pasif') {
            return false;
        }
    }

    return null;
}

function normalizeClientRow(raw: unknown): ClientItem {
    const row = (raw ?? {}) as RawClientRow;
    const statusValue = toBooleanValue(row.status);
    const activeValue = toBooleanValue(row.isActive ?? row.is_active) ?? statusValue ?? true;

    return {
        id: toStringValue(row.id),
        companyName: toStringValue(row.companyName ?? row.company_name),
        contactPerson: toStringValue(row.contactPerson ?? row.contact_person),
        email: toStringValue(row.email),
        phone: toStringValue(row.phone) || null,
        address: toStringValue(row.address) || null,
        isActive: activeValue,
        createdAt: toStringValue(row.createdAt ?? row.created_at),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at),
    };
}

function normalizeWorkspaceProject(raw: unknown): ClientWorkspaceProject {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        name: toStringValue(row.name),
        status: toStringValue(row.status) || undefined,
        budget: toOptionalNumberValue(row.budget),
        description: toStringValue(row.description) || undefined,
        startDate: toStringValue(row.startDate) || undefined,
        deadline: toStringValue(row.deadline) || undefined,
        createdAt: toStringValue(row.createdAt) || undefined,
    };
}

function normalizeWorkspaceFeedback(raw: unknown): ClientWorkspaceFeedback {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        title: toStringValue(row.title),
        date: toStringValue(row.date) || undefined,
        durationMinutes: toOptionalNumberValue(row.durationMinutes),
        notes: toStringValue(row.notes) || undefined,
        summary: toStringValue(row.summary) || undefined,
        projectId: toStringValue(row.projectId) || undefined,
    };
}

function normalizeWorkspaceTicket(raw: unknown): ClientWorkspaceTicket {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        subject: toStringValue(row.subject),
        description: toStringValue(row.description) || undefined,
        type: toStringValue(row.type) || undefined,
        status: toStringValue(row.status) || undefined,
        priority: toStringValue(row.priority) || undefined,
        createdAt: toStringValue(row.createdAt) || undefined,
    };
}

function normalizeWorkspaceInvoice(raw: unknown): ClientWorkspaceInvoice {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        invoiceNumber: toStringValue(row.invoiceNumber) || undefined,
        projectId: toStringValue(row.projectId) || undefined,
        projectName: toStringValue(row.projectName) || undefined,
        status: toStringValue(row.status) || undefined,
        total: toOptionalNumberValue(row.total),
        issueDate: toStringValue(row.issueDate) || undefined,
        dueDate: toStringValue(row.dueDate) || undefined,
    };
}

function normalizeWorkspacePayment(raw: unknown): ClientWorkspacePayment {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        invoiceId: toStringValue(row.invoiceId ?? row.invoice_id) || undefined,
        amount: toOptionalNumberValue(row.amount),
        paymentDate: toStringValue(row.paymentDate ?? row.payment_date) || undefined,
        method: toStringValue(row.method) || undefined,
        currency: toStringValue(row.currency) || undefined,
        reference: toStringValue(row.reference) || undefined,
        notes: toStringValue(row.notes) || undefined,
        receiptUrl: toStringValue(row.receiptUrl ?? row.receipt_url) || undefined,
        recordedBy: toStringValue(row.recordedBy ?? row.recorded_by) || undefined,
        recordedByName: toStringValue(row.recordedByName ?? row.recorded_by_name) || undefined,
        createdAt: toStringValue(row.createdAt ?? row.created_at) || undefined,
    };
}

function normalizeWorkspaceContract(raw: unknown): ClientWorkspaceContract {
    const row = toRecord(raw);
    return {
        id: toStringValue(row.id),
        title: toStringValue(row.title),
        description: toStringValue(row.description) || undefined,
        status: toStringValue(row.status) || undefined,
        value: toOptionalNumberValue(row.value),
        startDate: toStringValue(row.startDate) || undefined,
        endDate: toStringValue(row.endDate) || undefined,
        createdAt: toStringValue(row.createdAt) || undefined,
    };
}

function normalizeClientWorkspace(raw: unknown): ClientWorkspaceResponse {
    const payload = toRecord(raw);
    const summary = toRecord(payload.summary);
    const finance = toRecord(payload.finance);
    const projects = Array.isArray(payload.projects) ? payload.projects.map(normalizeWorkspaceProject) : [];
    const feedbacks = Array.isArray(payload.feedbacks) ? payload.feedbacks.map(normalizeWorkspaceFeedback) : [];
    const tickets = Array.isArray(payload.tickets) ? payload.tickets.map(normalizeWorkspaceTicket) : [];
    const contracts = Array.isArray(payload.contracts) ? payload.contracts.map(normalizeWorkspaceContract) : [];
    const invoices = Array.isArray(finance.invoices) ? finance.invoices.map(normalizeWorkspaceInvoice) : [];
    const paymentsByInvoiceRaw = Array.isArray(finance.paymentsByInvoice) ? finance.paymentsByInvoice : [];

    return {
        client: normalizeClientRow(payload.client),
        summary: {
            totalProjects: toNumberValue(summary.totalProjects ?? projects.length),
            activeProjects: toNumberValue(summary.activeProjects),
            totalFeedbacks: toNumberValue(summary.totalFeedbacks ?? feedbacks.length),
            totalTickets: toNumberValue(summary.totalTickets ?? tickets.length),
            totalContracts: toNumberValue(summary.totalContracts ?? contracts.length),
            pendingInvoices: toNumberValue(summary.pendingInvoices),
            totalInvoiced: toNumberValue(summary.totalInvoiced ?? finance.totalInvoiced),
            totalCollected: toNumberValue(summary.totalCollected ?? finance.totalCollected),
            outstandingAmount: toNumberValue(summary.outstandingAmount ?? finance.outstandingAmount),
        },
        projects,
        feedbacks,
        tickets,
        finance: {
            invoices,
            paymentsByInvoice: paymentsByInvoiceRaw.map((rawItem) => {
                const row = toRecord(rawItem);
                const paymentsRaw = Array.isArray(row.payments) ? row.payments : [];
                return {
                    invoiceId: toStringValue(row.invoiceId),
                    payments: paymentsRaw.map(normalizeWorkspacePayment),
                };
            }),
            totalInvoiced: toNumberValue(finance.totalInvoiced),
            totalCollected: toNumberValue(finance.totalCollected),
            outstandingAmount: toNumberValue(finance.outstandingAmount),
        },
        contracts,
    };
}

export async function getClients(
    params: ClientListParams,
): Promise<PaginatedClientResponse> {
    const { data } = await api.get<MaybeWrapped<ClientsPayload>>('/clients', { params });
    const payload = unwrapData<ClientsPayload>(data);
    const rowsRaw = Array.isArray(payload?.data) ? payload.data : [];
    const rows = rowsRaw.map((row) => normalizeClientRow(row));
    const meta = (typeof payload?.meta === 'object' && payload.meta !== null) ? payload.meta : {};

    return {
        data: rows,
        total: typeof payload?.total === 'number'
            ? payload.total
            : typeof meta.total === 'number'
                ? meta.total
                : rows.length,
        page: typeof payload?.page === 'number'
            ? payload.page
            : typeof meta.page === 'number'
                ? meta.page
                : params.page ?? 1,
        limit: typeof payload?.limit === 'number'
            ? payload.limit
            : typeof meta.limit === 'number'
                ? meta.limit
                : params.limit ?? 20,
    };
}

export async function getClientById(id: string): Promise<ClientItem> {
    const { data } = await api.get<MaybeWrapped<RawClientRow>>(`/clients/${id}`);
    const payload = unwrapData<RawClientRow>(data);
    return normalizeClientRow(payload);
}

export async function createClient(payload: ClientCreatePayload): Promise<ClientItem> {
    const { data } = await api.post<MaybeWrapped<RawClientRow>>('/clients', payload);
    const response = unwrapData<RawClientRow>(data);
    return normalizeClientRow(response);
}

export async function updateClient(
    id: string,
    payload: ClientUpdatePayload,
): Promise<ClientItem> {
    const { data } = await api.put<MaybeWrapped<RawClientRow>>(
        `/clients/${id}`,
        payload,
    );
    const response = unwrapData<RawClientRow>(data);
    return normalizeClientRow(response);
}

export async function deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
}

export async function generatePortalAccess(
    payload: { email?: string; clientId?: string },
): Promise<ClientPortalAccessResponse> {
    const { data } = await api.post<MaybeWrapped<ClientPortalAccessResponse>>(
        `/clients/users/access-link`,
        payload,
    );

    const response = unwrapData<ClientPortalAccessResponse>(data);
    if (response.magicLink && !response.portalUrl) {
        return { ...response, portalUrl: response.magicLink };
    }
    return response;
}

export async function getClientWorkspace(id: string): Promise<ClientWorkspaceResponse> {
    const { data } = await api.get<MaybeWrapped<ClientWorkspaceResponse>>(`/clients/${id}/workspace`);
    const payload = unwrapData<ClientWorkspaceResponse>(data);
    return normalizeClientWorkspace(payload);
}

function normalizeLandingContactRequest(raw: unknown): LandingContactRequestItem {
    const row = toRecord(raw);
    const normalizeStatus = toStringValue(row.status).toUpperCase();
    const status: LandingContactRequestStatus = normalizeStatus === 'APPROVED'
        ? 'APPROVED'
        : normalizeStatus === 'REJECTED'
            ? 'REJECTED'
            : 'PENDING';

    return {
        id: toStringValue(row.id),
        fullName: toStringValue(row.fullName ?? row.full_name),
        email: toStringValue(row.email),
        phone: toStringValue(row.phone) || null,
        company: toStringValue(row.company) || null,
        subject: toStringValue(row.subject),
        message: toStringValue(row.message),
        status,
        source: toStringValue(row.source) || 'LANDING',
        reason: toStringValue(row.reason) || null,
        reviewedBy: toStringValue(row.reviewedBy ?? row.reviewed_by) || null,
        reviewedAt: toStringValue(row.reviewedAt ?? row.reviewed_at) || null,
        linkedClientId: toStringValue(row.linkedClientId ?? row.linked_client_id) || null,
        createdAt: toStringValue(row.createdAt ?? row.created_at),
        updatedAt: toStringValue(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at),
    };
}

export async function getLandingContactRequests(
    params: LandingContactRequestListParams = {},
): Promise<LandingContactRequestListResponse> {
    const { data } = await api.get<MaybeWrapped<{
        data?: unknown[];
        meta?: {
            total?: unknown;
            page?: unknown;
            limit?: unknown;
        };
    }>>('/landing/contact-requests', { params });

    const payload = unwrapData<{
        data?: unknown[];
        meta?: {
            total?: unknown;
            page?: unknown;
            limit?: unknown;
        };
    }>(data);
    const rows = Array.isArray(payload?.data)
        ? payload.data.map(normalizeLandingContactRequest)
        : [];
    const meta = payload?.meta ?? {};

    return {
        data: rows,
        total: toNumberValue(meta.total ?? rows.length),
        page: toNumberValue(meta.page ?? params.page ?? 1) || 1,
        limit: toNumberValue(meta.limit ?? params.limit ?? 20) || 20,
    };
}

export async function approveLandingContactRequest(id: string): Promise<LandingContactRequestItem> {
    const { data } = await api.patch<MaybeWrapped<unknown>>(`/landing/contact-requests/${id}/approve`);
    const payload = unwrapData<unknown>(data);
    return normalizeLandingContactRequest(payload);
}

export async function rejectLandingContactRequest(
    id: string,
    payload?: { reason?: string },
): Promise<LandingContactRequestItem> {
    const { data } = await api.patch<MaybeWrapped<unknown>>(
        `/landing/contact-requests/${id}/reject`,
        payload ?? {},
    );
    const responsePayload = unwrapData<unknown>(data);
    return normalizeLandingContactRequest(responsePayload);
}
