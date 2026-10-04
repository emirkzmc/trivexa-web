import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Copy,
    Download,
    FolderOpen,
    HardDriveUpload,
    Search,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/store/authStore';
import { getContracts } from '../../contracts/api/contracts.api';
import { getDepartments } from '../../departments/api/departments.api';
import { getExpenses } from '../../finance/api/expenses.api';
import { getInvoices } from '../../finance/api/invoices.api';
import { getProjects } from '../../projects/api/projects.api';
import { getTickets } from '../../tickets/api/tickets.api';
import { PageHeader } from '../../../shared/components/PageHeader';
import { formatDate } from '../../../shared/utils/formatDate';
import {
    downloadFile,
    getFiles,
    getFileMetadata,
    type FileMetadata,
    type FileUploadMetadata,
    uploadFile,
} from '../api/files.api';

type EntityType = '' | 'PROJECT' | 'INVOICE' | 'CONTRACT' | 'TICKET' | 'EXPENSE';

interface EntityOption {
    value: string;
    label: string;
    meta?: string;
}

interface FileContextInfo {
    department?: string;
    autoPath?: string;
    entityLabel?: string;
}

const ENTITY_TYPE_OPTIONS: Array<{ label: string; value: EntityType }> = [
    { label: 'Seciniz', value: '' },
    { label: 'Project', value: 'PROJECT' },
    { label: 'Invoice', value: 'INVOICE' },
    { label: 'Contract', value: 'CONTRACT' },
    { label: 'Ticket', value: 'TICKET' },
    { label: 'Expense', value: 'EXPENSE' },
];

const ENTITY_ACCESS_ROLES: Partial<Record<Exclude<EntityType, ''>, string[]>> = {
    INVOICE: ['ADMIN', 'MANAGER', 'ACCOUNTING', 'SOCIAL_MEDIA'],
    CONTRACT: ['ADMIN', 'MANAGER'],
    EXPENSE: ['ADMIN', 'MANAGER', 'ACCOUNTING', 'SOCIAL_MEDIA'],
};

function canLoadEntityType(role: string | undefined, entityType: EntityType): boolean {
    if (!entityType) return true;

    const allowedRoles = ENTITY_ACCESS_ROLES[entityType as Exclude<EntityType, ''>];
    if (!allowedRoles) return true;
    if (!role) return false;

    return allowedRoles.includes(role.toUpperCase());
}

function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;

    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);
    return `${rounded} ${units[unitIndex]}`;
}

function formatAmount(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency || 'TRY',
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${amount.toLocaleString('tr-TR')} ${currency || 'TRY'}`;
    }
}

function mergeById(list: FileMetadata[], item: FileMetadata): FileMetadata[] {
    const existingIndex = list.findIndex((row) => row.id === item.id);
    if (existingIndex === -1) return [item, ...list];

    const next = [...list];
    next[existingIndex] = item;
    return next;
}

function sortOptions(options: EntityOption[]): EntityOption[] {
    return [...options].sort((left, right) => left.label.localeCompare(right.label, 'tr'));
}

function dedupeOptions(options: EntityOption[]): EntityOption[] {
    const map = new Map<string, EntityOption>();
    options.forEach((option) => {
        if (!option.value) return;
        if (!map.has(option.value)) {
            map.set(option.value, option);
        }
    });
    return Array.from(map.values());
}

function toPathSegment(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'genel';
}

function buildAutoPath(
    department: string,
    entityType: string,
    entityId: string,
): string {
    const dateSegment = new Date().toISOString().slice(0, 10);
    const departmentSegment = toPathSegment(department || 'genel');
    const typeSegment = toPathSegment(entityType || 'dosya');
    const entitySegment = toPathSegment(entityId || 'kayit-yok');
    return `${departmentSegment}/${typeSegment}/${entitySegment}/${dateSegment}`;
}

async function loadProjectOptions(): Promise<EntityOption[]> {
    const response = await getProjects({ page: 1, limit: 100 });
    const options = response.data.map((project) => ({
        value: project.id,
        label: project.name,
        meta: `Durum: ${project.status}`,
    }));

    return sortOptions(dedupeOptions(options));
}

async function loadInvoiceOptions(): Promise<EntityOption[]> {
    const invoices = await getInvoices({ limit: 100 });
    const options = invoices.map((invoice) => ({
        value: invoice.id,
        label: invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`,
        meta: `${invoice.clientName || 'Musteri yok'} - ${invoice.status}`,
    }));

    return sortOptions(dedupeOptions(options));
}

async function loadContractOptions(): Promise<EntityOption[]> {
    const response = await getContracts({ page: 1, limit: 100 });
    const options = response.data.map((contract) => ({
        value: contract.id,
        label: contract.title,
        meta: `Durum: ${contract.status}`,
    }));

    return sortOptions(dedupeOptions(options));
}

async function loadTicketOptions(): Promise<EntityOption[]> {
    const response = await getTickets({ page: 1, limit: 100 });
    const options = response.data.map((ticket) => ({
        value: ticket.id,
        label: ticket.subject,
        meta: `${ticket.status} - ${ticket.priority}`,
    }));

    return sortOptions(dedupeOptions(options));
}

async function loadExpenseOptions(): Promise<EntityOption[]> {
    const expenses = await getExpenses();
    const options = expenses.map((expense) => ({
        value: expense.id,
        label: expense.description || `Gider ${expense.id.slice(0, 8)}`,
        meta: `${formatAmount(expense.amount, expense.currency)} - ${expense.category}`,
    }));

    return sortOptions(dedupeOptions(options));
}

async function loadEntityOptions(entityType: EntityType): Promise<EntityOption[]> {
    if (!entityType) return [];

    switch (entityType) {
        case 'PROJECT':
            return loadProjectOptions();
        case 'INVOICE':
            return loadInvoiceOptions();
        case 'CONTRACT':
            return loadContractOptions();
        case 'TICKET':
            return loadTicketOptions();
        case 'EXPENSE':
            return loadExpenseOptions();
        default:
            return [];
    }
}

export function FilesManagementPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const queryClient = useQueryClient();
    const userRole = useAuthStore((state) => state.user?.role?.toUpperCase());
    const currentUserId = useAuthStore((state) => state.user?.id ?? '');
    const userDepartment = useAuthStore((state) => state.user?.department ?? '');
    const isAdmin = userRole === 'ADMIN';

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [metadata, setMetadata] = useState<FileUploadMetadata>({
        entityType: '',
        entityId: '',
    });
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [entityTypeFilter, setEntityTypeFilter] = useState('');
    const [uploaderFilter, setUploaderFilter] = useState<'ALL' | 'MINE'>('ALL');
    const [lookupId, setLookupId] = useState('');
    const [search, setSearch] = useState('');
    const [records, setRecords] = useState<FileMetadata[]>([]);
    const [fileContextMap, setFileContextMap] = useState<Record<string, FileContextInfo>>({});
    const [focusedRecord, setFocusedRecord] = useState<FileMetadata | null>(null);
    const [downloadingId, setDownloadingId] = useState('');

    const selectedEntityType = (metadata.entityType ?? '') as EntityType;
    const canLoadSelectedType = canLoadEntityType(userRole, selectedEntityType);

    const entityOptionsQuery = useQuery({
        queryKey: ['file-entity-options', selectedEntityType, userRole],
        queryFn: () => loadEntityOptions(selectedEntityType),
        enabled: Boolean(selectedEntityType) && canLoadSelectedType,
        staleTime: 60_000,
    });
    const filesQuery = useQuery({
        queryKey: ['files', 'list'],
        queryFn: () => getFiles({ page: 1, limit: 500 }),
        staleTime: 60_000,
    });
    const departmentsQuery = useQuery({
        queryKey: ['departments', 'files'],
        queryFn: getDepartments,
        staleTime: 300_000,
    });

    const entityOptions = useMemo(() => entityOptionsQuery.data || [], [entityOptionsQuery.data]);
    const departmentOptions = useMemo(
        () => (departmentsQuery.data ?? [])
            .map((department) => department.name)
            .filter((name) => !!name.trim())
            .sort((a, b) => a.localeCompare(b, 'tr')),
        [departmentsQuery.data],
    );
    const autoUploadPath = useMemo(
        () => buildAutoPath(selectedDepartment, selectedEntityType, metadata.entityId ?? ''),
        [selectedDepartment, selectedEntityType, metadata.entityId],
    );

    const selectedEntityOption = useMemo(
        () => entityOptions.find((option) => option.value === metadata.entityId) ?? null,
        [entityOptions, metadata.entityId],
    );

    useEffect(() => {
        if (filesQuery.data) {
            setRecords(filesQuery.data);
        }
    }, [filesQuery.data]);

    useEffect(() => {
        if (!selectedDepartment && userDepartment.trim()) {
            setSelectedDepartment(userDepartment.trim());
        }
    }, [selectedDepartment, userDepartment]);

    useEffect(() => {
        setMetadata((prev) => {
            if (!prev.entityId) return prev;
            return { ...prev, entityId: '' };
        });
    }, [selectedEntityType]);

    useEffect(() => {
        if (!selectedEntityType || entityOptions.length === 0) return;

        setMetadata((prev) => {
            if ((prev.entityType ?? '') !== selectedEntityType) {
                return prev;
            }

            const isCurrentIdValid = entityOptions.some((option) => option.value === prev.entityId);
            const nextId = isCurrentIdValid ? prev.entityId : entityOptions[0].value;
            if (nextId === prev.entityId) {
                return prev;
            }

            return {
                ...prev,
                entityId: nextId,
            };
        });
    }, [entityOptions, selectedEntityType]);

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile) {
                throw new Error('Dosya secilmedi.');
            }

            return uploadFile(selectedFile, {
                entityType: metadata.entityType || undefined,
                entityId: metadata.entityId || undefined,
                folderPath: autoUploadPath || undefined,
            });
        },
        onSuccess: (uploaded) => {
            setRecords((prev) => mergeById(prev, uploaded));
            setFocusedRecord(uploaded);
            setLookupId(uploaded.id);
            setFileContextMap((prev) => ({
                ...prev,
                [uploaded.id]: {
                    department: selectedDepartment || undefined,
                    autoPath: autoUploadPath,
                    entityLabel: selectedEntityOption?.label || undefined,
                },
            }));
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            void queryClient.invalidateQueries({ queryKey: ['files', 'list'] });
            toast.success('Dosya yuklendi.');
        },
    });

    const metadataMutation = useMutation({
        mutationFn: (id: string) => getFileMetadata(id),
        onSuccess: (file) => {
            setRecords((prev) => mergeById(prev, file));
            setFocusedRecord(file);
            void queryClient.invalidateQueries({ queryKey: ['files', 'list'] });
            toast.success('Dosya bilgisi alindi.');
        },
    });

    function getResolvedAutoPath(item: FileMetadata): string {
        const context = fileContextMap[item.id];
        if (context?.autoPath) {
            return context.autoPath;
        }

        return buildAutoPath(
            context?.department || 'genel',
            item.entityType || 'DOSYA',
            item.entityId || item.id,
        );
    }

    const visibleRecords = useMemo(() => {
        if (isAdmin) return records;
        if (!userRole) return [];

        return records.filter((item) => {
            if (item.uploadedBy && item.uploadedBy === currentUserId) {
                return true;
            }
            if (item.isPublic) {
                return true;
            }
            const recordType = (item.entityType ?? '') as EntityType;
            return canLoadEntityType(userRole, recordType);
        });
    }, [records, userRole, currentUserId, isAdmin]);

    const filteredRecords = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('tr');
        const departmentTerm = departmentFilter.trim().toLocaleLowerCase('tr');
        const entityTypeTerm = entityTypeFilter.trim().toUpperCase();

        return visibleRecords.filter((item) => {
            const context = fileContextMap[item.id];
            const departmentLabel = context?.department ?? '';
            if (departmentTerm && departmentLabel.toLocaleLowerCase('tr') !== departmentTerm) {
                return false;
            }
            if (entityTypeTerm && (item.entityType ?? '').toUpperCase() !== entityTypeTerm) {
                return false;
            }
            if (uploaderFilter === 'MINE' && item.uploadedBy !== currentUserId) {
                return false;
            }

            const resolvedPath = getResolvedAutoPath(item);

            const haystack = [
                item.fileName,
                item.id,
                item.entityType ?? '',
                item.entityId ?? '',
                item.uploadedBy ?? '',
                context?.entityLabel ?? '',
                context?.department ?? '',
                resolvedPath,
            ]
                .join(' ')
                .toLocaleLowerCase('tr');

            return !term || haystack.includes(term);
        });
    }, [
        visibleRecords,
        search,
        departmentFilter,
        fileContextMap,
        entityTypeFilter,
        uploaderFilter,
        currentUserId,
    ]);

    const totalBytes = useMemo(
        () => visibleRecords.reduce((sum, item) => sum + (Number.isFinite(item.size) ? item.size : 0), 0),
        [visibleRecords],
    );

    async function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedFile) {
            toast.error('Lutfen bir dosya secin.');
            return;
        }
        if (!selectedDepartment.trim()) {
            toast.error('Lutfen bir departman secin.');
            return;
        }

        if (selectedEntityType && !metadata.entityId) {
            toast.error('Secilen type icin bir kayit secin.');
            return;
        }

        await uploadMutation.mutateAsync();
    }

    async function handleMetadataSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedId = lookupId.trim();

        if (!trimmedId) {
            toast.error('Dosya ID girin.');
            return;
        }

        await metadataMutation.mutateAsync(trimmedId);
    }

    async function handleDownload(item: FileMetadata) {
        if (downloadingId) return;
        setDownloadingId(item.id);

        try {
            await downloadFile(item.id, item.fileName || undefined);
            toast.success('Indirme baslatildi.');
        } finally {
            setDownloadingId('');
        }
    }

    async function handleCopyId(id: string) {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            toast.error('Panoya kopyalama desteklenmiyor.');
            return;
        }

        await navigator.clipboard.writeText(id);
        toast.success('ID kopyalandi.');
    }

    function clearSelectedFile() {
        setSelectedFile(null);
        setIsDragActive(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function applySelectedFile(file: File | null) {
        if (!file) return;
        setSelectedFile(file);
    }

    function handleDropZoneDragOver(event: React.DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(true);
    }

    function handleDropZoneDragLeave(event: React.DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(false);
    }

    function handleDropZoneDrop(event: React.DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(false);
        applySelectedFile(event.dataTransfer.files?.[0] ?? null);
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<FolderOpen size={20} color="var(--role-accent-600)" />}
                title="Dosya Yonetimi"
                subtitle="Entity type secimine gore sistemden kayit secerek dosya eslestirin."
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Kayit</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{visibleRecords.length}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Toplam Boyut</p>
                    <p className="mt-2 text-2xl font-bold text-blue-800">{formatFileSize(totalBytes)}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Secili Kayit</p>
                    <p className="mt-2 truncate text-sm font-bold text-emerald-800">
                        {selectedEntityOption?.label || '-'}
                    </p>
                </div>
            </section>

            <section className="mb-4 grid gap-4 lg:grid-cols-2">
                <form
                    onSubmit={handleUploadSubmit}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">Dosya Yukle</h2>
                        <HardDriveUpload size={16} className="text-[color:var(--role-accent-600)]" />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                Dosya
                            </label>
                            <label
                                onDragOver={handleDropZoneDragOver}
                                onDragLeave={handleDropZoneDragLeave}
                                onDrop={handleDropZoneDrop}
                                className={`group relative block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed p-5 text-center transition ${
                                    isDragActive
                                        ? 'border-[color:var(--role-accent-500)] bg-[color:var(--role-accent-soft)]'
                                        : 'border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:border-[color:var(--role-accent-400)] hover:bg-[color:var(--role-accent-soft)]'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={(event) => {
                                        applySelectedFile(event.target.files?.[0] ?? null);
                                    }}
                                    className="hidden"
                                />

                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-[color:var(--role-accent-600)] shadow-sm ring-1 ring-[color:var(--role-accent-200)]">
                                    <HardDriveUpload size={20} />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-gray-900">
                                    Dosyayi buraya birakin veya secmek icin tiklayin
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Tek dosya yuklenir. Surukle-birak desteklenir.
                                </p>
                            </label>

                            {selectedFile && (
                                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-emerald-900">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-emerald-700">
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearSelectedFile}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-300 bg-white text-emerald-700 transition hover:bg-emerald-100"
                                        aria-label="Secili dosyayi temizle"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                    Entity Type
                                </label>
                                <select
                                    value={selectedEntityType}
                                    onChange={(event) => {
                                        setMetadata((prev) => ({ ...prev, entityType: event.target.value }));
                                    }}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                                >
                                    {ENTITY_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value || 'empty'} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                    Entity ID
                                </label>
                                <select
                                    value={metadata.entityId ?? ''}
                                    onChange={(event) => {
                                        setMetadata((prev) => ({ ...prev, entityId: event.target.value }));
                                    }}
                                    disabled={
                                        !selectedEntityType
                                        || !canLoadSelectedType
                                        || entityOptionsQuery.isLoading
                                        || entityOptions.length === 0
                                    }
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                                >
                                    <option value="">
                                        {!selectedEntityType
                                            ? 'Once entity type secin'
                                            : !canLoadSelectedType
                                                ? 'Bu type icin yetkiniz yok'
                                                : entityOptionsQuery.isLoading
                                                    ? 'Kayitlar yukleniyor...'
                                                    : entityOptions.length === 0
                                                        ? 'Kayit bulunamadi'
                                                        : 'Kayit secin'}
                                    </option>
                                    {entityOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                {selectedEntityOption?.meta && (
                                    <p className="mt-1 truncate text-[11px] text-gray-500">
                                        {selectedEntityOption.meta}
                                    </p>
                                )}

                                {selectedEntityType && !canLoadSelectedType && (
                                    <p className="mt-1 text-[11px] text-amber-600">
                                        {selectedEntityType} kayitlarina erisim rol yetkinizde yok.
                                    </p>
                                )}

                                {selectedEntityType && canLoadSelectedType && entityOptionsQuery.isError && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                        Kayit listesi alinamadi. Lutfen tekrar deneyin.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                Departman
                            </label>
                            <select
                                value={selectedDepartment}
                                onChange={(event) => setSelectedDepartment(event.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                            >
                                <option value="">
                                    {departmentsQuery.isLoading ? 'Departmanlar yukleniyor...' : 'Departman secin'}
                                </option>
                                {departmentOptions.map((department) => (
                                    <option key={department} value={department}>
                                        {department}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                Otomatik Path
                            </label>
                            <input
                                value={autoUploadPath}
                                readOnly
                                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-xs text-gray-700 outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            type="submit"
                            disabled={uploadMutation.isPending || !selectedFile}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[color:var(--role-accent-600)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--role-accent-700)] disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            <HardDriveUpload size={14} />
                            {uploadMutation.isPending ? 'Yukleniyor...' : 'Dosya Yukle'}
                        </button>
                    </div>
                </form>

                <form
                    onSubmit={handleMetadataSubmit}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">ID ile Dosya Bul</h2>
                        <Search size={16} className="text-[color:var(--role-accent-600)]" />
                    </div>

                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                        Dosya ID
                    </label>
                    <div className="flex gap-2">
                        <input
                            value={lookupId}
                            onChange={(event) => setLookupId(event.target.value)}
                            placeholder="uuid girin"
                            className="h-9 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        />
                        <button
                            type="submit"
                            disabled={metadataMutation.isPending}
                            className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            {metadataMutation.isPending ? 'Sorgulaniyor...' : 'Getir'}
                        </button>
                    </div>

                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        {!focusedRecord ? (
                            <p className="text-sm text-gray-500">Henuz secili dosya yok.</p>
                        ) : (
                            <div className="space-y-1 text-sm text-gray-700">
                                <p><span className="font-semibold text-gray-900">Ad:</span> {focusedRecord.fileName}</p>
                                <p><span className="font-semibold text-gray-900">ID:</span> {focusedRecord.id}</p>
                                <p><span className="font-semibold text-gray-900">Boyut:</span> {formatFileSize(focusedRecord.size)}</p>
                                <p><span className="font-semibold text-gray-900">Entity:</span> {focusedRecord.entityType || '-'} / {focusedRecord.entityId || '-'}</p>
                                <p><span className="font-semibold text-gray-900">Departman:</span> {fileContextMap[focusedRecord.id]?.department || 'Belirsiz'}</p>
                                <p className="truncate"><span className="font-semibold text-gray-900">Path:</span> {getResolvedAutoPath(focusedRecord)}</p>
                                <p><span className="font-semibold text-gray-900">Tarih:</span> {formatDate(focusedRecord.createdAt)}</p>
                            </div>
                        )}
                    </div>
                </form>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-900">Tum Dosyalar</h2>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                        <select
                            value={uploaderFilter}
                            onChange={(event) => setUploaderFilter(event.target.value as 'ALL' | 'MINE')}
                            className="h-9 min-w-[140px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            <option value="ALL">Tum Yukleyenler</option>
                            <option value="MINE">Sadece Benim</option>
                        </select>
                        <select
                            value={entityTypeFilter}
                            onChange={(event) => setEntityTypeFilter(event.target.value)}
                            className="h-9 min-w-[150px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            <option value="">Tum Entity Type</option>
                            {ENTITY_TYPE_OPTIONS.filter((option) => !!option.value).map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={departmentFilter}
                            onChange={(event) => setDepartmentFilter(event.target.value)}
                            className="h-9 min-w-[190px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            <option value="">Tum Departmanlar</option>
                            {departmentOptions.map((department) => (
                                <option key={department} value={department}>
                                    {department}
                                </option>
                            ))}
                        </select>
                        <div className="flex w-full min-w-[260px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5">
                            <Search size={14} className="text-gray-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Dosya adi, entity, path veya ID ara..."
                                className="h-9 flex-1 border-0 bg-transparent text-sm outline-none"
                            />
                        </div>
                    </div>
                </div>

                {filesQuery.isLoading && visibleRecords.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                        Dosyalar yukleniyor...
                    </div>
                ) : filesQuery.isError && visibleRecords.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-red-300 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
                        Dosya listesi alinamadi. Lutfen tekrar deneyin.
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                        Liste bos. Dosya yukleyin veya ID ile sorgulayin.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                            <thead>
                                <tr className="text-xs uppercase tracking-[0.08em] text-gray-500">
                                    <th className="px-3 py-2 font-semibold">Dosya</th>
                                    <th className="px-3 py-2 font-semibold">Aitlik</th>
                                    <th className="px-3 py-2 font-semibold">Departman / Path</th>
                                    <th className="px-3 py-2 font-semibold">Boyut</th>
                                    <th className="px-3 py-2 font-semibold">Yuklenme</th>
                                    <th className="px-3 py-2 font-semibold text-right">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecords.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2">
                                            <p className="m-0 font-semibold text-gray-900">{item.fileName || '-'}</p>
                                            <p className="m-0 text-xs text-gray-500">{item.id}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="m-0 text-gray-800">{item.entityType || '-'}</p>
                                            <p className="m-0 text-xs text-gray-500">
                                                {fileContextMap[item.id]?.entityLabel || item.entityId || '-'}
                                            </p>
                                            <p className="m-0 text-[11px] text-gray-500">
                                                Yukleyen: {item.uploadedBy || '-'}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="m-0 text-gray-800">
                                                {fileContextMap[item.id]?.department || 'Belirsiz'}
                                            </p>
                                            <p className="m-0 truncate font-mono text-[11px] text-gray-500">
                                                {getResolvedAutoPath(item)}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">{formatFileSize(item.size)}</td>
                                        <td className="px-3 py-2 text-gray-700">{formatDate(item.createdAt)}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyId(item.id)}
                                                    className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <Copy size={12} />
                                                    ID
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDownload(item)}
                                                    disabled={downloadingId === item.id}
                                                    className="inline-flex h-8 items-center gap-1 rounded-md bg-[color:var(--role-accent-600)] px-2 text-xs font-semibold text-white transition hover:bg-[color:var(--role-accent-700)] disabled:cursor-not-allowed disabled:bg-gray-300"
                                                >
                                                    <Download size={12} />
                                                    {downloadingId === item.id ? '...' : 'Indir'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
