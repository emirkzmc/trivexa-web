import { useState } from 'react';
import { usePersonnel } from '../hooks/usePersonnel';
import { useCreatePersonnel, useUpdatePersonnel, useDeletePersonnel } from '../hooks/usePersonnelMutations';
import { useExportPersonnel } from '../hooks/useExportPersonnel';
import { PersonnelFormModal } from './PersonnelFormModal';
import { PersonnelFilters } from './PersonnelFilters';
import { PersonnelTable } from './PersonnelTable';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import type { PersonnelItem, PersonnelCreatePayload, PersonnelUpdatePayload } from '../api/personnel.api';
import { Users, Plus, Download } from 'lucide-react';

export function PersonnelPage() {
    const { data, isLoading, isError, filters, setFilter, setPage } = usePersonnel();
    const createMutation = useCreatePersonnel();
    const updateMutation = useUpdatePersonnel();
    const deleteMutation = useDeletePersonnel();
    const exportMutation = useExportPersonnel();

    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<PersonnelItem | null>(null);

    const personnel = Array.isArray(data?.data) ? data.data : [];
    const total = data?.meta?.total ?? 0;
    const currentPage = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    function handleCreate() {
        setEditItem(null);
        setModalOpen(true);
    }

    function handleEdit(item: PersonnelItem) {
        setEditItem(item);
        setModalOpen(true);
    }

    function handleSubmit(payload: PersonnelCreatePayload | PersonnelUpdatePayload) {
        if (editItem) {
            updateMutation.mutate({ id: editItem.id, payload: payload as PersonnelUpdatePayload }, {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            createMutation.mutate(payload as PersonnelCreatePayload, {
                onSuccess: () => setModalOpen(false),
            });
        }
    }

    function handleDeactivate(item: PersonnelItem) {
        if (confirm(`${item.firstName} ${item.lastName} deaktif edilecek. Emin misiniz?`)) {
            deleteMutation.mutate(item.id);
        }
    }

    function clearFilters() {
        setFilter('department', undefined);
        setFilter('role', undefined);
        setFilter('isActive', undefined);
        setFilter('search', undefined);
    }

    const hasFilters = !!(filters.department || filters.role || filters.isActive || filters.search);

    const headerActions = (
        <>
            <button
                onClick={() => exportMutation.mutate(filters)}
                disabled={exportMutation.isPending}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
                    backgroundColor: '#fff', color: '#374151', fontSize: 13,
                    fontWeight: 500, cursor: 'pointer',
                }}
            >
                <Download size={15} /> Dışa Aktar
            </button>
            <button
                onClick={handleCreate}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    backgroundColor: '#DC2626', color: '#fff', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                }}
            >
                <Plus size={15} /> Personel Ekle
            </button>
        </>
    );

    return (
        <div style={{ padding: '24px 32px', fontFamily: "'Poppins', system-ui, sans-serif" }}>
            <PageHeader
                icon={<Users size={20} color="#DC2626" />}
                title="Personel Yönetimi"
                subtitle={`Toplam ${total} personel`}
                actions={headerActions}
            />

            <PersonnelFilters
                filters={filters}
                onFilterChange={setFilter}
                onClear={clearFilters}
            />

            <PersonnelTable
                data={personnel}
                isLoading={isLoading}
                isError={isError}
                hasFilters={hasFilters}
                onEdit={handleEdit}
                onDeactivate={handleDeactivate}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(total / limit)}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(newLimit) => setFilter('limit', String(newLimit))}
            />

            {modalOpen && (
                <PersonnelFormModal
                    editItem={editItem}
                    onSubmit={handleSubmit}
                    onClose={() => setModalOpen(false)}
                    isPending={createMutation.isPending || updateMutation.isPending}
                />
            )}
        </div>
    );
}
