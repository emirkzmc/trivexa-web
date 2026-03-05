import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    limitOptions?: number[];
}

export function Pagination({
    currentPage,
    totalPages,
    total,
    limit,
    onPageChange,
    onLimitChange,
    limitOptions = [20, 50],
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, padding: '12px 0',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Sayfa başına:</span>
                <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    style={{
                        padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB',
                        fontSize: 13, cursor: 'pointer',
                    }}
                >
                    {limitOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                    {total} kayıttan {start}–{end} arası
                </span>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    style={{
                        padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
                        backgroundColor: '#fff', cursor: currentPage <= 1 ? 'default' : 'pointer',
                        opacity: currentPage <= 1 ? 0.4 : 1, display: 'flex',
                    }}
                >
                    <ChevronLeft size={16} />
                </button>
                <span style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {currentPage} / {totalPages}
                </span>
                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    style={{
                        padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
                        backgroundColor: '#fff', cursor: currentPage >= totalPages ? 'default' : 'pointer',
                        opacity: currentPage >= totalPages ? 0.4 : 1, display: 'flex',
                    }}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
