import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { formatDate } from '../../../shared/utils/formatDate';
import { getAuditLogs, type AuditLogParams, type AuditLogItem } from '../api/audit.api';
import { Modal } from '../../../shared/components/Modal';

const LIMIT_OPTIONS = [15, 30, 50, 100];

function getActionColor(action: string): string {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('start')) {
        return 'bg-emerald-100 text-emerald-700';
    }
    if (act.includes('delete') || act.includes('remove') || act.includes('cancel')) {
        return 'bg-red-100 text-red-700';
    }
    if (act.includes('update') || act.includes('edit') || act.includes('stop')) {
        return 'bg-blue-100 text-blue-700';
    }
    return 'bg-gray-100 text-gray-700';
}

function getEntityColor(entity: string): string {
    const ent = entity.toUpperCase();
    if (ent === 'USER' || ent === 'PERSONNEL') return 'text-purple-600';
    if (ent === 'TASK' || ent === 'PROJECT') return 'text-orange-600';
    if (ent === 'INVOICE' || ent === 'FINANCE') return 'text-green-600';
    if (ent === 'TICKET') return 'text-blue-600';
    if (ent === 'TIME_ENTRY') return 'text-red-500';
    return 'text-gray-800';
}

function getActionSummary(log: AuditLogItem): string {
    const user = log.userName ? log.userName : log.userId ? 'Bilinmeyen Kullanıcı' : 'Sistem';
    const ent = log.entity.toUpperCase();
    const act = log.action.toUpperCase();

    if (act.includes('LOGIN')) return `${user}, sisteme giriş yaptı.`;
    if (act.includes('LOGOUT')) return `${user}, sistemden çıkış yaptı.`;

    // Try to extract a specific name/title from the JSON metadata
    let itemName = '';
    if (log.metadata) {
        const possibleName = log.metadata.title || log.metadata.name || log.metadata.companyName || log.metadata.email || log.metadata.firstName;
        if (typeof possibleName === 'string' && possibleName.trim()) {
            itemName = `"${possibleName}" adlı`;
        }
    }

    // Determine the entity label
    let entityLabel = 'kaydı';
    if (ent === 'USER' || ent === 'PERSONNEL') entityLabel = 'kullanıcıyı';
    else if (ent === 'TASK') entityLabel = 'görevi';
    else if (ent === 'PROJECT') entityLabel = 'projeyi';
    else if (ent === 'INVOICE' || ent === 'FINANCE') entityLabel = 'faturayı';
    else if (ent === 'TICKET') entityLabel = 'destek talebini';
    else if (ent === 'TIME_ENTRY') entityLabel = 'zaman kaydını';
    else if (ent === 'CLIENT') entityLabel = 'müşteriyi';
    else if (ent === 'AUTH') entityLabel = 'oturumu';

    // If no specific item name was found, fallback to generic
    if (!itemName) {
        if (ent === 'USER' || ent === 'PERSONNEL') entityLabel = 'bir kullanıcı';
        else if (ent === 'TASK') entityLabel = 'bir görev';
        else if (ent === 'PROJECT') entityLabel = 'bir proje';
        else if (ent === 'INVOICE' || ent === 'FINANCE') entityLabel = 'bir fatura';
        else if (ent === 'TICKET') entityLabel = 'bir destek talebi';
        else if (ent === 'TIME_ENTRY') entityLabel = 'bir zaman kaydı';
        else if (ent === 'CLIENT') entityLabel = 'bir müşteri';
        else if (ent === 'AUTH') entityLabel = 'bir oturum';
        else entityLabel = 'bir kayıt';
    }

    let actionVerb = 'üzerinde işlem yaptı';
    if (act.includes('CREATE') || act.includes('ADD') || act === 'POST') actionVerb = 'oluşturdu';
    else if (act.includes('UPDATE') || act.includes('EDIT') || act === 'PUT' || act === 'PATCH') actionVerb = 'güncelledi';
    else if (act.includes('DELETE') || act.includes('REMOVE') || act === 'DELETE') actionVerb = 'sildi';
    else if (act.includes('STOP')) actionVerb = 'durdurdu';
    else if (act.includes('START')) actionVerb = 'başlattı';

    let extraDetails = '';
    // Show what fields exactly were updated if the action is update
    if ((act.includes('UPDATE') || act.includes('EDIT') || act === 'PUT' || act === 'PATCH') && log.metadata && Object.keys(log.metadata).length > 0) {
        const skipKeys = ['id', 'updatedAt', 'createdAt'];
        const changedKeys = Object.keys(log.metadata).filter(k => !skipKeys.includes(k));
        
        if (changedKeys.length > 0) {
            extraDetails = ` (Değişen alanlar: ${changedKeys.slice(0, 4).join(', ')}${changedKeys.length > 4 ? '...' : ''})`;
        }
    }

    const objectPart = itemName ? `${itemName} ${entityLabel}` : entityLabel;
    
    return `${user}, ${objectPart} ${actionVerb}.${extraDetails}`;
}

function SortIcon({ field, currentSortField, currentSortDirection }: { field: keyof AuditLogItem, currentSortField: keyof AuditLogItem, currentSortDirection: 'asc' | 'desc' }) {
    if (currentSortField !== field) return <ArrowUp size={12} className="text-gray-300 opacity-0 group-hover:opacity-50" />;
    return currentSortDirection === 'asc' ? <ArrowUp size={12} className="text-red-500" /> : <ArrowDown size={12} className="text-red-500" />;
}

export function AuditLogPage() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [filters, setFilters] = useState<AuditLogParams>({});
    const [searchInput, setSearchInput] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
    const [sortField, setSortField] = useState<keyof AuditLogItem>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const query = useQuery({
        queryKey: ['audit-logs', page, limit, filters.action, filters.entity, filters.userId],
        queryFn: () => getAuditLogs({ page, limit, ...filters }),
    });

    const logs = query.data?.data ?? [];
    const total = query.data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Client-side sorting
    const sortedLogs = [...logs].sort((a, b) => {
        let aValue: unknown = a[sortField];
        let bValue: unknown = b[sortField];

        // Normalization for specific fields
        if (sortField === 'createdAt') {
            aValue = new Date(a.createdAt as string).getTime();
            bValue = new Date(b.createdAt as string).getTime();
        } else {
            aValue = String(aValue || '').toLowerCase();
            bValue = String(bValue || '').toLowerCase();
        }

        if ((aValue as string | number) < (bValue as string | number)) return sortDirection === 'asc' ? -1 : 1;
        if ((aValue as string | number) > (bValue as string | number)) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (field: keyof AuditLogItem) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    function handleFilterSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPage(1);
        setFilters((prev) => ({ ...prev, action: searchInput.trim() || undefined }));
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-[18px]">
            <PageHeader
                icon={<ShieldCheck size={20} color="var(--role-accent-600)" />}
                title="Sistem İzleme (Audit Log)"
                subtitle="Sistemde gerçekleşen tüm işlem hareketlerinin izleme kayıtları."
            />

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <form 
                    className="flex flex-col gap-3 sm:flex-row sm:items-end"
                    onSubmit={handleFilterSubmit}
                >
                    <div className="flex-1">
                        <label className="mb-1 block text-xs font-semibold text-gray-700">Aksiyon (Örn: update, create)</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5">
                                <Search size={14} className="text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder="Aksiyon adı ile ara..."
                                className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-[13px] outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <label className="mb-1 block text-xs font-semibold text-gray-700">Entity Modülü</label>
                        <select 
                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-[13px] outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            value={filters.entity || ''}
                            onChange={(e) => {
                                setPage(1);
                                setFilters(prev => ({ ...prev, entity: e.target.value || undefined }));
                            }}
                        >
                            <option value="">Tümü</option>
                            <option value="USER">User</option>
                            <option value="TASK">Task</option>
                            <option value="PROJECT">Project</option>
                            <option value="INVOICE">Invoice</option>
                            <option value="TIME_ENTRY">Time Tracker</option>
                            <option value="TICKET">Ticket</option>
                            <option value="AUTH">Authentication</option>
                        </select>
                    </div>

                    <button 
                        type="submit" 
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-[13px] font-semibold text-white transition hover:bg-red-700"
                    >
                        <Filter size={14} /> Filtrele
                    </button>
                </form>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition" onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center gap-1">Tarih <SortIcon field="createdAt" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition" onClick={() => handleSort('action')}>
                                    <div className="flex items-center gap-1">Aksiyon <SortIcon field="action" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition" onClick={() => handleSort('entity')}>
                                    <div className="flex items-center gap-1">Modül (Entity) <SortIcon field="entity" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition" title="İşlem gören verinin sistemdeki benzersiz kimlik numarası (UUID)" onClick={() => handleSort('entityId')}>
                                    <div className="flex items-center gap-1">Hedef Veri (ID) <SortIcon field="entityId" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition" onClick={() => handleSort('userName')}>
                                    <div className="flex items-center gap-1">Kullanıcı <SortIcon field="userName" currentSortField={sortField} currentSortDirection={sortDirection} /></div>
                                </th>
                                <th className="px-4 py-3 font-semibold">İşlem Özeti</th>
                                <th className="px-4 py-3 font-semibold">Detaylar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {query.isLoading && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">Loglar yükleniyor...</td>
                                </tr>
                            )}

                            {query.isError && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-red-600">
                                        Loglar alınırken bir hata oluştu.
                                    </td>
                                </tr>
                            )}

                            {!query.isLoading && !query.isError && sortedLogs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        Seçilen filtrelere uygun log bulunamadı.
                                    </td>
                                </tr>
                            )}

                            {sortedLogs.map((log) => (
                                <tr key={log.id} className="transition-colors hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                        {formatDate(log.createdAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold">
                                        <span className={getEntityColor(log.entity)}>{log.entity}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {log.entityId ? (
                                            <span className="font-mono text-xs">{log.entityId.substring(0, 8)}...</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 font-medium text-xs">
                                        {log.userName ? log.userName : log.userId ? <span className="text-gray-400 font-mono">{log.userId.substring(0, 8)}...</span> : 'Sistem'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-[12px]">
                                        {getActionSummary(log)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                            <button 
                                                onClick={() => setSelectedLog(log)}
                                                className="inline-flex items-center rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                            >
                                                Detayları Gör
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Detay Yok</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-gray-200">
                    <Pagination
                        currentPage={page}
                        total={total}
                        limit={limit}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        onLimitChange={(l) => { setLimit(l); setPage(1); }}
                        limitOptions={LIMIT_OPTIONS}
                    />
                </div>
            </section>
            {selectedLog && (
                <Modal title="Log Detayları" onClose={() => setSelectedLog(null)} width={600}>
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                            <div><strong>Özet:</strong> {getActionSummary(selectedLog)}</div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-700 border-t pt-4 mt-2">
                            <div><strong>Aksiyon:</strong> {selectedLog.action}</div>
                            <div><strong>Entity:</strong> {selectedLog.entity}</div>
                            <div><strong>Kullanıcı:</strong> {selectedLog.userName ? selectedLog.userName : selectedLog.userId ? <span className="font-mono text-xs">{selectedLog.userId}</span> : 'Sistem'}</div>
                            {selectedLog.entityId && <div><strong>Kayıt ID:</strong> {selectedLog.entityId}</div>}
                            <div><strong>Tarih:</strong> {formatDate(selectedLog.createdAt)}</div>
                        </div>
                        <div className="mt-4 border-t pt-4">
                            <h3 className="mb-2 text-sm font-semibold text-gray-800">İşlem Detayı (Payload JSON)</h3>
                            <pre className="max-h-[60vh] overflow-x-auto overflow-y-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400 shadow-inner">
                                {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
