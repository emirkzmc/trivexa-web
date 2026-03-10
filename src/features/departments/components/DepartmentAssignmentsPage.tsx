import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Network, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Modal } from '../../../shared/components/Modal';
import { Pagination } from '../../../shared/components/Pagination';
import { DEPARTMENT_LABELS } from '../../../shared/constants/departments';
import { getPersonnel, updatePersonnel, type PersonnelItem } from '../../personnel/api/personnel.api';
import { getDepartments } from '../api/departments.api';

const DEFAULT_LIMIT = 20;

interface AssignmentFormState {
    department: string;
    subDepartmentId: string;
}

const INITIAL_ASSIGNMENT_FORM: AssignmentFormState = {
    department: '',
    subDepartmentId: '',
};

export function DepartmentAssignmentsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_LIMIT);
    const [selectedUser, setSelectedUser] = useState<PersonnelItem | null>(null);
    const [form, setForm] = useState<AssignmentFormState>(INITIAL_ASSIGNMENT_FORM);
    const [formError, setFormError] = useState('');

    const departmentsQuery = useQuery({
        queryKey: ['departments'],
        queryFn: getDepartments,
    });

    const personnelQuery = useQuery({
        queryKey: ['personnel', 'department-assignments', page, limit, search, departmentFilter, moduleFilter, activeFilter],
        queryFn: () => getPersonnel({
            page,
            limit,
            search: search.trim() || undefined,
            department: departmentFilter || undefined,
            subDepartmentId: moduleFilter || undefined,
            isActive: activeFilter || undefined,
        }),
        keepPreviousData: true,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: { department?: string; subDepartmentId?: string } }) =>
            updatePersonnel(id, payload),
        onSuccess: async () => {
            toast.success('Departman atamasi guncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['personnel', 'department-assignments'] });
            handleCloseModal();
        },
    });

    const departments = departmentsQuery.data ?? [];
    const personnel = personnelQuery.data?.data ?? [];
    const total = personnelQuery.data?.meta?.total ?? 0;
    const totalPages = personnelQuery.data?.meta?.totalPages ?? 1;

    const moduleNameById = useMemo(
        () => Object.fromEntries(
            departments.flatMap((department) =>
                (department.modules ?? []).map((module) => [module.id, module.name]),
            ),
        ),
        [departments],
    );

    const departmentOptions = useMemo(
        () => departments.map((department) => ({
            value: department.name,
            label: DEPARTMENT_LABELS[department.name] ?? department.name,
        })),
        [departments],
    );

    const moduleOptions = useMemo(() => {
        if (!departmentFilter) return [];
        const department = departments.find((item) => item.name === departmentFilter);
        return (department?.modules ?? []).map((module) => ({
            value: module.id,
            label: module.name,
        }));
    }, [departments, departmentFilter]);

    const selectedDepartment = useMemo(() => {
        if (!form.department) return null;
        return departments.find((department) => department.name === form.department) ?? null;
    }, [departments, form.department]);

    const selectedDepartmentModules = selectedDepartment?.modules ?? [];

    function handleFilterReset() {
        setSearch('');
        setDepartmentFilter('');
        setModuleFilter('');
        setActiveFilter('');
        setPage(1);
    }

    function handleDepartmentFilterChange(value: string) {
        setDepartmentFilter(value);
        setModuleFilter('');
        setPage(1);
    }

    function handleModuleFilterChange(value: string) {
        setModuleFilter(value);
        setPage(1);
    }

    function handleActiveFilterChange(value: string) {
        setActiveFilter(value);
        setPage(1);
    }

    function handleOpenModal(user: PersonnelItem) {
        setSelectedUser(user);
        setForm({
            department: user.department ?? '',
            subDepartmentId: user.subDepartmentId ?? '',
        });
        setFormError('');
    }

    function handleCloseModal() {
        setSelectedUser(null);
        setForm(INITIAL_ASSIGNMENT_FORM);
        setFormError('');
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!selectedUser) return;

        if (!form.department) {
            setFormError('Departman secilmelidir.');
            return;
        }

        updateMutation.mutate({
            id: selectedUser.id,
            payload: {
                department: form.department,
                subDepartmentId: form.subDepartmentId ? form.subDepartmentId : null,
            },
        });
    }

    function handleDepartmentChange(value: string) {
        setForm((prev) => {
            const normalized = value ?? '';
            const next = { ...prev, department: normalized };
            if (!normalized) {
                next.subDepartmentId = '';
                return next;
            }
            const department = departments.find((item) => item.name === normalized);
            if (!department?.modules?.some((module) => module.id === prev.subDepartmentId)) {
                next.subDepartmentId = '';
            }
            return next;
        });
        if (formError) setFormError('');
    }

    function handleModuleChange(value: string) {
        setForm((prev) => ({ ...prev, subDepartmentId: value }));
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<Network size={20} color="#DC2626" />}
                title="Departman Atamalari"
                subtitle="Personellerin departman ve alt modul atamalarini yonetin."
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Personel</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{total}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Departman Sayisi</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{departments.length}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Filtre Sonucu</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{personnel.length}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Aktif Filtre</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                        {[search, departmentFilter, moduleFilter, activeFilter].filter(Boolean).length}
                    </p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="relative min-w-[240px] flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                            <Search size={14} />
                        </span>
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            type="text"
                            placeholder="Personel adi veya e-posta ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </label>

                    <select
                        value={departmentFilter}
                        onChange={(event) => handleDepartmentFilterChange(event.target.value)}
                        className="h-9 min-w-[180px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="">Departman (Tum)</option>
                        {departmentOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <select
                        value={moduleFilter}
                        onChange={(event) => handleModuleFilterChange(event.target.value)}
                        disabled={!departmentFilter}
                        className="h-9 min-w-[180px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                        <option value="">Alt Modul (Tum)</option>
                        {moduleOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <select
                        value={activeFilter}
                        onChange={(event) => handleActiveFilterChange(event.target.value)}
                        className="h-9 min-w-[150px] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                        <option value="">Durum (Tum)</option>
                        <option value="true">Aktif</option>
                        <option value="false">Pasif</option>
                    </select>

                    <button
                        type="button"
                        onClick={handleFilterReset}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        Filtreleri Sifirla
                    </button>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Personel</th>
                                <th className="px-4 py-3 font-semibold">Rol</th>
                                <th className="px-4 py-3 font-semibold">Departman</th>
                                <th className="px-4 py-3 font-semibold">Alt Modul</th>
                                <th className="px-4 py-3 font-semibold">Durum</th>
                                <th className="px-4 py-3 font-semibold">Islem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {personnelQuery.isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                        Personel listesi yukleniyor...
                                    </td>
                                </tr>
                            ) : personnelQuery.isError ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-red-600">
                                        Personel listesi yuklenemedi.
                                    </td>
                                </tr>
                            ) : personnel.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                        Gosterilecek personel bulunamadi.
                                    </td>
                                </tr>
                            ) : (
                                personnel.map((person) => (
                                    <tr key={person.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">
                                                    {person.firstName} {person.lastName}
                                                </span>
                                                <span className="text-xs text-gray-500">{person.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{person.role}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {DEPARTMENT_LABELS[person.department] ?? person.department ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {person.subDepartmentName
                                                ?? (person.subDepartmentId ? moduleNameById[person.subDepartmentId] : null)
                                                ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                person.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                            }`}
                                            >
                                                {person.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenModal(person)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                            >
                                                <Users size={12} />
                                                Atama
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(nextLimit) => {
                    setLimit(Number(nextLimit));
                    setPage(1);
                }}
            />

            {selectedUser && (
                <Modal
                    title="Departman Atamasi"
                    onClose={handleCloseModal}
                    width={540}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Personel</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {selectedUser.firstName} {selectedUser.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{selectedUser.email}</p>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Departman</label>
                            <select
                                value={form.department}
                                onChange={(event) => handleDepartmentChange(event.target.value)}
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            >
                                <option value="">Secin...</option>
                                {departmentOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            {formError && (
                                <p className="mt-1 text-xs font-medium text-red-600">{formError}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Alt Modul</label>
                            <select
                                value={form.subDepartmentId}
                                onChange={(event) => handleModuleChange(event.target.value)}
                                disabled={!form.department}
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                            >
                                <option value="">Atama yok</option>
                                {selectedDepartmentModules.map((module) => (
                                    <option key={module.id} value={module.id}>{module.name}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Departman icindeki alt modulleri secerek ekip atamasi yapabilirsiniz.
                            </p>
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
                                disabled={updateMutation.isPending}
                                className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
