import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Filter, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getProjects } from '../../projects/api/projects.api';
import {
    createCampaign,
    getCampaigns,
    type CampaignCreatePayload,
    type CampaignItem,
    type CampaignObjective,
    type CampaignPlatform,
    type CampaignStatus,
} from '../api/campaigns.api';
import { CampaignFormModal } from './CampaignFormModal';

const STATUS_OPTIONS = [
    { value: '', label: 'Tum Durumlar' },
    { value: 'DRAFT', label: 'Taslak' },
    { value: 'ACTIVE', label: 'Yayinda' },
    { value: 'PAUSED', label: 'Duraklatildi' },
    { value: 'COMPLETED', label: 'Tamamlandi' },
];

const PLATFORM_OPTIONS = [
    { value: '', label: 'Tum Platformlar' },
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'GOOGLE_ADS', label: 'Google Ads' },
    { value: 'LINKEDIN', label: 'LinkedIn' },
];

const OBJECTIVE_OPTIONS = [
    { value: 'AWARENESS', label: 'Bilinirlik' },
    { value: 'ENGAGEMENT', label: 'Etkilesim' },
    { value: 'LEADS', label: 'Lead' },
    { value: 'SALES', label: 'Satis' },
];

const STATUS_BADGE: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    PAUSED: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-indigo-100 text-indigo-700',
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function labelForOption(options: Array<{ value: string; label: string }>, value: string): string {
    return options.find((item) => item.value === value)?.label ?? value;
}

export function CampaignsPage() {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((state) => state.user);
    const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
    const [platformFilter, setPlatformFilter] = useState<CampaignPlatform | ''>('');
    const [objectiveFilter, setObjectiveFilter] = useState<CampaignObjective | ''>('');
    const [search, setSearch] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);

    const campaignsQuery = useQuery({
        queryKey: ['campaigns', statusFilter, platformFilter, objectiveFilter, search],
        queryFn: () => getCampaigns({
            page: 1,
            limit: 100,
            status: statusFilter || undefined,
            platform: platformFilter || undefined,
            objective: objectiveFilter || undefined,
            search: search || undefined,
        }),
        staleTime: 30_000,
    });

    const projectsQuery = useQuery({
        queryKey: ['projects', 'campaigns'],
        queryFn: () => getProjects({ page: 1, limit: 100 }),
        staleTime: 60_000,
    });

    const rows = campaignsQuery.data?.data ?? [];

    const filteredRows = useMemo(() => {
        const searchValue = search.trim().toLowerCase();
        if (!searchValue) return rows;

        return rows.filter((item) => {
            const haystack = [
                item.title,
                item.projectName,
                item.owner,
                item.description,
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(searchValue);
        });
    }, [rows, search]);

    useEffect(() => {
        if (!selectedCampaign && filteredRows.length > 0) {
            setSelectedCampaign(filteredRows[0]);
            return;
        }

        if (selectedCampaign) {
            const exists = filteredRows.some((row) => row.id === selectedCampaign.id);
            if (!exists) {
                setSelectedCampaign(filteredRows[0] ?? null);
            }
        }
    }, [filteredRows, selectedCampaign]);

    const stats = useMemo(() => {
        const totalBudget = filteredRows.reduce((acc, item) => acc + item.budget, 0);
        const activeCount = filteredRows.filter((item) => item.status === 'ACTIVE').length;
        const draftCount = filteredRows.filter((item) => item.status === 'DRAFT').length;
        return {
            total: filteredRows.length,
            activeCount,
            draftCount,
            totalBudget,
        };
    }, [filteredRows]);

    const createCampaignMutation = useMutation({
        mutationFn: (payload: CampaignCreatePayload) => createCampaign(payload),
        onSuccess: async () => {
            toast.success('Kampanya olusturuldu.');
            setCreateModalOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        },
        onError: () => {
            toast.error('Kampanya olusturulamadi.');
        },
    });

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarDays size={20} color="var(--role-accent-600)" />}
                title="Kampanya Yonetimi"
                subtitle="Kampanyalari planlayin, durumlarini takip edin ve performans hedeflerini netlestirin."
                actions={(
                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[color:var(--role-accent-600)] px-3 text-xs font-semibold text-white transition hover:bg-[color:var(--role-accent-700)]"
                    >
                        <Plus size={14} />
                        Yeni Kampanya
                    </button>
                )}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Kampanya</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
                </article>
                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">Aktif</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-800">{stats.activeCount}</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">Taslak</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{stats.draftCount}</p>
                </article>
                <article className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-700">Toplam Butce</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-800">{formatCurrency(stats.totalBudget)}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                    <Filter size={14} /> Filtreler
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Durum</label>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as CampaignStatus | '')}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            {STATUS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Platform</label>
                        <select
                            value={platformFilter}
                            onChange={(event) => setPlatformFilter(event.target.value as CampaignPlatform | '')}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            {PLATFORM_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Hedef</label>
                        <select
                            value={objectiveFilter}
                            onChange={(event) => setObjectiveFilter(event.target.value as CampaignObjective | '')}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            <option value="">Tum Hedefler</option>
                            {OBJECTIVE_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Arama</label>
                        <div className="relative">
                            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Kampanya, proje, ekip..."
                                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="mb-3 text-base font-semibold text-gray-900">Kampanya Listesi</h3>

                    {campaignsQuery.isLoading && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                            Kampanyalar yukleniyor...
                        </div>
                    )}

                    {campaignsQuery.isError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Kampanyalar getirilirken hata olustu.
                        </div>
                    )}

                    {!campaignsQuery.isLoading && !campaignsQuery.isError && filteredRows.length === 0 && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                            Filtrelere uygun kampanya bulunamadi.
                        </div>
                    )}

                    {!campaignsQuery.isLoading && !campaignsQuery.isError && filteredRows.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                                        <th className="px-2 py-3">Kampanya</th>
                                        <th className="px-2 py-3">Platform</th>
                                        <th className="px-2 py-3">Tarih</th>
                                        <th className="px-2 py-3">Butce</th>
                                        <th className="px-2 py-3">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {filteredRows.map((campaign) => (
                                        <tr
                                            key={campaign.id}
                                            onClick={() => setSelectedCampaign(campaign)}
                                            className="cursor-pointer transition hover:bg-gray-50"
                                        >
                                            <td className="px-2 py-3">
                                                <p className="font-semibold text-gray-900">{campaign.title}</p>
                                                <p className="text-xs text-gray-500">{campaign.projectName || '-'}</p>
                                            </td>
                                            <td className="px-2 py-3 text-xs text-gray-600">
                                                {labelForOption(PLATFORM_OPTIONS, campaign.platform)}
                                            </td>
                                            <td className="px-2 py-3 text-xs text-gray-600">
                                                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                                            </td>
                                            <td className="px-2 py-3 text-xs text-gray-600">
                                                {formatCurrency(campaign.budget)}
                                            </td>
                                            <td className="px-2 py-3">
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_BADGE[campaign.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {labelForOption(STATUS_OPTIONS, campaign.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h3 className="mb-3 text-base font-semibold text-gray-900">Kampanya Detayi</h3>

                        {!selectedCampaign && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                Detay gormek icin bir kampanya secin.
                            </div>
                        )}

                        {selectedCampaign && (
                            <div className="space-y-3 text-sm text-gray-700">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Baslik</p>
                                    <p className="text-base font-semibold text-gray-900">{selectedCampaign.title}</p>
                                    <p className="text-xs text-gray-500">{selectedCampaign.projectName || '-'}</p>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Platform</p>
                                        <p className="text-sm text-gray-700">{labelForOption(PLATFORM_OPTIONS, selectedCampaign.platform)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Hedef</p>
                                        <p className="text-sm text-gray-700">{labelForOption(OBJECTIVE_OPTIONS, selectedCampaign.objective)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Butce</p>
                                        <p className="text-sm text-gray-700">{formatCurrency(selectedCampaign.budget)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Sorumlu</p>
                                        <p className="text-sm text-gray-700">{selectedCampaign.owner || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Tarih</p>
                                    <p className="text-sm text-gray-700">
                                        {formatDate(selectedCampaign.startDate)} - {formatDate(selectedCampaign.endDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Aciklama</p>
                                    <p className="text-sm text-gray-600">{selectedCampaign.description || '-'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h3 className="mb-3 text-base font-semibold text-gray-900">Durum Akisi</h3>
                        <div className="space-y-2">
                            {STATUS_OPTIONS.filter((item) => item.value).map((item) => (
                                <div key={item.value} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs">
                                    <span className="font-semibold text-gray-700">{item.label}</span>
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_BADGE[item.value] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <CampaignFormModal
                isOpen={createModalOpen}
                isPending={createCampaignMutation.isPending}
                projects={projectsQuery.data?.data ?? []}
                initialData={{ owner: currentUser?.name ?? '' }}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={async (payload) => {
                    await createCampaignMutation.mutateAsync(payload);
                }}
            />
        </div>
    );
}
