import portalApi from '../lib/portalAxios';
import type { Customer } from '../store/portalStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PortalProject {
    id: string;
    name: string;
    status: string;
    progress: number;
    startDate: string;
    endDate: string;
}

export interface PortalRequest {
    id: string;
    type: 'REQUEST' | 'CONTENT_REQUEST' | 'BUG';
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: string;
    createdAt: string;
}

export interface PortalRequestPayload {
    type: 'REQUEST' | 'CONTENT_REQUEST' | 'BUG';
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    folderId?: string; // Dosya eklenmişse backend'den dönen klsör/dosya ID
}

export interface PortalApproval {
    id: string;
    title: string;
    type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
    dueDate: string;
    createdAt: string;
}

export interface PortalMeetingNote {
    id: string;
    title: string;
    content: string;
    meetingDate: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function validatePortalToken(token: string): Promise<Customer> {
    const { data } = await portalApi.get<{ data: Customer }>(`/validate/${token}`);
    return data.data;
}

export async function getProjects(): Promise<PortalProject[]> {
    const { data } = await portalApi.get<{ data: PortalProject[] }>('/projects');
    return data.data;
}

export async function getRequests(): Promise<PortalRequest[]> {
    const { data } = await portalApi.get<{ data: PortalRequest[] }>('/requests');
    return data.data;
}

export async function createRequest(payload: PortalRequestPayload): Promise<PortalRequest> {
    const { data } = await portalApi.post<{ data: PortalRequest }>('/requests', payload);
    return data.data;
}

export async function getApprovals(): Promise<PortalApproval[]> {
    const { data } = await portalApi.get<{ data: PortalApproval[] }>('/approvals');
    return data.data;
}

export async function approveItem(id: string): Promise<void> {
    await portalApi.patch(`/approvals/${id}/approve`);
}

export async function requestRevision(id: string, note: string): Promise<void> {
    await portalApi.patch(`/approvals/${id}/revision`, { note });
}

export async function getMeetingNotes(): Promise<PortalMeetingNote[]> {
    const { data } = await portalApi.get<{ data: PortalMeetingNote[] }>('/meeting-notes');
    return data.data;
}
