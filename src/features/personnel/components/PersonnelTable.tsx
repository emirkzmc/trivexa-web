import { Edit2, UserX } from 'lucide-react';
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
    onDeactivate: (item: PersonnelItem) => void;
}

const COLUMNS = ['Ad Soyad', 'E-posta', 'Rol', 'Departman', 'Durum', 'İşlemler'];

export function PersonnelTable({
    data, isLoading, isError, hasFilters, onEdit, onDeactivate,
}: PersonnelTableProps) {
    return (
        <div style={{
            backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E5E7EB',
            overflow: 'hidden',
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        {COLUMNS.map((h) => (
                            <th key={h} style={{
                                textAlign: 'left', padding: '12px 16px',
                                fontWeight: 600, color: '#6B7280', fontSize: 12,
                                letterSpacing: '0.05em', textTransform: 'uppercase',
                            }}>
                                {h}
                            </th>
                        ))}
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

                    {!isLoading && !isError && data.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                                {hasFilters
                                    ? 'Bu filtrelere uygun personel bulunamadı.'
                                    : 'Henüz kayıtlı personel bulunmuyor.'}
                            </td>
                        </tr>
                    )}

                    {data.map((p) => (
                        <PersonnelRow
                            key={p.id}
                            item={p}
                            onEdit={onEdit}
                            onDeactivate={onDeactivate}
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
    onDeactivate: (item: PersonnelItem) => void;
}

function PersonnelRow({ item, onEdit, onDeactivate }: PersonnelRowProps) {
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
                        onClick={() => onDeactivate(item)}
                        title="Deaktif Et"
                        style={{
                            ...actionBtnStyle,
                            borderColor: '#FCA5A5',
                            backgroundColor: '#FEF2F2',
                        }}
                    >
                        <UserX size={14} color="#DC2626" />
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
