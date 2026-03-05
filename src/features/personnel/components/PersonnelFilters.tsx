import { Search, Filter, X } from 'lucide-react';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '../../../shared/constants/departments';
import { ROLES } from '../../../shared/constants/roles';
import { ROLE_LABELS } from '../../../shared/constants/roleLabels';
import type { PersonnelListParams } from '../api/personnel.api';

interface PersonnelFiltersProps {
    filters: PersonnelListParams;
    onFilterChange: (key: string, value: string | undefined) => void;
    onClear: () => void;
}

export function PersonnelFilters({ filters, onFilterChange, onClear }: PersonnelFiltersProps) {
    const hasFilters = filters.department || filters.role || filters.isActive || filters.search;

    return (
        <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
            marginBottom: 20, padding: '14px 16px', backgroundColor: '#F9FAFB',
            borderRadius: 10, border: '1px solid #E5E7EB',
        }}>
            <Filter size={15} color="#6B7280" />

            {/* Arama */}
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 9 }} />
                <input
                    placeholder="İsim veya e-posta ile ara..."
                    value={filters.search ?? ''}
                    onChange={(e) => onFilterChange('search', e.target.value || undefined)}
                    style={{
                        width: '100%', padding: '7px 10px 7px 32px', borderRadius: 6,
                        border: '1px solid #D1D5DB', fontSize: 13, outline: 'none',
                        backgroundColor: '#fff', boxSizing: 'border-box',
                    }}
                />
            </div>

            {/* Departman */}
            <select
                value={filters.department ?? ''}
                onChange={(e) => onFilterChange('department', e.target.value || undefined)}
                style={selectStyle}
            >
                <option value="">Tüm Departmanlar</option>
                {Object.entries(DEPARTMENTS).map(([key, value]) => (
                    <option key={key} value={value}>
                        {DEPARTMENT_LABELS[key] ?? key}
                    </option>
                ))}
            </select>

            {/* Rol */}
            <select
                value={filters.role ?? ''}
                onChange={(e) => onFilterChange('role', e.target.value || undefined)}
                style={selectStyle}
            >
                <option value="">Tüm Roller</option>
                {Object.entries(ROLES).map(([key, value]) => (
                    <option key={key} value={value}>
                        {ROLE_LABELS[key] ?? key}
                    </option>
                ))}
            </select>

            {/* Durum */}
            <select
                value={filters.isActive ?? ''}
                onChange={(e) => onFilterChange('isActive', e.target.value || undefined)}
                style={selectStyle}
            >
                <option value="">Tüm Durumlar</option>
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
            </select>

            {hasFilters && (
                <button onClick={onClear} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '7px 12px', borderRadius: 6, border: '1px solid #FCA5A5',
                    backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 12,
                    fontWeight: 500, cursor: 'pointer',
                }}>
                    <X size={13} /> Temizle
                </button>
            )}
        </div>
    );
}

const selectStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB',
    fontSize: 13, backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
};
