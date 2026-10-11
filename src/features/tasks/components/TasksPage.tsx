import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ArrowUpDown, CheckSquare, ChevronDown, ChevronUp, Filter, LayoutGrid, Plus, Rows3, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { usePermission } from '../../../shared/hooks/usePermission';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
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
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, TASK_STATUS_ORDER, type TaskStatus } from './tasks.constants';
import {
    extractErrorMessage,
    nextStatusOptions,
    taskPriorityBadgeClass,
    taskPriorityLabel,
    taskStatusLabel,
    toTaskStatus,
} from './tasks.utils';

type TaskViewMode = 'board' | 'table';
type TaskTableColumnKey = 'task' | 'priority' | 'assignee' | 'dueDate' | 'status';
type ResizableTaskTableColumnKey = Exclude<TaskTableColumnKey, 'status'>;
type SortDirection = 'asc' | 'desc';
type DragState = {
    taskId: string;
    currentStatus: TaskStatus;
};

const MIN_COLUMN_WIDTH = 140;
const INITIAL_COLUMN_WIDTHS: Record<ResizableTaskTableColumnKey, number> = {
    task: 420,
    priority: 150,
    assignee: 220,
    dueDate: 180,
};
const RESIZABLE_COLUMN_COUNT = Object.keys(INITIAL_COLUMN_WIDTHS).length;
const PERSONAL_TASK_SCOPE_ROLES = new Set<string>([
    ROLES.DEVELOPER,
    ROLES.SOCIAL_MEDIA,
    ROLES.CREATIVE,
    ROLES.MARKETING,
    ROLES.PRODUCTION,
]);

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
    const currentUser = useAuthStore((state) => state.user);
    const userRole = currentUser?.role;
    const currentUserId = currentUser?.id ?? '';
    const { hasPermission } = usePermission();
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [viewMode, setViewMode] = useState<TaskViewMode>('board');
    const [tableSortField, setTableSortField] = useState<TaskTableColumnKey>('task');
    const [tableSortDirection, setTableSortDirection] = useState<SortDirection>('asc');
    const [columnWidths, setColumnWidths] = useState<Record<ResizableTaskTableColumnKey, number>>(INITIAL_COLUMN_WIDTHS);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | null>(null);
    const resizeStateRef = useRef<{
        column: ResizableTaskTableColumnKey;
        startX: number;
        startWidth: number;
    } | null>(null);

    const isAdminOrCeo = userRole === ROLES.ADMIN || userRole === ROLES.CEO;
    const canReadTasks = isAdminOrCeo
        || hasPermission('tasks:read')
        || hasPermission('tasks:update')
        || hasPermission('tasks:delete')
        || hasPermission('tasks:create');
    const canCreateTask = isAdminOrCeo || hasPermission('tasks:create');
    const forceMyTasksOnly = !!userRole && PERSONAL_TASK_SCOPE_ROLES.has(userRole);
    const myProjectsOnly = forceMyTasksOnly;

    const projectsQuery = useQuery({
        queryKey: ['projects', 'task-selector', userRole, myProjectsOnly],
        queryFn: () => getProjects({ page: 1, limit: 100, myProjectsOnly: myProjectsOnly || undefined }),
        enabled: canReadTasks,
    });

    const projects = useMemo(() => projectsQuery.data?.data || [], [projectsQuery.data?.data]);
    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId) ?? null,
        [projects, selectedProjectId],
    );

    useEffect(() => {
        if (!canReadTasks) {
            return;
        }

        if (!selectedProjectId && projects.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedProjectId(projects[0].id);
        }
    }, [canReadTasks, projects, selectedProjectId]);

    const membersQuery = useQuery({
        queryKey: ['project-members', selectedProjectId, userRole],
        queryFn: () => getProjectMembers(selectedProjectId),
        enabled: canReadTasks && !!selectedProjectId,
    });

    const members = useMemo(() => membersQuery.data || [], [membersQuery.data]);
    const sortedMembers = useMemo(
        () => [...members].sort((a, b) => memberName(a).localeCompare(memberName(b), 'tr')),
        [members],
    );

    const tasksQuery = useQuery({
        queryKey: ['project-tasks', selectedProjectId, statusFilter, priorityFilter, assigneeFilter, userRole, currentUserId, forceMyTasksOnly],
        queryFn: () =>
            getProjectTasks(selectedProjectId, {
                page: 1,
                limit: 500,
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
                assigneeId: forceMyTasksOnly ? currentUserId || undefined : assigneeFilter || undefined,
            }),
        enabled: canReadTasks && !!selectedProjectId && (!forceMyTasksOnly || !!currentUserId),
    });

    const rows = useMemo(() => tasksQuery.data?.data || [], [tasksQuery.data?.data]);
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

    useEffect(() => {
        function handleMouseMove(event: MouseEvent) {
            const active = resizeStateRef.current;
            if (!active) {
                return;
            }

            const deltaX = event.clientX - active.startX;
            const nextWidth = Math.max(MIN_COLUMN_WIDTH, active.startWidth + deltaX);

            setColumnWidths((prev) => (
                prev[active.column] === nextWidth
                    ? prev
                    : {
                        ...prev,
                        [active.column]: nextWidth,
                    }
            ));
        }

        function stopResize() {
            if (!resizeStateRef.current) {
                return;
            }

            resizeStateRef.current = null;
            document.body.style.removeProperty('cursor');
            document.body.style.removeProperty('user-select');
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopResize);
            stopResize();
        };
    }, []);

    useEffect(() => {
        if (viewMode !== 'table') {
            return;
        }

        const container = tableContainerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            const containerWidth = entry?.contentRect.width ?? 0;
            if (containerWidth <= 0) {
                return;
            }

            const targetTotal = Math.round(
                Math.max(MIN_COLUMN_WIDTH * RESIZABLE_COLUMN_COUNT, containerWidth - MIN_COLUMN_WIDTH),
            );

            setColumnWidths((prev) => {
                const prevTotal = Object.values(prev).reduce((sum, width) => sum + width, 0);
                if (prevTotal <= 0 || Math.abs(prevTotal - targetTotal) < 1) {
                    return prev;
                }

                const ratio = targetTotal / prevTotal;
                const nextEntries = (Object.entries(prev) as Array<[ResizableTaskTableColumnKey, number]>)
                    .map(([key, width]) => [key, Math.max(MIN_COLUMN_WIDTH, Math.round(width * ratio))] as const);
                const nextTotal = nextEntries.reduce((sum, [, width]) => sum + width, 0);
                const delta = targetTotal - nextTotal;

                if (delta !== 0) {
                    const [firstKey, firstWidth] = nextEntries[0];
                    nextEntries[0] = [firstKey, Math.max(MIN_COLUMN_WIDTH, firstWidth + delta)];
                }

                const next = Object.fromEntries(nextEntries) as Record<ResizableTaskTableColumnKey, number>;
                const unchanged = (Object.keys(prev) as ResizableTaskTableColumnKey[])
                    .every((key) => prev[key] === next[key]);

                return unchanged ? prev : next;
            });
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, [viewMode]);

    const tableSortedRows = useMemo(() => {
        const direction = tableSortDirection === 'asc' ? 1 : -1;
        const prioritizedOrder = TASK_PRIORITY_OPTIONS.reduce<Record<string, number>>((acc, item, index) => {
            acc[item.value] = index;
            return acc;
        }, {});
        const statusOrder = TASK_STATUS_ORDER.reduce<Record<string, number>>((acc, item, index) => {
            acc[item] = index;
            return acc;
        }, {});

        const normalized = [...sortedRows];
        normalized.sort((left, right) => {
            if (tableSortField === 'task') {
                return left.title.localeCompare(right.title, 'tr-TR', { sensitivity: 'base' }) * direction;
            }

            if (tableSortField === 'priority') {
                const leftOrder = prioritizedOrder[(left.priority ?? '').toUpperCase()] ?? Number.MAX_SAFE_INTEGER;
                const rightOrder = prioritizedOrder[(right.priority ?? '').toUpperCase()] ?? Number.MAX_SAFE_INTEGER;
                return (leftOrder - rightOrder) * direction;
            }

            if (tableSortField === 'assignee') {
                return taskAssigneeName(left).localeCompare(taskAssigneeName(right), 'tr-TR', { sensitivity: 'base' }) * direction;
            }

            if (tableSortField === 'dueDate') {
                const leftDate = left.dueDate ? Date.parse(left.dueDate) : Number.NEGATIVE_INFINITY;
                const rightDate = right.dueDate ? Date.parse(right.dueDate) : Number.NEGATIVE_INFINITY;
                const safeLeft = Number.isFinite(leftDate) ? leftDate : Number.NEGATIVE_INFINITY;
                const safeRight = Number.isFinite(rightDate) ? rightDate : Number.NEGATIVE_INFINITY;
                return (safeLeft - safeRight) * direction;
            }

            const leftStatus = statusOrder[toTaskStatus(left.status)] ?? Number.MAX_SAFE_INTEGER;
            const rightStatus = statusOrder[toTaskStatus(right.status)] ?? Number.MAX_SAFE_INTEGER;
            return (leftStatus - rightStatus) * direction;
        });

        return normalized;
    }, [sortedRows, tableSortDirection, tableSortField]);

    const total = sortedRows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const tableColumnPercentages = useMemo(() => {
        const statusBaseWidth = MIN_COLUMN_WIDTH;
        const resizableTotal = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
        const total = resizableTotal + statusBaseWidth;

        return {
            task: (columnWidths.task / total) * 100,
            priority: (columnWidths.priority / total) * 100,
            assignee: (columnWidths.assignee / total) * 100,
            dueDate: (columnWidths.dueDate / total) * 100,
            status: (statusBaseWidth / total) * 100,
        };
    }, [columnWidths]);
    const pagedRows = useMemo(
        () => tableSortedRows.slice((page - 1) * limit, page * limit),
        [limit, page, tableSortedRows],
    );

    useEffect(() => {
        if (page > totalPages) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
            toast.error(extractErrorMessage(error, 'Görev durumu guncellenemedi.'));
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
            toast.success('Görev olusturuldu.');
            await queryClient.invalidateQueries({ queryKey: ['project-tasks', selectedProjectId] });
        },
        onError: (error) => {
            toast.error(extractErrorMessage(error, 'Görev olusturulamadi.'));
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

    function handleTaskDragStart(taskId: string, currentStatus: string) {
        setDragState({
            taskId,
            currentStatus: toTaskStatus(currentStatus),
        });
    }

    function handleColumnDragOver(status: string) {
        if (!dragState) {
            return;
        }

        const normalizedStatus = toTaskStatus(status);
        setDropTargetStatus((prev) => (prev === normalizedStatus ? prev : normalizedStatus));
    }

    function handleTaskDragEnd() {
        setDragState(null);
        setDropTargetStatus(null);
    }

    function handleColumnDrop(status: string) {
        if (!dragState) {
            return;
        }

        const nextStatus = toTaskStatus(status);
        const currentStatus = dragState.currentStatus;

        handleTaskDragEnd();

        const allowedStatuses = nextStatusOptions(currentStatus);
        if (!allowedStatuses.includes(nextStatus)) {
            return;
        }

        handleStatusChange(dragState.taskId, currentStatus, nextStatus);
    }

    async function handleCreateTask(payload: TaskCreatePayload) {
        await createMutation.mutateAsync(payload);
    }

    function handleTableSort(column: TaskTableColumnKey) {
        if (tableSortField === column) {
            setTableSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setTableSortField(column);
            setTableSortDirection('asc');
        }
        setPage(1);
    }

    function handleColumnResizeStart(column: ResizableTaskTableColumnKey, event: ReactMouseEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();

        resizeStateRef.current = {
            column,
            startX: event.clientX,
            startWidth: columnWidths[column],
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    function renderSortIcon(column: TaskTableColumnKey) {
        if (tableSortField !== column) {
            return <ArrowUpDown size={13} className="text-gray-400" />;
        }

        return tableSortDirection === 'asc'
            ? <ChevronUp size={13} className="text-red-600" />
            : <ChevronDown size={13} className="text-red-600" />;
    }

    if (!canReadTasks) {
        return (
            <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
                <PageHeader
                    icon={<CheckSquare size={20} color="#DC2626" />}
                    title="Görev Yönetimi"
                    subtitle="Görev listesi"
                />
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu role görev ekranina erişim izni tanimli degil.
                </section>
            </div>
        );
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CheckSquare size={20} color="#DC2626" />}
                title={forceMyTasksOnly ? 'Görevlerim' : 'Görev Yönetimi'}
                subtitle={
                    selectedProject
                        ? `${selectedProject.name} projesi - ${total} görev`
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
                        {canCreateTask && (
                            <button
                                type="button"
                                disabled={!selectedProjectId}
                                onClick={() => setCreateModalOpen(true)}
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Plus size={14} />
                                Yeni Görev
                            </button>
                        )}
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
                                placeholder="Görev adi, açıklama, kisi..."
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
                                <option value="">Tüm durumlar</option>
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
                            <option value="">Tüm oncelikler</option>
                            {TASK_PRIORITY_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!forceMyTasksOnly && (
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
                                <option value="">Tüm ekip</option>
                                {sortedMembers.map((member) => (
                                    <option key={member.userId} value={member.userId}>
                                        {memberName(member)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </section>

            {selectedProjectId && (
                <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatsCard title="Toplam Görev" value={String(total)} subtitle="Seçili filtreye göre" />
                    <StatsCard title="Devam Eden" value={String(stats.inProgress)} subtitle="Aktif çalışma" />
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
                    Görev listesi yüklenemedi.
                </section>
            ) : total === 0 ? (
                <section className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
                    Eslesen görev bulunamadı.
                </section>
            ) : (
                <>
                    {viewMode === 'board' ? (
                        <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            {TASK_STATUS_ORDER.map((status) => (
                                <TaskBoardColumn
                                    key={status}
                                    title={taskStatusLabel(status)}
                                    columnStatus={status}
                                    tasks={groupedByStatus[status] ?? []}
                                    pendingTaskId={pendingTaskId}
                                    draggingTaskId={dragState?.taskId ?? null}
                                    isDropTarget={dropTargetStatus === status}
                                    onOpenTask={(taskId) => navigate(`/app/gorevler/${taskId}`)}
                                    onStatusChange={handleStatusChange}
                                    onTaskDragStart={handleTaskDragStart}
                                    onColumnDragOver={handleColumnDragOver}
                                    onColumnDrop={handleColumnDrop}
                                    onTaskDragEnd={handleTaskDragEnd}
                                />
                            ))}
                        </section>
                    ) : (
                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <div ref={tableContainerRef} className="overflow-x-hidden">
                                <table
                                    className="w-full table-fixed text-left text-sm"
                                >
                                    <colgroup>
                                        <col style={{ width: `${tableColumnPercentages.task}%` }} />
                                        <col style={{ width: `${tableColumnPercentages.priority}%` }} />
                                        <col style={{ width: `${tableColumnPercentages.assignee}%` }} />
                                        <col style={{ width: `${tableColumnPercentages.dueDate}%` }} />
                                        <col style={{ width: `${tableColumnPercentages.status}%` }} />
                                    </colgroup>
                                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="group relative px-3 py-2.5 font-semibold">
                                                <button type="button" className="flex items-center gap-1" onClick={() => handleTableSort('task')}>
                                                    Görev
                                                    {renderSortIcon('task')}
                                                </button>
                                                <div
                                                    role="separator"
                                                    aria-orientation="vertical"
                                                    aria-label="Görev sutunu genisligini degistir"
                                                    className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                                    onMouseDown={(event) => handleColumnResizeStart('task', event)}
                                                >
                                                    <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                                </div>
                                            </th>
                                            <th className="group relative px-3 py-2.5 font-semibold">
                                                <button type="button" className="flex items-center gap-1" onClick={() => handleTableSort('priority')}>
                                                    Oncelik
                                                    {renderSortIcon('priority')}
                                                </button>
                                                <div
                                                    role="separator"
                                                    aria-orientation="vertical"
                                                    aria-label="Oncelik sutunu genisligini degistir"
                                                    className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                                    onMouseDown={(event) => handleColumnResizeStart('priority', event)}
                                                >
                                                    <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                                </div>
                                            </th>
                                            <th className="group relative px-3 py-2.5 font-semibold">
                                                <button type="button" className="flex items-center gap-1" onClick={() => handleTableSort('assignee')}>
                                                    Atanan
                                                    {renderSortIcon('assignee')}
                                                </button>
                                                <div
                                                    role="separator"
                                                    aria-orientation="vertical"
                                                    aria-label="Atanan sutunu genisligini degistir"
                                                    className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                                    onMouseDown={(event) => handleColumnResizeStart('assignee', event)}
                                                >
                                                    <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                                </div>
                                            </th>
                                            <th className="group relative px-3 py-2.5 font-semibold">
                                                <button type="button" className="flex items-center gap-1" onClick={() => handleTableSort('dueDate')}>
                                                    Son Tarih
                                                    {renderSortIcon('dueDate')}
                                                </button>
                                                <div
                                                    role="separator"
                                                    aria-orientation="vertical"
                                                    aria-label="Son tarih sutunu genisligini degistir"
                                                    className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                                    onMouseDown={(event) => handleColumnResizeStart('dueDate', event)}
                                                >
                                                    <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                                </div>
                                            </th>
                                            <th className="group relative px-3 py-2.5 font-semibold">
                                                <button type="button" className="flex items-center gap-1" onClick={() => handleTableSort('status')}>
                                                    Durum
                                                    {renderSortIcon('status')}
                                                </button>
                                            </th>
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
                                                            {task.description?.trim() || 'Açıklama eklenmemis'}
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
                                                            className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 outline-none transition focus:border-red-500"
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

            {canCreateTask && (
                <TaskCreateModal
                    isOpen={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    projectName={selectedProject?.name ?? 'Proje'}
                    members={sortedMembers}
                    isPending={createMutation.isPending}
                    onCreate={handleCreateTask}
                />
            )}
        </div>
    );
}
