import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { CheckSquare, Filter, LayoutGrid, Plus, Rows3, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { formatDate } from '../../../shared/utils/formatDate';
import { getProjects, getProjectMembers, type ProjectMember } from '../../projects/api/projects.api';
import {
    createTask,
    getProjectTasks,
    updateTaskStatus,
    type PaginatedTaskResponse,
    type TaskCreatePayload,
    type TaskItem,
} from '../api/tasks.api';
import { TaskBoardColumn } from './TaskBoardColumn';
import { TaskCreateModal } from './TaskCreateModal';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, TASK_STATUS_ORDER } from './tasks.constants';
import {
    extractErrorMessage,
    nextStatusOptions,
    taskPriorityBadgeClass,
    taskPriorityLabel,
    taskStatusLabel,
    toTaskStatus,
} from './tasks.utils';

type TaskViewMode = 'board' | 'table';

function memberName(member: ProjectMember): string {
    const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
    return fullName || member.email || member.userId;
}

function taskAssigneeName(task: TaskItem): string {
    if (Array.isArray(task.assignees) && task.assignees.length > 0) {
        const names = task.assignees.map((assignee) => {
            const fullName = `${assignee.firstName ?? ''} ${assignee.lastName ?? ''}`.trim();
            return fullName || assignee.email || assignee.userId;
        });
        if (names.length <= 2) {
            return names.join(', ');
        }
        return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
    }

    const fullName = `${task.assigneeFirstName ?? ''} ${task.assigneeLastName ?? ''}`.trim();
    return fullName || task.assigneeEmail || '-';
}

function StatsCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </article>
    );
}

export function TasksPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [viewMode, setViewMode] = useState<TaskViewMode>('board');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const projectsQuery = useQuery({
        queryKey: ['projects', 'task-selector'],
        queryFn: () => getProjects({ page: 1, limit: 100 }),
    });

    const projects = projectsQuery.data?.data ?? [];
    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId) ?? null,
        [projects, selectedProjectId],
    );

    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    const membersQuery = useQuery({
        queryKey: ['project-members', selectedProjectId],
        queryFn: () => getProjectMembers(selectedProjectId),
        enabled: !!selectedProjectId,
    });

    const members = membersQuery.data ?? [];
    const sortedMembers = useMemo(
        () => [...members].sort((a, b) => memberName(a).localeCompare(memberName(b), 'tr')),
        [members],
    );

    const tasksQuery = useQuery({
        queryKey: ['project-tasks', selectedProjectId, statusFilter, priorityFilter, assigneeFilter],
        queryFn: () =>
            getProjectTasks(selectedProjectId, {
                page: 1,
                limit: 500,
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
                assigneeId: assigneeFilter || undefined,
            }),
        enabled: !!selectedProjectId,
    });

    const rows = tasksQuery.data?.data ?? [];
    const searchedRows = useMemo(() => {
        const searchValue = search.trim().toLowerCase();
        if (!searchValue) {
            return rows;
        }

        return rows.filter((task) => {
            const fullName = `${task.assigneeFirstName ?? ''} ${task.assigneeLastName ?? ''}`.trim();
            const assigneeTexts = Array.isArray(task.assignees)
                ? task.assignees
                    .map((assignee) => `${assignee.firstName ?? ''} ${assignee.lastName ?? ''} ${assignee.email ?? ''}`)
                    .join(' ')
                : '';
            const haystack = [
                task.title,
                task.description,
                fullName,
                task.assigneeEmail,
                assigneeTexts,
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(searchValue);
        });
    }, [rows, search]);

    const sortedRows = useMemo(
        () =>
            [...searchedRows].sort((a, b) => {
                const bTime = new Date(b.updatedAt).getTime();
                const aTime = new Date(a.updatedAt).getTime();
                return bTime - aTime;
            }),
        [searchedRows],
    );

    const total = sortedRows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pagedRows = useMemo(
        () => sortedRows.slice((page - 1) * limit, page * limit),
        [limit, page, sortedRows],
    );

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const groupedByStatus = useMemo(
        () =>
            TASK_STATUS_ORDER.reduce<Record<string, TaskItem[]>>((acc, status) => {
                acc[status] = sortedRows.filter((task) => (task.status ?? '').toUpperCase() === status);
                return acc;
            }, {}),
        [sortedRows],
    );

    const stats = useMemo(() => {
        const done = sortedRows.filter((task) => (task.status ?? '').toUpperCase() === 'DONE').length;
        const inProgress = sortedRows.filter((task) => (task.status ?? '').toUpperCase() === 'IN_PROGRESS').length;
        const blocked = sortedRows.filter((task) => (task.status ?? '').toUpperCase() === 'BLOCKED').length;

        return {
            done,
            inProgress,
            blocked,
        };
    }, [sortedRows]);

    const statusMutation = useMutation({
        mutationFn: async ({
            taskId,
            nextStatus,
        }: {
            taskId: string;
            currentStatus: string;
            nextStatus: string;
        }) => updateTaskStatus(taskId, nextStatus),
        onMutate: async (variables) => {
            if (!selectedProjectId) {
                return { previous: [] as Array<[QueryKey, PaginatedTaskResponse | undefined]> };
            }

            await queryClient.cancelQueries({ queryKey: ['project-tasks', selectedProjectId] });
            const previous = queryClient.getQueriesData<PaginatedTaskResponse>({
                queryKey: ['project-tasks', selectedProjectId],
            });

            queryClient.setQueriesData<PaginatedTaskResponse>(
                { queryKey: ['project-tasks', selectedProjectId] },
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: old.data.map((task) =>
                            task.id === variables.taskId
                                ? { ...task, status: variables.nextStatus, updatedAt: new Date().toISOString() }
                                : task,
                        ),
                    };
                },
            );

            return { previous };
        },
        onError: (error, _variables, context) => {
            context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
            toast.error(extractErrorMessage(error, 'Gorev durumu guncellenemedi.'));
        },
        onSuccess: (updatedTask) => {
            if (!selectedProjectId || !updatedTask) {
                return;
            }

            queryClient.setQueriesData<PaginatedTaskResponse>(
                { queryKey: ['project-tasks', selectedProjectId] },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
                    };
                },
            );
        },
        onSettled: async () => {
            if (!selectedProjectId) return;
            await queryClient.invalidateQueries({ queryKey: ['project-tasks', selectedProjectId] });
        },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: TaskCreatePayload) => {
            if (!selectedProjectId) {
                throw new Error('Proje secimi zorunludur.');
            }
            return createTask(selectedProjectId, payload);
        },
        onSuccess: async (createdTask) => {
            if (!selectedProjectId) {
                return;
            }

            queryClient.setQueriesData<PaginatedTaskResponse>(
                { queryKey: ['project-tasks', selectedProjectId] },
                (old) => {
                    if (!old) return old;
                    const exists = old.data.some((task) => task.id === createdTask.id);
                    return {
                        ...old,
                        data: exists ? old.data : [createdTask, ...old.data],
                        total: exists ? old.total : old.total + 1,
                    };
                },
            );

            setCreateModalOpen(false);
            setPage(1);
            toast.success('Gorev olusturuldu.');
            await queryClient.invalidateQueries({ queryKey: ['project-tasks', selectedProjectId] });
        },
        onError: (error) => {
            toast.error(extractErrorMessage(error, 'Gorev olusturulamadi.'));
        },
    });

    const pendingTaskId = statusMutation.isPending
        ? statusMutation.variables?.taskId ?? null
        : null;

    function handleStatusChange(taskId: string, currentStatus: string, nextStatus: string) {
        if (currentStatus === nextStatus) {
            return;
        }

        statusMutation.mutate({ taskId, currentStatus, nextStatus });
    }

    async function handleCreateTask(payload: TaskCreatePayload) {
        await createMutation.mutateAsync(payload);
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CheckSquare size={20} color="#DC2626" />}
                title="Gorev Yonetimi"
                subtitle={
                    selectedProject
                        ? `${selectedProject.name} projesi - ${total} gorev`
                        : 'Lutfen once proje secin'
                }
                actions={(
                    <>
                        <button
                            type="button"
                            onClick={() => setViewMode((prev) => (prev === 'board' ? 'table' : 'board'))}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            {viewMode === 'board' ? <Rows3 size={14} /> : <LayoutGrid size={14} />}
                            {viewMode === 'board' ? 'Liste Gorunumu' : 'Board Gorunumu'}
                        </button>
                        <button
                            type="button"
                            disabled={!selectedProjectId}
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus size={14} />
                            Yeni Gorev
                        </button>
                    </>
                )}
            />

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid gap-3 lg:grid-cols-12">
                    <div className="lg:col-span-3">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Proje</label>
                        <select
                            value={selectedProjectId}
                            onChange={(event) => {
                                setSelectedProjectId(event.target.value);
                                setPage(1);
                            }}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500"
                        >
                            <option value="">Proje seciniz</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-3">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Ara</label>
                        <div className="relative">
                            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Gorev adi, aciklama, kisi..."
                                className="h-10 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none transition focus:border-red-500"
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</label>
                        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2">
                            <Filter size={13} className="text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(event) => {
                                    setStatusFilter(event.target.value);
                                    setPage(1);
                                }}
                                className="h-10 w-full border-0 bg-transparent text-sm outline-none"
                            >
                                <option value="">Tum durumlar</option>
                                {TASK_STATUS_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Oncelik</label>
                        <select
                            value={priorityFilter}
                            onChange={(event) => {
                                setPriorityFilter(event.target.value);
                                setPage(1);
                            }}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500"
                        >
                            <option value="">Tum oncelikler</option>
                            {TASK_PRIORITY_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-2">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Atanan</label>
                        <select
                            value={assigneeFilter}
                            onChange={(event) => {
                                setAssigneeFilter(event.target.value);
                                setPage(1);
                            }}
                            disabled={!selectedProjectId}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 disabled:bg-gray-100"
                        >
                            <option value="">Tum ekip</option>
                            {sortedMembers.map((member) => (
                                <option key={member.userId} value={member.userId}>
                                    {memberName(member)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {selectedProjectId && (
                <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatsCard title="Toplam Gorev" value={String(total)} subtitle="Secili filtreye gore" />
                    <StatsCard title="Devam Eden" value={String(stats.inProgress)} subtitle="Aktif calisma" />
                    <StatsCard title="Tamamlanan" value={String(stats.done)} subtitle="Biten gorevler" />
                    <StatsCard title="Bloke" value={String(stats.blocked)} subtitle="Engel bekleyen isler" />
                </section>
            )}

            {!selectedProjectId ? (
                <section className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
                    Gorevleri listelemek icin proje seciniz.
                </section>
            ) : tasksQuery.isLoading || membersQuery.isLoading ? (
                <section className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
                        ))}
                    </div>
                </section>
            ) : tasksQuery.isError ? (
                <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm font-medium text-red-700">
                    Gorev listesi yuklenemedi.
                </section>
            ) : total === 0 ? (
                <section className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
                    Eslesen gorev bulunamadi.
                </section>
            ) : (
                <>
                    {viewMode === 'board' ? (
                        <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            {TASK_STATUS_ORDER.map((status) => (
                                <TaskBoardColumn
                                    key={status}
                                    title={taskStatusLabel(status)}
                                    tasks={groupedByStatus[status] ?? []}
                                    pendingTaskId={pendingTaskId}
                                    onOpenTask={(taskId) => navigate(`/app/gorevler/${taskId}`)}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </section>
                    ) : (
                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[920px] text-left text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="px-3 py-2.5 font-semibold">Gorev</th>
                                            <th className="px-3 py-2.5 font-semibold">Oncelik</th>
                                            <th className="px-3 py-2.5 font-semibold">Atanan</th>
                                            <th className="px-3 py-2.5 font-semibold">Son Tarih</th>
                                            <th className="px-3 py-2.5 font-semibold">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pagedRows.map((task) => {
                                            const normalizedStatus = toTaskStatus(task.status);
                                            return (
                                                <tr
                                                    key={task.id}
                                                    onClick={() => navigate(`/app/gorevler/${task.id}`)}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                >
                                                    <td className="px-3 py-2.5">
                                                        <p className="font-semibold text-gray-900">{task.title}</p>
                                                        <p className="line-clamp-1 text-xs text-gray-500">
                                                            {task.description?.trim() || 'Aciklama eklenmemis'}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${taskPriorityBadgeClass(task.priority)}`}>
                                                            {taskPriorityLabel(task.priority)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-600">{taskAssigneeName(task)}</td>
                                                    <td className="px-3 py-2.5 text-gray-600">
                                                        {task.dueDate ? formatDate(task.dueDate) : '-'}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <select
                                                            value={normalizedStatus}
                                                            disabled={pendingTaskId === task.id}
                                                            onClick={(event) => event.stopPropagation()}
                                                            onChange={(event) => handleStatusChange(task.id, normalizedStatus, event.target.value)}
                                                            className="h-8 min-w-[140px] rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 outline-none transition focus:border-red-500"
                                                        >
                                                            {nextStatusOptions(normalizedStatus).map((statusOption) => (
                                                                <option key={`${task.id}-${statusOption}`} value={statusOption}>
                                                                    {taskStatusLabel(statusOption)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                total={total}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={(nextLimit) => {
                                    setLimit(nextLimit);
                                    setPage(1);
                                }}
                                limitOptions={[10, 20, 50, 100]}
                            />
                        </section>
                    )}
                </>
            )}

            <TaskCreateModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                projectName={selectedProject?.name ?? 'Proje'}
                members={sortedMembers}
                isPending={createMutation.isPending}
                onCreate={handleCreateTask}
            />
        </div>
    );
}
