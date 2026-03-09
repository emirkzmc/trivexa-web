import api from '../../../shared/lib/axios';

export interface FileMetadata {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    entityType?: string;
    entityId?: string;
    folderPath?: string;
    isPublic: boolean;
    filePath: string;
    uploadedBy: string;
    createdAt: string;
}

export interface FileUploadMetadata {
    entityType?: string;
    entityId?: string;
    folderPath?: string;
    isPublic?: boolean;
}

type RawFileMetadata = Partial<{
    id: unknown;
    fileName: unknown;
    file_name: unknown;
    original_name: unknown;
    mimeType: unknown;
    mime_type: unknown;
    size: unknown;
    entityType: unknown;
    entity_type: unknown;
    entityId: unknown;
    entity_id: unknown;
    folderPath: unknown;
    folder_path: unknown;
    isPublic: unknown;
    is_public: unknown;
    filePath: unknown;
    file_path: unknown;
    uploadedBy: unknown;
    uploaded_by: unknown;
    createdAt: unknown;
    created_at: unknown;
}>;

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

function toBooleanValue(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1';
    }

    if (typeof value === 'number') {
        return value > 0;
    }

    return false;
}

function normalizeFileMetadata(raw: unknown): FileMetadata {
    const row = (raw ?? {}) as RawFileMetadata;

    return {
        id: toStringValue(row.id),
        fileName: toStringValue(row.fileName ?? row.file_name ?? row.original_name),
        mimeType: toStringValue(row.mimeType ?? row.mime_type),
        size: toNumberValue(row.size),
        entityType: toStringValue(row.entityType ?? row.entity_type) || undefined,
        entityId: toStringValue(row.entityId ?? row.entity_id) || undefined,
        folderPath: toStringValue(row.folderPath ?? row.folder_path) || undefined,
        isPublic: toBooleanValue(row.isPublic ?? row.is_public),
        filePath: toStringValue(row.filePath ?? row.file_path),
        uploadedBy: toStringValue(row.uploadedBy ?? row.uploaded_by),
        createdAt: toStringValue(row.createdAt ?? row.created_at),
    };
}

export async function uploadFile(
    file: File,
    metadata: FileUploadMetadata,
): Promise<FileMetadata> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata.entityType) formData.append('entityType', metadata.entityType);
    if (metadata.entityId) formData.append('entityId', metadata.entityId);

    const { data } = await api.post<MaybeWrapped<RawFileMetadata>>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    const payload = unwrapData<RawFileMetadata>(data);
    return normalizeFileMetadata(payload);
}

export async function getFileMetadata(id: string): Promise<FileMetadata> {
    const { data } = await api.get<MaybeWrapped<RawFileMetadata>>(`/files/${id}`);
    const payload = unwrapData<RawFileMetadata>(data);
    return normalizeFileMetadata(payload);
}

export function getFileDownloadUrl(id: string): string {
    const basePath = (api.defaults.baseURL ?? '').replace(/\/$/, '');
    return `${basePath}/files/${id}/download`;
}

export async function downloadFile(id: string, fallbackName?: string): Promise<void> {
    const response = await api.get<Blob>(`/files/${id}/download`, {
        responseType: 'blob',
    });

    const blob = response.data;
    const blobUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fallbackName || `file-${id}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(blobUrl);
}
