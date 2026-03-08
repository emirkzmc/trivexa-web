import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getClients } from '../../clients/api/clients.api';
import { getDepartments } from '../../departments/api/departments.api';
import { getPersonnel } from '../../personnel/api/personnel.api';
import { addProjectMember, createProject } from '../api/projects.api';
import { FALLBACK_DEPARTMENTS, INITIAL_CREATE_FORM } from '../components/projectsPage.constants';
import { isSameDepartment, resolveDepartmentFormType, splitTags } from '../components/projectsPage.utils';
import type { CreateStep, DepartmentDetailsState, ProjectCreatePanelState } from '../components/projectsPage.types';

type DepartmentDetailFieldValue<K extends keyof DepartmentDetailsState, F extends keyof DepartmentDetailsState[K]> =
    DepartmentDetailsState[K][F] extends string ? string : never;

export function useProjectCreate() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [createPanelOpen, setCreatePanelOpen] = useState(false);
    const [createStep, setCreateStep] = useState<CreateStep>(1);
    const [createForm, setCreateForm] = useState<ProjectCreatePanelState>(INITIAL_CREATE_FORM);

    const clientsQuery = useQuery({
        queryKey: ['clients', 'project-create'],
        queryFn: () => getClients({ page: 1, limit: 100 }),
        enabled: createPanelOpen,
    });

    const departmentsQuery = useQuery({
        queryKey: ['departments', 'project-create'],
        queryFn: getDepartments,
        enabled: createPanelOpen,
    });

    const personnelQuery = useQuery({
        queryKey: ['personnel', 'project-create'],
        queryFn: () => getPersonnel({ page: 1, limit: 100, isActive: 'true' }),
        enabled: createPanelOpen,
    });

    const clients = Array.isArray(clientsQuery.data?.data) ? clientsQuery.data.data : [];
    const departments = Array.isArray(departmentsQuery.data) ? departmentsQuery.data : [];
    const personnel = Array.isArray(personnelQuery.data?.data) ? personnelQuery.data.data : [];

    const departmentOptions = useMemo(() => {
        if (departments.length > 0) {
            return departments.map((department) => ({ id: department.id, name: department.name }));
        }
        return FALLBACK_DEPARTMENTS;
    }, [departments]);

    const selectedDepartmentName = useMemo(() => {
        const selected = departmentOptions.find((item) => item.id === createForm.departmentId);
        return selected?.name ?? '';
    }, [departmentOptions, createForm.departmentId]);

    const selectedDepartmentType = useMemo(
        () => resolveDepartmentFormType(selectedDepartmentName),
        [selectedDepartmentName],
    );

    const departmentPersonnel = useMemo(() => {
        if (!selectedDepartmentName) {
            return [];
        }

        return personnel.filter((person) => isSameDepartment(person.department, selectedDepartmentName));
    }, [personnel, selectedDepartmentName]);

    const filteredPersonnel = useMemo(() => {
        const term = createForm.personnelSearch.trim().toLowerCase();
        if (!term) {
            return personnel;
        }

        return personnel.filter((person) =>
            `${person.firstName} ${person.lastName} ${person.email} ${person.role} ${person.department}`
                .toLowerCase()
                .includes(term),
        );
    }, [createForm.personnelSearch, personnel]);

    const selectedMemberIds = useMemo(
        () =>
            Array.from(
                new Set(
                    [
                        ...createForm.assignedPersonnelIds,
                        createForm.projectManagerId,
                        createForm.teamLeadId,
                    ].filter(Boolean),
                ),
            ),
        [createForm.assignedPersonnelIds, createForm.projectManagerId, createForm.teamLeadId],
    );

    const projectContextJson = useMemo(() => {
        const details =
            selectedDepartmentType === 'SOFTWARE'
                ? createForm.departmentDetails.software
                : selectedDepartmentType === 'MARKETING'
                    ? createForm.departmentDetails.marketing
                    : selectedDepartmentType === 'PRODUCTION'
                        ? createForm.departmentDetails.production
                        : selectedDepartmentType === 'DESIGN'
                            ? createForm.departmentDetails.design
                            : createForm.departmentDetails.general;

        return {
            department: {
                id: createForm.departmentId || null,
                name: selectedDepartmentName || null,
                type: selectedDepartmentType,
            },
            hierarchy: {
                priority: createForm.priority,
                visibility: createForm.isPrivate ? 'PRIVATE' : 'PUBLIC',
                status: createForm.status,
            },
            planning: {
                teamSize: createForm.teamSize ? Number(createForm.teamSize) : null,
                tags: splitTags(createForm.tags),
            },
            assignments: {
                projectManagerId: createForm.projectManagerId || null,
                teamLeadId: createForm.teamLeadId || null,
                memberIds: selectedMemberIds,
            },
            departmentDetails: details,
        };
    }, [createForm, selectedDepartmentName, selectedDepartmentType, selectedMemberIds]);

    const createProjectMutation = useMutation({
        mutationFn: async (form: ProjectCreatePanelState) => {
            const budgetNumber = Number(form.budget);

            const created = await createProject({
                name: form.name.trim(),
                description: form.description.trim(),
                clientId: form.clientId,
                startDate: form.startDate || undefined,
                deadline: form.deadline || undefined,
                endDate: undefined,
                budget: Number.isFinite(budgetNumber) && budgetNumber > 0 ? budgetNumber : undefined,
            });

            if (selectedMemberIds.length > 0) {
                await Promise.all(
                    selectedMemberIds.map(async (userId) => {
                        const role =
                            userId === form.projectManagerId
                                ? 'PROJECT_MANAGER'
                                : userId === form.teamLeadId
                                    ? 'TEAM_LEAD'
                                    : 'DEVELOPER';

                        try {
                            await addProjectMember(created.id, userId, role);
                        } catch {
                            // Duplicate or permission issues should not block project creation.
                        }
                    }),
                );
            }

            return created;
        },
        onSuccess: async (createdProject) => {
            toast.success('Proje olusturuldu.');
            closeCreatePanel();
            await queryClient.invalidateQueries({ queryKey: ['projects'] });
            navigate(`/app/projeler/${createdProject.id}`);
        },
        onError: () => {
            toast.error('Proje olusturulamadi.');
        },
    });

    useEffect(() => {
        if (!createPanelOpen) {
            return;
        }

        if (!createForm.clientId && clients.length > 0) {
            setCreateForm((prev) => ({ ...prev, clientId: clients[0].id }));
        }
    }, [createPanelOpen, clients, createForm.clientId]);

    useEffect(() => {
        if (!createPanelOpen) {
            return;
        }

        if (!createForm.departmentId && departmentOptions.length > 0) {
            setCreateForm((prev) => ({ ...prev, departmentId: departmentOptions[0].id }));
        }
    }, [createPanelOpen, departmentOptions, createForm.departmentId]);

    useEffect(() => {
        if (!createForm.teamLeadId) {
            return;
        }

        const exists = departmentPersonnel.some((person) => person.id === createForm.teamLeadId);
        if (!exists) {
            setCreateForm((prev) => ({ ...prev, teamLeadId: '' }));
        }
    }, [departmentPersonnel, createForm.teamLeadId]);

    function updateCreateField<K extends keyof ProjectCreatePanelState>(key: K, value: ProjectCreatePanelState[K]) {
        setCreateForm((prev) => ({ ...prev, [key]: value }));
    }

    function updateDepartmentDetail<K extends keyof DepartmentDetailsState, F extends keyof DepartmentDetailsState[K]>(
        section: K,
        field: F,
        value: DepartmentDetailFieldValue<K, F>,
    ) {
        setCreateForm((prev) => ({
            ...prev,
            departmentDetails: {
                ...prev.departmentDetails,
                [section]: {
                    ...prev.departmentDetails[section],
                    [field]: value,
                },
            },
        }));
    }

    function toggleAssignedPersonnel(userId: string) {
        setCreateForm((prev) => {
            const exists = prev.assignedPersonnelIds.includes(userId);
            return {
                ...prev,
                assignedPersonnelIds: exists
                    ? prev.assignedPersonnelIds.filter((id) => id !== userId)
                    : [...prev.assignedPersonnelIds, userId],
            };
        });
    }

    function openCreatePanel() {
        setCreatePanelOpen(true);
        setCreateStep(1);
    }

    function closeCreatePanel() {
        setCreatePanelOpen(false);
        setCreateStep(1);
        setCreateForm(INITIAL_CREATE_FORM);
    }

    function handleCreateDraft() {
        toast.info('Taslak kayıt altyapisi bir sonraki adimda backend ile baglanacak.');
    }

    function handleNextStep() {
        if (!createForm.name.trim()) {
            toast.error('Proje adi zorunludur.');
            return;
        }
        if (!createForm.clientId) {
            toast.error('Müşteri secimi zorunludur.');
            return;
        }
        if (!createForm.departmentId) {
            toast.error('Departman secimi zorunludur.');
            return;
        }
        setCreateStep(2);
    }

    function handleCreateSubmit() {
        if (createProjectMutation.isPending) {
            return;
        }
        if (!createForm.name.trim()) {
            toast.error('Proje adi zorunludur.');
            return;
        }
        if (!createForm.clientId) {
            toast.error('Müşteri secimi zorunludur.');
            return;
        }
        if (!createForm.departmentId) {
            toast.error('Departman secimi zorunludur.');
            return;
        }
        if (!createForm.projectManagerId) {
            toast.error('Proje yoneticisi secilmelidir.');
            return;
        }
        if (departmentPersonnel.length > 0 && !createForm.teamLeadId) {
            toast.error('Takim lideri secilmelidir.');
            return;
        }
        if (selectedMemberIds.length === 0) {
            toast.error('En az bir personel atanmalidir.');
            return;
        }

        createProjectMutation.mutate(createForm);
    }

    return {
        createPanelOpen,
        createStep,
        createForm,
        clientsQuery,
        departmentsQuery,
        personnelQuery,
        clients,
        personnel,
        departmentOptions,
        selectedDepartmentName,
        selectedDepartmentType,
        departmentPersonnel,
        filteredPersonnel,
        selectedMemberIds,
        projectContextJson,
        createProjectMutation,
        setCreateStep,
        updateCreateField,
        updateDepartmentDetail,
        toggleAssignedPersonnel,
        openCreatePanel,
        closeCreatePanel,
        handleCreateDraft,
        handleNextStep,
        handleCreateSubmit,
    };
}

export type UseProjectCreateReturn = ReturnType<typeof useProjectCreate>;
