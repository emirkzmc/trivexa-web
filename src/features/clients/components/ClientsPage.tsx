import { useMemo, useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { ROLES } from '../../../shared/constants/roles';
import { useAuthStore } from '../../auth/store/authStore';
import type {
    ClientCreatePayload,
    ClientItem,
    ClientUpdatePayload,
} from '../api/clients.api';
import { useCreateClient, useGeneratePortalAccess, useUpdateClient } from '../hooks/useClientMutations';
import { useClients } from '../hooks/useClients';
import { ClientFormModal } from './ClientFormModal';
import { ClientsTable } from './ClientsTable';

export function ClientsPage() {
    const navigate = useNavigate();
    const userRole = useAuthStore((state) => state.user?.role);
    const canReadClients = userRole === ROLES.ADMIN || userRole === ROLES.MANAGER;

    const {
        data,
        isLoading,
        isError,
        filters,
        setFilter,
        setPage,
    } = useClients({ enabled: canReadClients });

    const createMutation = useCreateClient();
    const updateMutation = useUpdateClient();
    const portalAccessMutation = useGeneratePortalAccess();

    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<ClientItem | null>(null);

    const rows = Array.isArray(data?.data) ? data.data : [];
    const total = data?.total ?? 0;
    const currentPage = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const hasFilters = !!(filters.search || filters.isActive);

    const stats = useMemo(() => {
        const activeCount = rows.filter((item) => item.isActive).length;
        const passiveCount = rows.length - activeCount;
        return { activeCount, passiveCount };
    }, [rows]);

    function openCreateModal() {
        setEditItem(null);
        setModalOpen(true);
    }

    function openEditModal(item: ClientItem) {
        setEditItem(item);
        setModalOpen(true);
    }

    function clearFilters() {
        setFilter('search', undefined);
        setFilter('isActive', undefined);
    }

    function handleSubmit(payload: ClientCreatePayload | ClientUpdatePayload) {
        if (editItem) {
            updateMutation.mutate(
                { id: editItem.id, payload },
                {
                    onSuccess: () => setModalOpen(false),
                },
            );
            return;
        }

        createMutation.mutate(payload as ClientCreatePayload, {
            onSuccess: () => setModalOpen(false),
        });
    }

    async function handleGenerateAccess(item: ClientItem) {
        try {
            const response = await portalAccessMutation.mutateAsync({ email: item.email });
            const link = response.portalUrl || response.magicLink;

            if (!link) {
                return;
            }

            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(link);
                toast.success('Portal linki olusturuldu ve panoya kopyalandi.', { duration: 3_000 });
                return;
            }

            toast.success('Portal linki olusturuldu.', { duration: 3_000 });
        } catch {
            // Error toast is handled in mutation hook.
        }
    }

    const headerActions = (
        <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
            <Plus size={14} />
            Yeni Musteri
        </button>
    );

    if (!canReadClients) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<Building2 size={20} color="#DC2626" />}
                    title="Musteri Yonetimi"
                    subtitle="Yetki kontrolu"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu ekrana sadece ADMIN ve MANAGER rolleri erisebilir.
                </section>
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<Building2 size={20} color="#DC2626" />}
                title="Musteri Yonetimi"
                subtitle={`Toplam ${total} musteri`}
                actions={headerActions}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Kayit</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{total}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Aktif</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.activeCount}</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-red-700">Pasif</p>
                    <p className="mt-2 text-2xl font-bold text-red-800">{stats.passiveCount}</p>
                </div>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={filters.search ?? ''}
                            onChange={(event) => setFilter('search', event.target.value || undefined)}
                            placeholder="Sirket, yetkili veya e-posta ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <select
                        value={filters.isActive ?? ''}
                        onChange={(event) => setFilter('isActive', event.target.value || undefined)}
                        className="h-9 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="">Tum Durumlar</option>
                        <option value="true">Sadece Aktif</option>
                        <option value="false">Sadece Pasif</option>
                    </select>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        Filtreyi Temizle
                    </button>
                </div>
            </section>

            <ClientsTable
                data={rows}
                isLoading={isLoading}
                isError={isError}
                hasFilters={hasFilters}
                isGeneratingAccess={portalAccessMutation.isPending}
                onOpenDetail={(item) => navigate(`/app/musteriler/${item.id}`)}
                onEdit={openEditModal}
                onGenerateAccess={handleGenerateAccess}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(total / limit))}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(nextLimit) => setFilter('limit', String(nextLimit))}
                limitOptions={[10, 20, 50, 100]}
            />

            {modalOpen && (
                <ClientFormModal
                    editItem={editItem}
                    isPending={createMutation.isPending || updateMutation.isPending}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
}
