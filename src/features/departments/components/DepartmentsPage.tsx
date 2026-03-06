import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../shared/components/Modal';
import { PageHeader } from '../../../shared/components/PageHeader';
import { formatDate } from '../../../shared/utils/formatDate';
import { showConfirmDialog } from '../../../shared/lib/sweetAlert';
import { getPersonnel } from '../../personnel/api/personnel.api';
import {
    createDepartment,
    createDepartmentModule,
    deleteDepartmentModule,
    getDepartments,
    updateDepartment,
    updateDepartmentModule,
    type DepartmentItem,
    type DepartmentModuleItem,
} from '../api/departments.api';

interface DepartmentFormState {
    name: string;
    description: string;
}

interface ModuleFormState {
    name: string;
    description: string;
    teamLeadId: string;
}

const INITIAL_FORM_STATE: DepartmentFormState = {
    name: '',
    description: '',
};

const INITIAL_MODULE_FORM_STATE: ModuleFormState = {
    name: '',
    description: '',
    teamLeadId: '',
};

export function DepartmentsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentItem | null>(null);
    const [form, setForm] = useState<DepartmentFormState>(INITIAL_FORM_STATE);
    const [formError, setFormError] = useState('');

    const [moduleModalOpen, setModuleModalOpen] = useState(false);
    const [moduleDepartment, setModuleDepartment] = useState<DepartmentItem | null>(null);
    const [editingModule, setEditingModule] = useState<DepartmentModuleItem | null>(null);
    const [moduleForm, setModuleForm] = useState<ModuleFormState>(INITIAL_MODULE_FORM_STATE);
    const [moduleFormError, setModuleFormError] = useState('');

    const departmentsQuery = useQuery({
        queryKey: ['departments'],
        queryFn: getDepartments,
    });

    const teamLeadersQuery = useQuery({
        queryKey: ['personnel', 'team-leaders'],
        queryFn: () => getPersonnel({ page: 1, limit: 200, isActive: 'true' }),
    });
    const departmentTeamLeadersQuery = useQuery({
        queryKey: ['personnel', 'team-leaders', moduleDepartment?.name],
        queryFn: () =>
            getPersonnel({
                page: 1,
                limit: 200,
                isActive: 'true',
                department: moduleDepartment?.name,
            }),
        enabled: !!moduleDepartment?.name,
    });

    const createMutation = useMutation({
        mutationFn: createDepartment,
        onSuccess: async () => {
            toast.success('Departman olusturuldu.');
            await queryClient.invalidateQueries({ queryKey: ['departments'] });
            handleCloseModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: { name?: string; description?: string } }) =>
            updateDepartment(id, payload),
        onSuccess: async () => {
            toast.success('Departman guncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['departments'] });
            handleCloseModal();
        },
    });

    const createModuleMutation = useMutation({
        mutationFn: ({ departmentId, payload }: { departmentId: string; payload: { name: string; description?: string; teamLeadId: string } }) =>
            createDepartmentModule(departmentId, payload),
        onSuccess: async () => {
            toast.success('Alt modul olusturuldu.');
            await queryClient.invalidateQueries({ queryKey: ['departments'] });
            handleCloseModuleModal();
        },
    });

    const updateModuleMutation = useMutation({
        mutationFn: ({ moduleId, payload }: { moduleId: string; payload: { name?: string; description?: string; teamLeadId?: string } }) =>
            updateDepartmentModule(moduleId, payload),
        onSuccess: async () => {
            toast.success('Alt modul guncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['departments'] });
            handleCloseModuleModal();
        },
    });

    const deleteModuleMutation = useMutation({
        mutationFn: (moduleId: string) => deleteDepartmentModule(moduleId),
        onSuccess: async () => {
            toast.success('Alt modul silindi.');
            await queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });

    const departments = departmentsQuery.data ?? [];
    const filteredDepartments = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return departments;

        return departments.filter((department) =>
            `${department.name} ${department.description ?? ''}`.toLowerCase().includes(term),
        );
    }, [departments, search]);

    const hasDescriptionCount = useMemo(
        () => departments.filter((department) => !!department.description?.trim()).length,
        [departments],
    );

    const totalModuleCount = useMemo(
        () => departments.reduce((acc, department) => acc + (department.modules?.length ?? 0), 0),
        [departments],
    );

    const teamLeaders = teamLeadersQuery.data?.data ?? [];
    const departmentTeamLeaders = departmentTeamLeadersQuery.data?.data ?? [];
    const teamLeaderLabelById = useMemo(
        () => Object.fromEntries(teamLeaders.map((person) => [person.id, `${person.firstName} ${person.lastName}`])),
        [teamLeaders],
    );
    const selectableTeamLeaders = useMemo(() => {
        if (!editingModule?.teamLeadId) {
            return departmentTeamLeaders;
        }

        const hasSelected = departmentTeamLeaders.some(
            (person) => person.id === editingModule.teamLeadId,
        );
        if (hasSelected) {
            return departmentTeamLeaders;
        }

        const selected = teamLeaders.find(
            (person) => person.id === editingModule.teamLeadId,
        );

        return selected
            ? [...departmentTeamLeaders, selected]
            : departmentTeamLeaders;
    }, [departmentTeamLeaders, editingModule?.teamLeadId, teamLeaders]);

    const isSubmitting = createMutation.isPending || updateMutation.isPending;
    const isModuleSubmitting = createModuleMutation.isPending || updateModuleMutation.isPending;

    function handleOpenCreateModal() {
        setEditingDepartment(null);
        setForm(INITIAL_FORM_STATE);
        setFormError('');
        setModalOpen(true);
    }

    function handleOpenEditModal(department: DepartmentItem) {
        setEditingDepartment(department);
        setForm({
            name: department.name,
            description: department.description ?? '',
        });
        setFormError('');
        setModalOpen(true);
    }

    function handleCloseModal() {
        setModalOpen(false);
        setEditingDepartment(null);
        setForm(INITIAL_FORM_STATE);
        setFormError('');
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const normalizedName = form.name.trim();
        if (!normalizedName) {
            setFormError('Departman adi zorunludur.');
            return;
        }

        if (editingDepartment) {
            updateMutation.mutate({
                id: editingDepartment.id,
                payload: {
                    name: normalizedName,
                    description: form.description.trim() || undefined,
                },
            });
            return;
        }

        createMutation.mutate({
            name: normalizedName,
            description: form.description.trim() || undefined,
        });
    }

    function handleOpenCreateModuleModal(department: DepartmentItem) {
        setModuleDepartment(department);
        setEditingModule(null);
        setModuleForm(INITIAL_MODULE_FORM_STATE);
        setModuleFormError('');
        setModuleModalOpen(true);
    }

    function handleOpenEditModuleModal(department: DepartmentItem, module: DepartmentModuleItem) {
        setModuleDepartment(department);
        setEditingModule(module);
        setModuleForm({
            name: module.name,
            description: module.description ?? '',
            teamLeadId: module.teamLeadId ?? '',
        });
        setModuleFormError('');
        setModuleModalOpen(true);
    }

    function handleCloseModuleModal() {
        setModuleModalOpen(false);
        setModuleDepartment(null);
        setEditingModule(null);
        setModuleForm(INITIAL_MODULE_FORM_STATE);
        setModuleFormError('');
    }

    function handleSubmitModule(event: FormEvent) {
        event.preventDefault();

        if (!moduleDepartment) {
            setModuleFormError('Departman secimi bulunamadi.');
            return;
        }

        const normalizedName = moduleForm.name.trim();
        if (!normalizedName) {
            setModuleFormError('Alt modul adi zorunludur.');
            return;
        }
        if (!moduleForm.teamLeadId) {
            setModuleFormError('Team leader secilmelidir.');
            return;
        }

        const payload = {
            name: normalizedName,
            description: moduleForm.description.trim() || undefined,
            teamLeadId: moduleForm.teamLeadId,
        };

        if (editingModule) {
            updateModuleMutation.mutate({
                moduleId: editingModule.id,
                payload,
            });
            return;
        }

        createModuleMutation.mutate({
            departmentId: moduleDepartment.id,
            payload,
        });
    }

    async function handleDeleteModule(module: DepartmentModuleItem) {
        const isConfirmed = await showConfirmDialog({
            title: 'Alt modul silinsin mi?',
            text: `${module.name} alt modulu silinecek.`,
            confirmText: 'Sil',
        });

        if (!isConfirmed) {
            return;
        }

        deleteModuleMutation.mutate(module.id);
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<Building2 size={20} color="#DC2626" />}
                title="Departmanlar"
                subtitle="Departman yapisini yonetin ve ekip organizasyonunu takip edin."
                actions={(
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        <Plus size={14} />
                        Yeni Departman
                    </button>
                )}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Departman</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{departments.length}</p>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Alt Modul</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{totalModuleCount}</p>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Aciklama Girilen</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{hasDescriptionCount}</p>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Filtre Sonucu</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{filteredDepartments.length}</p>
                </article>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-4">
                    <label className="relative block max-w-sm">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                            <Search size={14} />
                        </span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            type="text"
                            placeholder="Departman ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </label>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Departman Adi</th>
                                <th className="px-4 py-3 font-semibold">Aciklama</th>
                                <th className="px-4 py-3 font-semibold">Alt Moduller</th>
                                <th className="px-4 py-3 font-semibold">Guncelleme</th>
                                <th className="px-4 py-3 font-semibold">Islem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {departmentsQuery.isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                        Departmanlar yukleniyor...
                                    </td>
                                </tr>
                            ) : departmentsQuery.isError ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-red-600">
                                        Departmanlar yuklenemedi.
                                    </td>
                                </tr>
                            ) : filteredDepartments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                        Gosterilecek departman bulunamadi.
                                    </td>
                                </tr>
                            ) : (
                                filteredDepartments.map((department) => (
                                    <tr key={department.id} className="hover:bg-gray-50 align-top">
                                        <td className="px-4 py-3 font-semibold text-gray-900">{department.name}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {department.description?.trim() || 'Aciklama yok'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {department.modules.length === 0 ? (
                                                <span className="text-xs text-gray-400">Alt modul yok</span>
                                            ) : (
                                                <div className="space-y-2">
                                                    {department.modules.map((module) => (
                                                        <div
                                                            key={module.id}
                                                            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-800">{module.name}</p>
                                                                    <p className="text-[11px] text-gray-500">
                                                                        Lider: {module.teamLeadId ? (teamLeaderLabelById[module.teamLeadId] ?? 'Atanmamis') : 'Atanmamis'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenEditModuleModal(department, module)}
                                                                        className="rounded border border-gray-300 p-1 text-gray-600 hover:bg-white"
                                                                        title="Alt modul duzenle"
                                                                    >
                                                                        <Pencil size={11} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteModule(module)}
                                                                        className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50"
                                                                        title="Alt modul sil"
                                                                    >
                                                                        <Trash2 size={11} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {formatDate(department.updatedAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(department)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                                >
                                                    <Pencil size={12} />
                                                    Duzenle
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenCreateModuleModal(department)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                                                >
                                                    <Plus size={12} />
                                                    Alt Modul
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {modalOpen && (
                <Modal
                    title={editingDepartment ? 'Departman Duzenle' : 'Yeni Departman Ekle'}
                    onClose={handleCloseModal}
                    width={520}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Departman Adi</label>
                            <input
                                value={form.name}
                                onChange={(event) => {
                                    setForm((prev) => ({ ...prev, name: event.target.value }));
                                    if (formError) setFormError('');
                                }}
                                placeholder="Ornek: SATIS"
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                            {formError && <p className="mt-1 text-xs font-medium text-red-600">{formError}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Aciklama</label>
                            <textarea
                                value={form.description}
                                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                rows={3}
                                placeholder="Departmanin gorev alani"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="h-9 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Iptal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {isSubmitting ? 'Kaydediliyor...' : editingDepartment ? 'Guncelle' : 'Olustur'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {moduleModalOpen && moduleDepartment && (
                <Modal
                    title={editingModule ? 'Alt Modul Duzenle' : `${moduleDepartment.name} Alt Modul Ekle`}
                    onClose={handleCloseModuleModal}
                    width={560}
                >
                    <form onSubmit={handleSubmitModule} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Alt Modul Adi</label>
                            <input
                                value={moduleForm.name}
                                onChange={(event) => {
                                    setModuleForm((prev) => ({ ...prev, name: event.target.value }));
                                    if (moduleFormError) setModuleFormError('');
                                }}
                                placeholder="Ornek: FRONTEND_DEVELOPER"
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                            {moduleFormError && <p className="mt-1 text-xs font-medium text-red-600">{moduleFormError}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Aciklama</label>
                            <textarea
                                value={moduleForm.description}
                                onChange={(event) => setModuleForm((prev) => ({ ...prev, description: event.target.value }))}
                                rows={3}
                                placeholder="Alt modulun gorev tanimi"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Team Leader</label>
                            <select
                                value={moduleForm.teamLeadId}
                                onChange={(event) => setModuleForm((prev) => ({ ...prev, teamLeadId: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            >
                                <option value="">Secin...</option>
                                {selectableTeamLeaders.map((person) => (
                                    <option key={person.id} value={person.id}>
                                        {person.firstName} {person.lastName} ({person.role})
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                                <Users size={11} />
                                Alt modul icin sorumlu ekip lideri atanir.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleCloseModuleModal}
                                className="h-9 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Iptal
                            </button>
                            <button
                                type="submit"
                                disabled={isModuleSubmitting}
                                className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {isModuleSubmitting ? 'Kaydediliyor...' : editingModule ? 'Guncelle' : 'Olustur'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
