import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Plus, Users } from 'lucide-react';
import { usePersonnel } from '../hooks/usePersonnel';
import {
    useActivatePersonnel,
    useCreatePersonnel,
    useDeactivatePersonnel,
    useUpdatePersonnel,
} from '../hooks/usePersonnelMutations';
import { useExportPersonnel, type PersonnelExportFormat } from '../hooks/useExportPersonnel';
import { PersonnelFormModal } from './PersonnelFormModal';
import { PersonnelFilters } from './PersonnelFilters';
import { PersonnelTable } from './PersonnelTable';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { showConfirmDialog } from '../../../shared/lib/sweetAlert';
import { ROLE_LABELS } from '../../../shared/constants/roleLabels';
import { DEPARTMENT_LABELS } from '../../../shared/constants/departments';
import { getRoles } from '../../roles/api/roles.api';
import { getDepartments } from '../../departments/api/departments.api';
import type {
    PersonnelCreatePayload,
    PersonnelItem,
    PersonnelUpdatePayload,
} from '../api/personnel.api';

export function PersonnelPage() {
    const { data, isLoading, isError, filters, setFilter, setFilters, setPage } = usePersonnel();
    const rolesQuery = useQuery({
        queryKey: ['roles', 'personnel-form'],
        queryFn: getRoles,
    });
    const departmentsQuery = useQuery({
        queryKey: ['departments', 'personnel-form'],
        queryFn: getDepartments,
    });

    const createMutation = useCreatePersonnel();
    const updateMutation = useUpdatePersonnel();
    const deactivateMutation = useDeactivatePersonnel();
    const activateMutation = useActivatePersonnel();
    const exportMutation = useExportPersonnel();

    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<PersonnelItem | null>(null);
    const [exportFormat, setExportFormat] = useState<PersonnelExportFormat>('pdf');

    const personnel = Array.isArray(data?.data) ? data.data : [];
    const total = data?.meta?.total ?? 0;
    const currentPage = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const roleOptions = (rolesQuery.data ?? []).map((role) => {
        const normalizedName = role.name.trim().toUpperCase();
        return {
            value: role.name,
            label: ROLE_LABELS[normalizedName] ?? role.name,
        };
    });

    const departmentOptions = (departmentsQuery.data ?? []).map((department) => {
        const normalizedName = department.name.trim().toUpperCase();
        return {
            value: department.name,
            label: DEPARTMENT_LABELS[normalizedName] ?? department.name,
        };
    });

    const departmentModulesByDepartment = Object.fromEntries(
        (departmentsQuery.data ?? []).map((department) => [
            department.name,
            (department.modules ?? []).map((module) => ({
                value: module.id,
                label: module.name,
            })),
        ]),
    );

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
            updateMutation.mutate(
                { id: editItem.id, payload: payload as PersonnelUpdatePayload },
                { onSuccess: () => setModalOpen(false) },
            );
            return;
        }

        createMutation.mutate(payload as PersonnelCreatePayload, {
            onSuccess: () => setModalOpen(false),
        });
    }

    async function handleToggleActive(item: PersonnelItem) {
        const fullName = `${item.firstName} ${item.lastName}`;

        if (item.isActive) {
            const isConfirmed = await showConfirmDialog({
                title: 'Personel deaktif edilsin mi?',
                text: `${fullName} deaktif edilecek.`,
                confirmText: 'Deaktif Et',
            });
            if (isConfirmed) {
                deactivateMutation.mutate(item.id);
            }
            return;
        }

        const isConfirmed = await showConfirmDialog({
            title: 'Personel aktif edilsin mi?',
            text: `${fullName} aktif edilecek.`,
            confirmText: 'Aktif Et',
            icon: 'question',
        });
        if (isConfirmed) {
            activateMutation.mutate(item.id);
        }
    }

    function clearFilters() {
        setFilters({
            department: undefined,
            role: undefined,
            isActive: undefined,
            search: undefined,
        });
    }

    const hasFilters = !!(filters.department || filters.role || filters.isActive || filters.search);

    const headerActions = (
        <>
            <select
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value as PersonnelExportFormat)}
                style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                }}
            >
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="xlsx">EXCEL (XLSX)</option>
                <option value="csv">CSV</option>
            </select>

            <button
                onClick={() => exportMutation.mutate({ filters, format: exportFormat })}
                disabled={exportMutation.isPending}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                }}
            >
                <Download size={15} /> Disa Aktar
            </button>

            <button
                onClick={handleCreate}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'var(--role-accent-600)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                <Plus size={15} /> Personel Ekle
            </button>
        </>
    );

    return (
        <div style={{ padding: '24px 32px', fontFamily: "'Poppins', system-ui, sans-serif" }}>
            <PageHeader
                icon={<Users size={20} color="var(--role-accent-600)" />}
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
                onToggleActive={handleToggleActive}
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
                    roleOptions={roleOptions}
                    departmentOptions={departmentOptions}
                    departmentModulesByDepartment={departmentModulesByDepartment}
                    rolesLoading={rolesQuery.isLoading}
                    departmentsLoading={departmentsQuery.isLoading}
                />
            )}
        </div>
    );
}
