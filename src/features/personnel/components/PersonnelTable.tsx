import { Edit2, UserCheck, UserX, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { ROLE_LABELS } from '../../../shared/constants/roleLabels';
import { DEPARTMENT_LABELS } from '../../../shared/constants/departments';
import type { PersonnelItem } from '../api/personnel.api';

interface PersonnelTableProps {
    data: PersonnelItem[];
    isLoading: boolean;
    isError: boolean;
    hasFilters: boolean;
    onEdit: (item: PersonnelItem) => void;
    onToggleActive: (item: PersonnelItem) => void;
}

// Removed unused COLUMNS variable

function SortIcon({ field, currentSortField, currentSortDirection }: { field: keyof PersonnelItem, currentSortField: keyof PersonnelItem, currentSortDirection: 'asc' | 'desc' }) {
    if (currentSortField !== field) return <ArrowUp size={12} className="text-gray-300 opacity-0 group-hover:opacity-50" />;
    return currentSortDirection === 'asc' ? <ArrowUp size={12} className="text-red-500" /> : <ArrowDown size={12} className="text-red-500" />;
}

export function PersonnelTable({
    data, isLoading, isError, hasFilters, onEdit, onToggleActive,
}: PersonnelTableProps) {
    const [sortField, setSortField] = useState<keyof PersonnelItem>('firstName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (field: keyof PersonnelItem) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Client-side sorting for the current page
    const sortedData = [...data].sort((a, b) => {
        let aVal: unknown = a[sortField];
        let bVal: unknown = b[sortField];

        if (sortField === 'role') {
            aVal = ROLE_LABELS[a.role as keyof typeof ROLE_LABELS] || a.role;
            bVal = ROLE_LABELS[b.role as keyof typeof ROLE_LABELS] || b.role;
        } else if (sortField === 'department') {
            aVal = DEPARTMENT_LABELS[a.department as keyof typeof DEPARTMENT_LABELS] || a.department;
            bVal = DEPARTMENT_LABELS[b.department as keyof typeof DEPARTMENT_LABELS] || b.department;
        }

        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();

        if ((aVal as string) < (bVal as string)) return sortDirection === 'asc' ? -1 : 1;
        if ((aVal as string) > (bVal as string)) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div style={{
            backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E5E7EB',
            overflow: 'hidden',
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <th 
                            onClick={() => handleSort('firstName')}
                            className="group transition hover:bg-gray-100"
                            style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#6B7280', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Ad Soyad <SortIcon field="firstName" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                        </th>
                        <th 
                            onClick={() => handleSort('email')}
                            className="group transition hover:bg-gray-100"
                            style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#6B7280', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>E-posta <SortIcon field="email" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                        </th>
                        <th 
                            onClick={() => handleSort('role')}
                            className="group transition hover:bg-gray-100"
                            style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#6B7280', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Rol <SortIcon field="role" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                        </th>
                        <th 
                            onClick={() => handleSort('department')}
                            className="group transition hover:bg-gray-100"
                            style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#6B7280', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Departman <SortIcon field="department" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                        </th>
                        <th 
                            onClick={() => handleSort('isActive')}
                            className="group transition hover:bg-gray-100"
                            style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#6B7280', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Durum <SortIcon field="isActive" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                        </th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#6B7280', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            İşlemler
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                                Yükleniyor...
                            </td>
                        </tr>
                    )}

                    {isError && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#DC2626' }}>
                                Personel listesi yüklenirken hata oluştu.
                            </td>
                        </tr>
                    )}

                    {!isLoading && !isError && sortedData.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                                {hasFilters
                                    ? 'Bu filtrelere uygun personel bulunamadı.'
                                    : 'Henüz kayıtlı personel bulunmuyor.'}
                            </td>
                        </tr>
                    )}

                    {sortedData.map((p) => (
                        <PersonnelRow
                            key={p.id}
                            item={p}
                            onEdit={onEdit}
                            onToggleActive={onToggleActive}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Satır Bileşeni ──────────────────────────────────────────────────────────

interface PersonnelRowProps {
    item: PersonnelItem;
    onEdit: (item: PersonnelItem) => void;
    onToggleActive: (item: PersonnelItem) => void;
}

function PersonnelRow({ item, onEdit, onToggleActive }: PersonnelRowProps) {
    return (
        <tr
            style={{ borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.1s' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>
                {item.firstName} {item.lastName}
            </td>
            <td style={{ padding: '12px 16px', color: '#6B7280' }}>
                {item.email}
            </td>
            <td style={{ padding: '12px 16px', color: '#374151' }}>
                {ROLE_LABELS[item.role] ?? item.role}
            </td>
            <td style={{ padding: '12px 16px', color: '#374151' }}>
                {DEPARTMENT_LABELS[item.department] ?? item.department ?? '—'}
            </td>
            <td style={{ padding: '12px 16px' }}>
                <StatusBadge active={item.isActive ?? true} />
            </td>
            <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => onEdit(item)}
                        title="Düzenle"
                        style={actionBtnStyle}
                    >
                        <Edit2 size={14} color="#6B7280" />
                    </button>
                    <button
                        onClick={() => onToggleActive(item)}
                        title={item.isActive ? 'Deaktif Et' : 'Aktif Et'}
                        style={{
                            ...actionBtnStyle,
                            borderColor: item.isActive ? '#FCA5A5' : '#86EFAC',
                            backgroundColor: item.isActive ? '#FEF2F2' : '#ECFDF5',
                            color: item.isActive ? '#DC2626' : '#166534',
                            gap: 4,
                            alignItems: 'center',
                        }}
                    >
                        {item.isActive ? (
                            <>
                                <UserX size={14} color="#DC2626" />
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
                                    Deaktif Et
                                </span>
                            </>
                        ) : (
                            <>
                                <UserCheck size={14} color="#166534" />
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>
                                    Aktif Et
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </td>
        </tr>
    );
}

const actionBtnStyle: React.CSSProperties = {
    padding: 6, borderRadius: 6, border: '1px solid #E5E7EB',
    backgroundColor: '#fff', cursor: 'pointer', display: 'flex',
};
