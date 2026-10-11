import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    getCustomerContracts,
    type CustomerContractItem,
    type CustomerContractStatus,
} from '../api/customerContracts.api';

const STATUS_OPTIONS: Array<{ value: '' | CustomerContractStatus; label: string }> = [
    { value: '', label: 'Tum Durumlar' },
    { value: 'DRAFT', label: 'Taslak' },
    { value: 'PENDING_APPROVAL', label: 'Onay Bekliyor' },
    { value: 'APPROVED', label: 'Onaylandi' },
    { value: 'SIGNED', label: 'Imzalandi' },
    { value: 'EXPIRED', label: 'Suresi Doldu' },
    { value: 'TERMINATED', label: 'Sonlandirildi' },
];

function formatDate(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('tr-TR');
}

function formatAmount(value?: number): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
}

function statusBadge(status: string): string {
    switch (status) {
        case 'SIGNED':
        case 'APPROVED':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'PENDING_APPROVAL':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'EXPIRED':
        case 'TERMINATED':
            return 'border-red-200 bg-red-50 text-red-700';
        default:
            return 'border-slate-200 bg-slate-50 text-slate-700';
    }
}

function isExpiringSoon(contract: CustomerContractItem): boolean {
    if (!contract.endDate) return false;
    const end = new Date(contract.endDate).getTime();
    if (Number.isNaN(end)) return false;
    const now = Date.now();
    const in30Days = now + (30 * 24 * 60 * 60 * 1000);
    return end >= now && end <= in30Days;
}

export function CustomerPanelContractsPage() {
    const [statusFilter, setStatusFilter] = useState<'' | CustomerContractStatus>('');
    const [search, setSearch] = useState('');

    const contractsQuery = useQuery({
        queryKey: ['customer-panel', 'contracts', statusFilter],
        queryFn: () => getCustomerContracts(statusFilter ? { status: statusFilter } : {}),
        staleTime: 60_000,
    });

    const contracts = useMemo(() => contractsQuery.data || [], [contractsQuery.data]);

    const filteredContracts = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('tr');
        if (!term) return contracts;

        return contracts.filter((item) => {
            const haystack = [
                item.title,
                item.description ?? '',
                item.id,
                item.status,
            ]
                .join(' ')
                .toLocaleLowerCase('tr');
            return haystack.includes(term);
        });
    }, [contracts, search]);

    const stats = useMemo(() => {
        const total = contracts.length;
        const signed = contracts.filter((item) => item.status === 'SIGNED').length;
        const pending = contracts.filter((item) => item.status === 'PENDING_APPROVAL').length;
        const expiringSoon = contracts.filter((item) => isExpiringSoon(item)).length;
        return { total, signed, pending, expiringSoon };
    }, [contracts]);

    return (
        <section className="space-y-5">
            <header className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Customer Panel</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Sozlesmelerim / Kontratlarim</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Tum kontratlarinizi buradan takip edebilir, durumlarini ve gecerlilik tarihlerini gorebilirsiniz.
                </p>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Toplam Kontrat</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</p>
                </article>
                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-emerald-700">Imzali</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-800">{stats.signed}</p>
                </article>
                <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-amber-700">Onay Bekleyen</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-800">{stats.pending}</p>
                </article>
                <article className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-red-700">30 Gun Icinde Bitecek</p>
                    <p className="mt-2 text-2xl font-semibold text-red-800">{stats.expiringSoon}</p>
                </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as '' | CustomerContractStatus)}
                        className="h-10 min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Baslik, aciklama veya ID ara..."
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400"
                    />
                </div>

                {contractsQuery.isLoading ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                        Kontratlar yukleniyor...
                    </div>
                ) : contractsQuery.isError ? (
                    <div className="rounded-lg border border-dashed border-red-300 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
                        Kontratlar yuklenemedi.
                    </div>
                ) : filteredContracts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                        Gosterilecek kontrat bulunamadi.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead>
                                <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
                                    <th className="px-3 py-2 font-semibold">Kontrat</th>
                                    <th className="px-3 py-2 font-semibold">Durum</th>
                                    <th className="px-3 py-2 font-semibold">Baslangic / Bitis</th>
                                    <th className="px-3 py-2 font-semibold">Tutar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredContracts.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2">
                                            <p className="font-semibold text-slate-900">{item.title || '-'}</p>
                                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                                {item.description || item.id}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-700">
                                            {formatDate(item.startDate)} / {formatDate(item.endDate)}
                                        </td>
                                        <td className="px-3 py-2 text-slate-700">{formatAmount(item.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
}
