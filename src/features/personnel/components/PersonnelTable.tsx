import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, UserCheck, UserX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { DEPARTMENT_LABELS } from '../../../shared/constants/departments';
import { ROLE_LABELS } from '../../../shared/constants/roleLabels';
import type { PersonnelItem } from '../api/personnel.api';

interface PersonnelTableProps {
    data: PersonnelItem[];
    isLoading: boolean;
    isError: boolean;
    hasFilters: boolean;
    onEdit: (item: PersonnelItem) => void;
    onToggleActive: (item: PersonnelItem) => void;
}

type TableSortField = 'name' | 'email' | 'role' | 'department' | 'isActive';
type SortDirection = 'asc' | 'desc';
type TableColumnKey = 'name' | 'email' | 'role' | 'department' | 'status';

const MIN_COLUMN_WIDTH = 90;
const ACTION_BASE_WIDTH = 160;
const AUTO_MIN_COLUMN_WIDTH = 72;
const INITIAL_COLUMN_WIDTHS: Record<TableColumnKey, number> = {
    name: 360,
    email: 260,
    role: 170,
    department: 230,
    status: 140,
};
const RESIZABLE_COLUMN_COUNT = Object.keys(INITIAL_COLUMN_WIDTHS).length;
const COLUMN_ORDER: TableColumnKey[] = ['name', 'email', 'role', 'department', 'status'];

function getFullName(item: PersonnelItem) {
    return `${item.firstName} ${item.lastName}`.trim();
}

function normalizeRole(role: string) {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
}

function normalizeDepartment(item: PersonnelItem) {
    return DEPARTMENT_LABELS[item.department as keyof typeof DEPARTMENT_LABELS] ?? item.department ?? '-';
}

function SortIcon({
    active,
    direction,
}: {
    active: boolean;
    direction: SortDirection;
}) {
    if (!active) {
        return <ArrowUpDown size={13} className="text-gray-400" />;
    }
    return direction === 'asc'
        ? <ArrowUp size={13} className="text-red-600" />
        : <ArrowDown size={13} className="text-red-600" />;
}

export function PersonnelTable({
    data,
    isLoading,
    isError,
    hasFilters,
    onEdit,
    onToggleActive,
}: PersonnelTableProps) {
    const [sortField, setSortField] = useState<TableSortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [columnWidths, setColumnWidths] = useState<Record<TableColumnKey, number>>(INITIAL_COLUMN_WIDTHS);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const resizeStateRef = useRef<{
        column: TableColumnKey;
        adjacentColumn: TableColumnKey;
        startX: number;
        startWidth: number;
        startAdjacentWidth: number;
    } | null>(null);

    const resizeColumnsToContainer = useCallback((containerWidth: number) => {
        if (containerWidth <= 0) {
            return;
        }

        const targetTotal = Math.round(
            Math.max(AUTO_MIN_COLUMN_WIDTH * RESIZABLE_COLUMN_COUNT, containerWidth - ACTION_BASE_WIDTH),
        );

        setColumnWidths((prev) => {
            const prevTotal = Object.values(prev).reduce((sum, width) => sum + width, 0);
            if (prevTotal <= 0 || Math.abs(prevTotal - targetTotal) < 1) {
                return prev;
            }

            const ratio = targetTotal / prevTotal;
            const nextEntries = (Object.entries(prev) as Array<[TableColumnKey, number]>)
                .map(([key, width]) => [key, Math.max(AUTO_MIN_COLUMN_WIDTH, Math.round(width * ratio))] as const);
            const nextTotal = nextEntries.reduce((sum, [, width]) => sum + width, 0);
            const delta = targetTotal - nextTotal;

            if (delta !== 0) {
                const [firstKey, firstWidth] = nextEntries[0];
                nextEntries[0] = [firstKey, Math.max(AUTO_MIN_COLUMN_WIDTH, firstWidth + delta)];
            }

            const next = Object.fromEntries(nextEntries) as Record<TableColumnKey, number>;
            const unchanged = (Object.keys(prev) as TableColumnKey[]).every((key) => prev[key] === next[key]);
            return unchanged ? prev : next;
        });
    }, []);

    useEffect(() => {
        function handleMouseMove(event: MouseEvent) {
            const active = resizeStateRef.current;
            if (!active) {
                return;
            }

            const deltaX = event.clientX - active.startX;
            const maxShrink = active.startWidth - MIN_COLUMN_WIDTH;
            const maxGrow = active.startAdjacentWidth - MIN_COLUMN_WIDTH;
            const boundedDelta = Math.max(-maxShrink, Math.min(maxGrow, deltaX));

            const nextWidth = Math.max(MIN_COLUMN_WIDTH, active.startWidth + boundedDelta);
            const nextAdjacentWidth = Math.max(MIN_COLUMN_WIDTH, active.startAdjacentWidth - boundedDelta);

            setColumnWidths((prev) => {
                if (
                    prev[active.column] === nextWidth
                    && prev[active.adjacentColumn] === nextAdjacentWidth
                ) {
                    return prev;
                }

                return {
                    ...prev,
                    [active.column]: nextWidth,
                    [active.adjacentColumn]: nextAdjacentWidth,
                };
            });
        }

        function stopResize() {
            if (!resizeStateRef.current) {
                return;
            }

            resizeStateRef.current = null;
            document.body.style.removeProperty('cursor');
            document.body.style.removeProperty('user-select');
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopResize);
            stopResize();
        };
    }, []);

    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            const containerWidth = entry?.contentRect.width ?? 0;
            resizeColumnsToContainer(containerWidth);
        });

        observer.observe(container);
        resizeColumnsToContainer(container.clientWidth);
        return () => observer.disconnect();
    }, [resizeColumnsToContainer]);

    const tableColumnPercentages = useMemo(() => {
        const resizableTotal = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
        const total = resizableTotal + ACTION_BASE_WIDTH;

        return {
            name: (columnWidths.name / total) * 100,
            email: (columnWidths.email / total) * 100,
            role: (columnWidths.role / total) * 100,
            department: (columnWidths.department / total) * 100,
            status: (columnWidths.status / total) * 100,
            actions: (ACTION_BASE_WIDTH / total) * 100,
        };
    }, [columnWidths]);

    const sortedData = useMemo(() => {
        const direction = sortDirection === 'asc' ? 1 : -1;

        return [...data].sort((a, b) => {
            if (sortField === 'name') {
                return getFullName(a).localeCompare(getFullName(b), 'tr-TR', { sensitivity: 'base' }) * direction;
            }
            if (sortField === 'email') {
                return a.email.localeCompare(b.email, 'tr-TR', { sensitivity: 'base' }) * direction;
            }
            if (sortField === 'role') {
                return normalizeRole(a.role).localeCompare(normalizeRole(b.role), 'tr-TR', { sensitivity: 'base' }) * direction;
            }
            if (sortField === 'department') {
                return normalizeDepartment(a).localeCompare(normalizeDepartment(b), 'tr-TR', { sensitivity: 'base' }) * direction;
            }

            const aVal = a.isActive ? 1 : 0;
            const bVal = b.isActive ? 1 : 0;
            return (aVal - bVal) * direction;
        });
    }, [data, sortDirection, sortField]);

    function handleSort(field: TableSortField) {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortField(field);
        setSortDirection('asc');
    }

    function handleColumnResizeStart(column: TableColumnKey, event: ReactMouseEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();

        const currentIndex = COLUMN_ORDER.indexOf(column);
        const adjacentColumn = currentIndex >= 0 ? COLUMN_ORDER[currentIndex + 1] : undefined;
        if (!adjacentColumn) {
            return;
        }

        resizeStateRef.current = {
            column,
            adjacentColumn,
            startX: event.clientX,
            startWidth: columnWidths[column],
            startAdjacentWidth: columnWidths[adjacentColumn],
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div ref={tableContainerRef} className="overflow-x-hidden">
                <table className="w-full table-fixed border-collapse text-[13px]">
                    <colgroup>
                        <col style={{ width: `${tableColumnPercentages.name}%` }} />
                        <col style={{ width: `${tableColumnPercentages.email}%` }} />
                        <col style={{ width: `${tableColumnPercentages.role}%` }} />
                        <col style={{ width: `${tableColumnPercentages.department}%` }} />
                        <col style={{ width: `${tableColumnPercentages.status}%` }} />
                        <col style={{ width: `${tableColumnPercentages.actions}%` }} />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="group relative px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('name')}>
                                    Ad Soyad
                                    <SortIcon active={sortField === 'name'} direction={sortDirection} />
                                </button>
                                <div
                                    role="separator"
                                    aria-orientation="vertical"
                                    aria-label="Ad Soyad sutunu genisligini degistir"
                                    className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                    onMouseDown={(event) => handleColumnResizeStart('name', event)}
                                >
                                    <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                </div>
                            </th>
                            <th className="group relative px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('email')}>
                                    E-posta
                                    <SortIcon active={sortField === 'email'} direction={sortDirection} />
                                </button>
                                <div
                                    role="separator"
                                    aria-orientation="vertical"
                                    aria-label="E-posta sutunu genisligini degistir"
                                    className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                    onMouseDown={(event) => handleColumnResizeStart('email', event)}
                                >
                                    <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                </div>
                            </th>
                            <th className="group relative px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('role')}>
                                    Rol
                                    <SortIcon active={sortField === 'role'} direction={sortDirection} />
                                </button>
                                <div
                                    role="separator"
                                    aria-orientation="vertical"
                                    aria-label="Rol sutunu genisligini degistir"
                                    className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                    onMouseDown={(event) => handleColumnResizeStart('role', event)}
                                >
                                    <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                </div>
                            </th>
                            <th className="group relative px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('department')}>
                                    Departman
                                    <SortIcon active={sortField === 'department'} direction={sortDirection} />
                                </button>
                                <div
                                    role="separator"
                                    aria-orientation="vertical"
                                    aria-label="Departman sutunu genisligini degistir"
                                    className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                    onMouseDown={(event) => handleColumnResizeStart('department', event)}
                                >
                                    <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                </div>
                            </th>
                            <th className="group relative px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('isActive')}>
                                    Durum
                                    <SortIcon active={sortField === 'isActive'} direction={sortDirection} />
                                </button>
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                Islemler
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                                    Yükleniyor...
                                </td>
                            </tr>
                        )}

                        {isError && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-red-600">
                                    Personel listesi yuklenirken hata olustu.
                                </td>
                            </tr>
                        )}

                        {!isLoading && !isError && sortedData.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                                    {hasFilters
                                        ? 'Bu filtrelere uygun personel bulunamadı.'
                                        : 'Henuz kayıtlı personel bulunmuyor.'}
                                </td>
                            </tr>
                        )}

                        {sortedData.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 transition hover:bg-gray-50">
                                <td className="px-3 py-3 font-medium text-gray-900">
                                    <p className="truncate">{getFullName(item)}</p>
                                </td>
                                <td className="px-3 py-3 text-gray-600">
                                    <p className="truncate">{item.email}</p>
                                </td>
                                <td className="px-3 py-3 text-gray-700">
                                    <p className="truncate">{normalizeRole(item.role)}</p>
                                </td>
                                <td className="px-3 py-3 text-gray-700">
                                    <div className="min-w-0">
                                        <p className="truncate">{normalizeDepartment(item)}</p>
                                        {item.subDepartmentName && (
                                            <p className="truncate text-[11px] text-gray-500">{item.subDepartmentName}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-3">
                                    <StatusBadge active={item.isActive ?? true} />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item)}
                                            title="Duzenle"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onToggleActive(item)}
                                            title={item.isActive ? 'Deaktif Et' : 'Aktif Et'}
                                            className={`inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition ${
                                                item.isActive
                                                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                            }`}
                                        >
                                            {item.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                                            <span className="hidden min-[1200px]:inline">{item.isActive ? 'Deaktif Et' : 'Aktif Et'}</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
