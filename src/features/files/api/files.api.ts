import api from '../../../shared/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── API Functions ───────────────────────────────────────────────────────────

export async function uploadFile(
    file: File,
    metadata: FileUploadMetadata,
): Promise<FileMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.entityType) formData.append('entityType', metadata.entityType);
    if (metadata.entityId) formData.append('entityId', metadata.entityId);
    if (metadata.folderPath) formData.append('folderPath', metadata.folderPath);
    if (metadata.isPublic !== undefined) formData.append('isPublic', String(metadata.isPublic));

    const { data } = await api.post<{ data: FileMetadata }>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
}

export async function getFileMetadata(id: string): Promise<FileMetadata> {
    const { data } = await api.get<{ data: FileMetadata }>(`/files/${id}`);
    return data.data;
}

export function getFileDownloadUrl(id: string): string {
    return `/files/${id}/download`;
}
