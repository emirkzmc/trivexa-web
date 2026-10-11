import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, KeyRound, Ban, CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import type { ClientItem } from '../api/clients.api';

interface ClientsTableProps {
    data: ClientItem[];
    isLoading: boolean;
    isError: boolean;
    hasFilters: boolean;
    isGeneratingAccess: boolean;
    isUpdatingStatus: boolean;
    onOpenDetail: (item: ClientItem) => void;
    onEdit: (item: ClientItem) => void;
    onGenerateAccess: (item: ClientItem) => void;
    onDeactivate: (item: ClientItem) => void;
    onActivate: (item: ClientItem) => void;
}

type SortField = 'companyName' | 'contactPerson' | 'email' | 'createdAt' | 'isActive';
type SortDirection = 'asc' | 'desc';

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

function formatDateLabel(isoDate: string) {
    if (!isoDate) {
        return '-';
    }

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function ClientsTable({
    data,
    isLoading,
    isError,
    hasFilters,
    isGeneratingAccess,
    isUpdatingStatus,
    onOpenDetail,
    onEdit,
    onGenerateAccess,
    onDeactivate,
    onActivate,
}: ClientsTableProps) {
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const sortedRows = useMemo(() => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        return [...data].sort((left, right) => {
            if (sortField === 'companyName') {
                return left.companyName.localeCompare(right.companyName, 'tr-TR', { sensitivity: 'base' }) * direction;
            }
            if (sortField === 'contactPerson') {
                return left.contactPerson.localeCompare(right.contactPerson, 'tr-TR', { sensitivity: 'base' }) * direction;
            }
            if (sortField === 'email') {
                return left.email.localeCompare(right.email, 'tr-TR', { sensitivity: 'base' }) * direction;
            }
            if (sortField === 'isActive') {
                const leftValue = left.isActive ? 1 : 0;
                const rightValue = right.isActive ? 1 : 0;
                return (leftValue - rightValue) * direction;
            }

            const leftDate = Date.parse(left.createdAt || '');
            const rightDate = Date.parse(right.createdAt || '');
            const safeLeft = Number.isFinite(leftDate) ? leftDate : Number.NEGATIVE_INFINITY;
            const safeRight = Number.isFinite(rightDate) ? rightDate : Number.NEGATIVE_INFINITY;
            return (safeLeft - safeRight) * direction;
        });
    }, [data, sortDirection, sortField]);

    function handleSort(nextField: SortField) {
        if (sortField === nextField) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortField(nextField);
        setSortDirection('asc');
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-hidden">
                <table className="w-full table-fixed border-collapse text-[13px]">
                    <colgroup>
                        <col style={{ width: '23%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '16%' }} />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('companyName')}>
                                    Sirket
                                    <SortIcon active={sortField === 'companyName'} direction={sortDirection} />
                                </button>
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('contactPerson')}>
                                    Yetkili
                                    <SortIcon active={sortField === 'contactPerson'} direction={sortDirection} />
                                </button>
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('email')}>
                                    E-posta
                                    <SortIcon active={sortField === 'email'} direction={sortDirection} />
                                </button>
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                                Telefon
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
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
                                    Müşteri listesi yüklenemedi.
                                </td>
                            </tr>
                        )}

                        {!isLoading && !isError && sortedRows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                                    {hasFilters ? 'Bu filtrelere uygun müşteri bulunamadı.' : 'Henuz kayıtlı müşteri yok.'}
                                </td>
                            </tr>
                        )}

                        {sortedRows.map((item) => (
                            <tr
                                key={item.id}
                                className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
                                onClick={() => onOpenDetail(item)}
                            >
                                <td className="px-3 py-3">
                                    <p className="truncate font-medium text-gray-900">{item.companyName || '-'}</p>
                                    {item.address && <p className="truncate text-[11px] text-gray-500">{item.address}</p>}
                                </td>
                                <td className="px-3 py-3 text-gray-700">
                                    <p className="truncate">{item.contactPerson || '-'}</p>
                                    <p className="truncate text-[11px] text-gray-500">{formatDateLabel(item.createdAt)}</p>
                                </td>
                                <td className="px-3 py-3 text-gray-700">
                                    <p className="truncate">{item.email || '-'}</p>
                                </td>
                                <td className="px-3 py-3 text-gray-700">
                                    <p className="truncate">{item.phone || '-'}</p>
                                </td>
                                <td className="px-3 py-3">
                                    <StatusBadge active={item.isActive} />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onEdit(item);
                                            }}
                                            title="Duzenle"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onGenerateAccess(item);
                                            }}
                                            title="Portal erişim linki olustur"
                                            disabled={isGeneratingAccess}
                                            className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-default disabled:opacity-60"
                                        >
                                            <KeyRound size={13} />
                                            <span className="hidden min-[1200px]:inline">Portal Link</span>
                                        </button>
                                        {item.isActive ? (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onDeactivate(item);
                                                }}
                                                title="Pasife al"
                                                disabled={isUpdatingStatus}
                                                className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-default disabled:opacity-60"
                                            >
                                                <Ban size={13} />
                                                <span className="hidden min-[1200px]:inline">Pasife Al</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onActivate(item);
                                                }}
                                                title="Aktif et"
                                                disabled={isUpdatingStatus}
                                                className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-default disabled:opacity-60"
                                            >
                                                <CheckCircle2 size={13} />
                                                <span className="hidden min-[1200px]:inline">Aktif Et</span>
                                            </button>
                                        )}
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
