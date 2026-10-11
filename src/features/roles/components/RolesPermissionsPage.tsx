import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, KeyRound, Plus, Save, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Modal } from '../../../shared/components/Modal';
import { ROLES } from '../../../shared/constants/roles';
import { showConfirmDialog } from '../../../shared/lib/sweetAlert';
import {
    assignPermissions,
    createRole,
    deleteRole,
    getPermissions,
    getRolePermissions,
    getRoles,
    type AssignPermissionsPayload,
    type RoleItem,
} from '../api/roles.api';

function normalizeRoleName(roleName: string): string {
    return roleName.trim().toUpperCase().replace(/\s+/g, '_');
}

export function RolesPermissionsPage() {
    const queryClient = useQueryClient();
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([]);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');
    const [createRoleError, setCreateRoleError] = useState('');
    const protectedRoleNames = useMemo(
        () => new Set(Object.values(ROLES).map((role) => normalizeRoleName(role))),
        [],
    );

    const rolesQuery = useQuery({
        queryKey: ['roles'],
        queryFn: getRoles,
    });

    const permissionsQuery = useQuery({
        queryKey: ['permissions'],
        queryFn: getPermissions,
    });

    const selectedRole = useMemo(
        () => rolesQuery.data?.find((role) => role.id === selectedRoleId) ?? rolesQuery.data?.[0],
        [rolesQuery.data, selectedRoleId],
    );

    useEffect(() => {
        if (!rolesQuery.data?.length) return;
        if (!selectedRoleId || !rolesQuery.data.some((role) => role.id === selectedRoleId)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedRoleId(rolesQuery.data[0].id);
        }
    }, [rolesQuery.data, selectedRoleId]);

    const rolePermissionsQuery = useQuery({
        queryKey: ['role-permissions', selectedRole?.id],
        queryFn: () => getRolePermissions(selectedRole!.id),
        enabled: !!selectedRole?.id,
    });

    useEffect(() => {
        if (!rolePermissionsQuery.data) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraftPermissionIds(Array.from(new Set(rolePermissionsQuery.data.map((permission) => permission.id))));
    }, [rolePermissionsQuery.data]);

    const saveMutation = useMutation({
        mutationFn: (payload: AssignPermissionsPayload) => assignPermissions(payload),
        onSuccess: async (_, payload) => {
            toast.success('Rol izinleri güncellendi.');
            await queryClient.invalidateQueries({ queryKey: ['role-permissions', payload.roleId] });
        },
    });

    const createRoleMutation = useMutation({
        mutationFn: (payload: { name: string; description?: string }) => createRole(payload),
        onSuccess: async (role) => {
            toast.success('Yeni rol olusturuldu.');
            queryClient.setQueryData<RoleItem[]>(['roles'], (oldRoles) => {
                if (!oldRoles) return [role];
                if (oldRoles.some((item) => item.id === role.id)) return oldRoles;
                return [...oldRoles, role];
            });
            setSelectedRoleId(role.id);
            setCreateModalOpen(false);
            setNewRoleName('');
            setNewRoleDescription('');
            setCreateRoleError('');
            await queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
        onError: () => {
            setCreateRoleError('Rol olusturulamadi. Rol adi benzersiz olmalidir.');
        },
    });

    const deleteRoleMutation = useMutation({
        mutationFn: (roleId: string) => deleteRole(roleId),
        onSuccess: async (_, roleId) => {
            toast.success('Rol silindi.');
            queryClient.setQueryData<RoleItem[]>(['roles'], (oldRoles) =>
                (oldRoles ?? []).filter((role) => role.id !== roleId),
            );
            if (selectedRoleId === roleId) {
                setSelectedRoleId('');
            }
            await queryClient.invalidateQueries({ queryKey: ['roles'] });
            await queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
        },
    });

    const permissionPool = useMemo(() => permissionsQuery.data || [], [permissionsQuery.data]);
    const filteredPermissions = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return permissionPool;

        return permissionPool.filter((permission) =>
            `${permission.name} ${permission.description ?? ''} ${permission.id}`.toLowerCase().includes(term),
        );
    }, [permissionPool, search]);

    const currentPermissionIds = useMemo(
        () => Array.from(new Set((rolePermissionsQuery.data ?? []).map((permission) => permission.id))).sort(),
        [rolePermissionsQuery.data],
    );

    const draftPermissionSet = useMemo(
        () => new Set(draftPermissionIds),
        [draftPermissionIds],
    );

    const isDirty = useMemo(() => {
        const draftSorted = [...draftPermissionIds].sort();
        if (draftSorted.length !== currentPermissionIds.length) return true;
        return draftSorted.some((permissionId, index) => permissionId !== currentPermissionIds[index]);
    }, [currentPermissionIds, draftPermissionIds]);

    function handleTogglePermission(permissionId: string) {
        setDraftPermissionIds((prev) => {
            if (prev.includes(permissionId)) {
                return prev.filter((id) => id !== permissionId);
            }
            return [...prev, permissionId];
        });
    }

    function handleSelectAllFiltered() {
        setDraftPermissionIds((prev) => {
            const next = new Set(prev);
            for (const permission of filteredPermissions) {
                next.add(permission.id);
            }
            return Array.from(next);
        });
    }

    function handleClearAll() {
        setDraftPermissionIds([]);
    }

    function handleSave() {
        if (!selectedRole) return;
        saveMutation.mutate({
            roleId: selectedRole.id,
            permissionIds: draftPermissionIds,
        });
    }

    function isProtectedRole(roleName: string): boolean {
        return protectedRoleNames.has(normalizeRoleName(roleName));
    }

    async function handleDeleteRole(roleId: string, roleName: string) {
        if (isProtectedRole(roleName)) {
            toast.error('Ana roller silinemez.');
            return;
        }

        const confirmed = await showConfirmDialog({
            title: 'Rolu silmek istiyor musunuz?',
            text: `${roleName} kalici olarak silinecek.`,
            confirmText: 'Rolu Sil',
        });
        if (!confirmed) return;

        deleteRoleMutation.mutate(roleId);
    }

    function handleOpenCreateRoleModal() {
        setCreateRoleError('');
        setCreateModalOpen(true);
    }

    function handleCreateRoleSubmit(event: FormEvent) {
        event.preventDefault();

        const normalizedName = newRoleName.trim();
        if (!normalizedName) {
            setCreateRoleError('Rol adi zorunludur.');
            return;
        }

        createRoleMutation.mutate({
            name: normalizedName,
            description: newRoleDescription.trim() || undefined,
        });
    }

    const isPageLoading = rolesQuery.isLoading || permissionsQuery.isLoading;
    const hasPageError = rolesQuery.isError || permissionsQuery.isError;
    const selectedCount = draftPermissionIds.length;

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<ShieldCheck size={20} color="var(--role-accent-600)" />}
                title="Roller ve İzinler"
                subtitle="Rolleri secip izinleri backend uzerinden yonetin."
                actions={(
                    <>
                        <button
                            type="button"
                            onClick={handleOpenCreateRoleModal}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            <Plus size={14} />
                            Yeni Rol
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!selectedRole || !isDirty || saveMutation.isPending || rolePermissionsQuery.isLoading}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            <Save size={14} />
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'İzinleri Kaydet'}
                        </button>
                    </>
                )}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-2 inline-flex rounded-lg bg-red-100 p-2 text-red-600">
                        <Users size={16} />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Rol</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{rolesQuery.data?.length ?? 0}</p>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-2 inline-flex rounded-lg bg-blue-100 p-2 text-blue-600">
                        <KeyRound size={16} />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam İzin</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{permissionPool.length}</p>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-2 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-600">
                        <CheckSquare size={16} />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Seçili Rol İzin</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{selectedCount}</p>
                </article>

                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-2 inline-flex rounded-lg bg-amber-100 p-2 text-amber-600">
                        <Search size={16} />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Filtre Sonucu</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{filteredPermissions.length}</p>
                </article>
            </section>

            {hasPageError && (
                <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Roller veya izinler yüklenemedi. API baglantisini kontrol edin.
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
                <aside className="rounded-xl border border-gray-200 bg-white p-3">
                    <h2 className="mb-2 px-2 text-sm font-semibold text-gray-900">Roller</h2>

                    {isPageLoading ? (
                        <p className="px-2 py-6 text-sm text-gray-500">Roller yükleniyor...</p>
                    ) : (rolesQuery.data?.length ?? 0) === 0 ? (
                        <p className="px-2 py-6 text-sm text-gray-500">Gosterilecek rol yok.</p>
                    ) : (
                        <div className="space-y-2">
                            {rolesQuery.data?.map((role) => {
                                const isSelected = selectedRole?.id === role.id;
                                const isProtected = isProtectedRole(role.name);

                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setSelectedRoleId(role.id)}
                                        className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                                            isSelected
                                                ? 'sem-role-selected'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-gray-900">{role.name}</p>
                                            {!isProtected && (
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleDeleteRole(role.id, role.name);
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            handleDeleteRole(role.id, role.name);
                                                        }
                                                    }}
                                                    className="sem-role-delete-hover inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 transition"
                                                    aria-label={`${role.name} rolunu sil`}
                                                >
                                                    <Trash2 size={14} />
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">{role.description || 'Açıklama yok'}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </aside>

                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">
                                    {selectedRole ? `${selectedRole.name} İzin Matrisi` : 'İzin Matrisi'}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    İzin seçimleri backend'den okunur ve kaydet ile backend'e yazılır.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAllFiltered}
                                    disabled={!filteredPermissions.length}
                                    className="h-8 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Filtredekileri Sec
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    disabled={!draftPermissionIds.length}
                                    className="h-8 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Temizle
                                </button>
                            </div>
                        </div>

                        <label className="relative block max-w-sm">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                                <Search size={14} />
                            </span>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                type="text"
                                placeholder="İzin ara (ad, açıklama veya ID)"
                                className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </label>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Durum</th>
                                    <th className="px-4 py-3 font-semibold">İzin Adi</th>
                                    <th className="px-4 py-3 font-semibold">Açıklama</th>
                                    <th className="px-4 py-3 font-semibold">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isPageLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                                            İzinler yükleniyor...
                                        </td>
                                    </tr>
                                ) : rolePermissionsQuery.isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                                            Seçili rol izinleri yükleniyor...
                                        </td>
                                    </tr>
                                ) : rolePermissionsQuery.isError ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-red-600">
                                            Rol izinleri okunamadi.
                                        </td>
                                    </tr>
                                ) : filteredPermissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                                            Aramaya uygun izin bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPermissions.map((permission) => {
                                        const checked = draftPermissionSet.has(permission.id);

                                        return (
                                            <tr key={permission.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => handleTogglePermission(permission.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        {checked ? 'İzinli' : 'Kapalı'}
                                                    </label>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-800">{permission.name}</td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {permission.description || 'Açıklama yok'}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{permission.id}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {createModalOpen && (
                <Modal
                    title="Yeni Rol Ekle"
                    onClose={() => setCreateModalOpen(false)}
                    width={520}
                >
                    <form onSubmit={handleCreateRoleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Rol Adi</label>
                            <input
                                value={newRoleName}
                                onChange={(event) => {
                                    setNewRoleName(event.target.value);
                                    if (createRoleError) setCreateRoleError('');
                                }}
                                placeholder="Ornek: SALES_MANAGER"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            {createRoleError && (
                                <p className="mt-1 text-xs font-medium text-red-600">{createRoleError}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Açıklama</label>
                            <textarea
                                value={newRoleDescription}
                                onChange={(event) => setNewRoleDescription(event.target.value)}
                                placeholder="Rolun sorumluluklarini kisaca aciklayin"
                                rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(false)}
                                className="h-9 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Iptal
                            </button>
                            <button
                                type="submit"
                                disabled={createRoleMutation.isPending}
                                className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {createRoleMutation.isPending ? 'Olusturuluyor...' : 'Rolu Olustur'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
