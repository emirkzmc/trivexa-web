import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, FilterX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getClients } from '../../clients/api/clients.api';
import { getContracts, type ContractItem } from '../api/contracts.api';

const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
    { label: 'Taslak', value: 'DRAFT' },
    { label: 'Onay Bekliyor', value: 'PENDING_APPROVAL' },
    { label: 'Onaylandi', value: 'APPROVED' },
    { label: 'Imzalandi', value: 'SIGNED' },
    { label: 'Suresi Doldu', value: 'EXPIRED' },
    { label: 'Sonlandirildi', value: 'TERMINATED' },
];

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function statusBadgeClass(status?: string) {
    const normalized = (status ?? '').toUpperCase();
    if (['SIGNED', 'APPROVED', 'ACTIVE'].includes(normalized)) return 'bg-emerald-100 text-emerald-700';
    if (['PENDING_APPROVAL', 'PENDING', 'DRAFT'].includes(normalized)) return 'bg-amber-100 text-amber-700';
    if (['EXPIRED', 'TERMINATED', 'CANCELLED'].includes(normalized)) return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
}

function parseDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function isExpiringSoon(contract: ContractItem): boolean {
    const endDate = parseDate(contract.endDate);
    if (!endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(today.getDate() + 30);
    return endDate >= today && endDate <= limit;
}

interface ContractFilters {
    status: '' | string;
    clientId: string;
    startDate: string;
    endDate: string;
    page: number;
    limit: number;
}

export function ContractsPage() {
    const navigate = useNavigate();
    const userRole = useAuthStore((state) => state.user?.role);
    const normalizedRole = String(userRole ?? '').toUpperCase();
    const hasAccountingRole = normalizedRole === ROLES.ACCOUNTING
        || normalizedRole.includes('ACCOUNTING')
        || normalizedRole.includes('MUHASEBE');
    const canReadContracts = normalizedRole === ROLES.ADMIN
        || normalizedRole === ROLES.CEO
        || normalizedRole === ROLES.MANAGER
        || normalizedRole === ROLES.ACCOUNT_MANAGER
        || hasAccountingRole;

    const [quickSearch, setQuickSearch] = useState('');
    const [filters, setFilters] = useState<ContractFilters>({
        status: '',
        clientId: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 20,
    });

    const contractsQuery = useQuery({
        queryKey: ['contracts-list', filters],
        queryFn: () => getContracts({
            page: filters.page,
            limit: filters.limit,
            status: filters.status || undefined,
            clientId: filters.clientId || undefined,
        }),
        enabled: canReadContracts,
    });

    const clientsQuery = useQuery({
        queryKey: ['contracts-filter-clients'],
        queryFn: () => getClients({ page: 1, limit: 100 }),
        enabled: canReadContracts,
    });

    const rows = useMemo(() => contractsQuery.data?.data || [], [contractsQuery.data?.data]);
    const clientMap = useMemo(
        () => new Map((clientsQuery.data?.data ?? []).map((client) => [client.id, client.companyName])),
        [clientsQuery.data?.data],
    );

    const filteredRows = useMemo(() => {
        const term = quickSearch.trim().toLowerCase();
        const startDate = parseDate(filters.startDate);
        const endDate = parseDate(filters.endDate);

        return rows.filter((contract) => {
            const start = parseDate(contract.startDate);
            const end = parseDate(contract.endDate) ?? start;

            if (startDate && (!start || start < startDate)) return false;
            if (endDate && (!end || end > endDate)) return false;

            if (!term) return true;
            const haystack = [
                contract.title || '',
                contract.description || '',
                contract.id || '',
                contract.status || '',
                clientMap.get(contract.clientId) || '',
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(term);
        });
    }, [clientMap, filters.endDate, filters.startDate, quickSearch, rows]);

    const metrics = useMemo(() => {
        let totalValue = 0;
        let signedCount = 0;
        let pendingCount = 0;
        let expiringSoonCount = 0;

        filteredRows.forEach((contract) => {
            totalValue += Number(contract.value || 0);
            const normalized = (contract.status ?? '').toUpperCase();
            if (normalized === 'SIGNED' || normalized === 'APPROVED') signedCount += 1;
            if (normalized.includes('PENDING')) pendingCount += 1;
            if (isExpiringSoon(contract)) expiringSoonCount += 1;
        });

        return {
            totalValue,
            signedCount,
            pendingCount,
            expiringSoonCount,
        };
    }, [filteredRows]);

    function setFilter<K extends keyof ContractFilters>(key: K, value: ContractFilters[K]) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? (value as number) : 1,
        }));
    }

    function resetFilters() {
        setQuickSearch('');
        setFilters({
            status: '',
            clientId: '',
            startDate: '',
            endDate: '',
            page: 1,
            limit: 20,
        });
    }

    if (!canReadContracts) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<FileText size={20} color="#DC2626" />}
                    title="Sozlesmeler"
                    subtitle="Yetki kontrolu"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana ADMIN, CEO, MANAGER ve muhasebe rollerinden erisilebilir.
                </section>
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<FileText size={20} color="#DC2626" />}
                title="Sozlesmeler"
                subtitle={`Sayfada ${filteredRows.length} sozlesme goruntuleniyor`}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Sozlesme Degeri</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{formatMoney(metrics.totalValue)}</p>
                </article>
                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">Imzali / Onayli</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-800">{metrics.signedCount}</p>
                </article>
                <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">Onay Bekleyen</p>
                    <p className="mt-1 text-2xl font-bold text-amber-800">{metrics.pendingCount}</p>
                </article>
                <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-700">30 Gun Icinde Bitecek</p>
                    <p className="mt-1 text-2xl font-bold text-rose-800">{metrics.expiringSoonCount}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-2.5">
                <div className="overflow-x-auto">
                    <div className="flex min-w-max items-center gap-2">
                        <input
                            type="text"
                            value={quickSearch}
                            onChange={(event) => setQuickSearch(event.target.value)}
                            placeholder="Sozlesme / musteri / durum"
                            aria-label="Hizli arama"
                            className="h-9 w-60 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                        <select
                            value={filters.status}
                            onChange={(event) => setFilter('status', event.target.value)}
                            aria-label="Durum"
                            className="h-9 w-40 rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">Tum Durumlar</option>
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.clientId}
                            onChange={(event) => setFilter('clientId', event.target.value)}
                            aria-label="Musteri"
                            className="h-9 w-48 rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value="">Tum Musteriler</option>
                            {(clientsQuery.data?.data ?? []).map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.companyName}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-gray-600">Baslangic</span>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(event) => setFilter('startDate', event.target.value)}
                                aria-label="Baslangic tarihi"
                                className="h-9 w-36 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-gray-600">Bitis</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(event) => setFilter('endDate', event.target.value)}
                                aria-label="Bitis tarihi"
                                className="h-9 w-36 rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>

                        <div className="mx-1 h-5 w-px bg-gray-200" />

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                            <FilterX size={13} />
                            Sifirla
                        </button>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-hidden">
                    <table className="w-full table-fixed border-collapse text-[13px]">
                        <colgroup>
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '18%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '14%' }} />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Sozlesme</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Musteri</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Baslangic</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Bitis</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Deger</th>
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contractsQuery.isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Yukleniyor...</td>
                                </tr>
                            )}
                            {contractsQuery.isError && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-red-600">Sozlesmeler yuklenemedi.</td>
                                </tr>
                            )}
                            {!contractsQuery.isLoading && !contractsQuery.isError && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Bu filtrelere uygun sozlesme yok.</td>
                                </tr>
                            )}
                            {filteredRows.map((contract) => (
                                <tr key={contract.id} className="border-b border-gray-100 transition hover:bg-gray-50">
                                    <td className="px-3 py-3">
                                        <p className="font-medium text-gray-900">{contract.title || '-'}</p>
                                        <p className="text-xs text-gray-500">{contract.description || contract.id}</p>
                                    </td>
                                    <td className="px-3 py-3 text-gray-700">
                                        {clientMap.get(contract.clientId) || contract.clientId || '-'}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(contract.status)}`}>
                                            {contract.status || 'UNKNOWN'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-gray-700">
                                        {contract.startDate ? formatDate(contract.startDate) : '-'}
                                    </td>
                                    <td className="px-3 py-3 text-gray-700">
                                        {contract.endDate ? formatDate(contract.endDate) : '-'}
                                    </td>
                                    <td className="px-3 py-3 text-gray-700">{formatMoney(contract.value)}</td>
                                    <td className="px-3 py-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (contract.clientId) {
                                                    navigate(`/app/musteriler/${contract.clientId}`);
                                                }
                                            }}
                                            disabled={!contract.clientId}
                                            className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-300 bg-white px-2 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Musteri
                                            <ExternalLink size={11} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs text-gray-500">Sayfa: {filters.page}</p>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600">Sayfa Boyutu</label>
                        <select
                            value={filters.limit}
                            onChange={(event) => setFilter('limit', Number(event.target.value))}
                            className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilter('page', Math.max(1, filters.page - 1))}
                        disabled={filters.page <= 1 || contractsQuery.isFetching}
                        className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:opacity-50"
                    >
                        Onceki
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('page', filters.page + 1)}
                        disabled={rows.length < filters.limit || contractsQuery.isFetching}
                        className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:opacity-50"
                    >
                        Sonraki
                    </button>
                </div>
            </section>
        </div>
    );
}
