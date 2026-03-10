import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { usePermission } from '../../../shared/hooks/usePermission';
import { ROLES } from '../../../shared/constants/roles';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/store/authStore';
import { getProjects, getProjectMembers, type ProjectMember } from '../../projects/api/projects.api';
import {
    createTask,
    getProjectTasks,
    type TaskCreatePayload,
    type TaskItem,
} from '../../tasks/api/tasks.api';
import { TaskCreateModal } from '../../tasks/components/TaskCreateModal';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../tasks/components/tasks.constants';
import {
    extractErrorMessage,
    taskPriorityBadgeClass,
    taskPriorityLabel,
    taskStatusBadgeClass,
    taskStatusLabel,
    toTaskStatus,
} from '../../tasks/components/tasks.utils';

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];
const PERSONAL_TASK_SCOPE_ROLES = new Set<string>([
    ROLES.DEVELOPER,
    ROLES.SOCIAL_MEDIA,
    ROLES.CREATIVE,
    ROLES.MARKETING,
    ROLES.PRODUCTION,
]);
type CalendarView = 'month' | 'week' | 'day';

function toDayKey(dateLike: string | Date): string {
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDayKey(value: string): Date {
    return new Date(`${value}T00:00:00`);
}

function getMonthLabel(date: Date): string {
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function getMonthMatrix(baseDate: Date): Date[] {
    const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const weekdayMondayStart = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - weekdayMondayStart);

    return Array.from({ length: 42 }, (_, index) => {
        const next = new Date(gridStart);
        next.setDate(gridStart.getDate() + index);
        return next;
    });
}

function startOfWeek(date: Date): Date {
    const next = new Date(date);
    const weekdayMondayStart = (next.getDay() + 6) % 7;
    next.setDate(next.getDate() - weekdayMondayStart);
    next.setHours(0, 0, 0, 0);
    return next;
}

function getWeekDays(baseDate: Date): Date[] {
    const weekStart = startOfWeek(baseDate);
    return Array.from({ length: 7 }, (_, index) => {
        const next = new Date(weekStart);
        next.setDate(weekStart.getDate() + index);
        return next;
    });
}

function addDays(base: Date, amount: number): Date {
    const next = new Date(base);
    next.setDate(next.getDate() + amount);
    return next;
}

function memberName(member: ProjectMember): string {
    const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
    return fullName || member.email || member.userId;
}

function taskAssigneeNames(task: TaskItem): string {
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

export function ContentPlanPage() {
    const queryClient = useQueryClient();
    const { hasPermission } = usePermission();
    const currentUser = useAuthStore((state) => state.user);
    const userRole = currentUser?.role;
    const currentUserId = currentUser?.id ?? '';

    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [calendarView, setCalendarView] = useState<CalendarView>('month');
    const [monthCursor, setMonthCursor] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDay, setSelectedDay] = useState<string>(() => toDayKey(new Date()));

    const isAdminOrCeo = userRole === ROLES.ADMIN || userRole === ROLES.CEO;
    const canReadTasks = isAdminOrCeo
        || hasPermission('tasks:read')
        || hasPermission('tasks:update')
        || hasPermission('tasks:create');
    const canCreateTask = isAdminOrCeo || hasPermission('tasks:create');
    const forceMyTasksOnly = !!userRole && PERSONAL_TASK_SCOPE_ROLES.has(userRole);
    const myProjectsOnly = forceMyTasksOnly;

    const projectsQuery = useQuery({
        queryKey: ['projects', 'content-plan', userRole, myProjectsOnly],
        queryFn: () => getProjects({ page: 1, limit: 100, myProjectsOnly: myProjectsOnly || undefined }),
        enabled: canReadTasks,
    });

    const projects = projectsQuery.data?.data ?? [];
    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId) ?? null,
        [projects, selectedProjectId],
    );

    useEffect(() => {
        if (!canReadTasks) return;
        if (!selectedProjectId && projects.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedProjectId(projects[0].id);
        }
    }, [canReadTasks, projects, selectedProjectId]);

    const membersQuery = useQuery({
        queryKey: ['project-members', 'content-plan', selectedProjectId, userRole],
        queryFn: () => getProjectMembers(selectedProjectId),
        enabled: canReadTasks && !!selectedProjectId,
    });

    const members = membersQuery.data ?? [];
    const sortedMembers = useMemo(
        () => [...members].sort((a, b) => memberName(a).localeCompare(memberName(b), 'tr')),
        [members],
    );

    const tasksQuery = useQuery({
        queryKey: [
            'project-tasks',
            'content-plan',
            selectedProjectId,
            statusFilter,
            priorityFilter,
            assigneeFilter,
            userRole,
            currentUserId,
            forceMyTasksOnly,
        ],
        queryFn: () => getProjectTasks(selectedProjectId, {
            page: 1,
            limit: 500,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            assigneeId: forceMyTasksOnly ? currentUserId || undefined : assigneeFilter || undefined,
        }),
        enabled: canReadTasks && !!selectedProjectId && (!forceMyTasksOnly || !!currentUserId),
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

    const tasksByDay = useMemo(() => {
        const map = new Map<string, TaskItem[]>();
        searchedRows.forEach((task) => {
            if (!task.dueDate) return;
            const key = toDayKey(task.dueDate);
            const existing = map.get(key);
            if (existing) {
                existing.push(task);
            } else {
                map.set(key, [task]);
            }
        });
        map.forEach((items) => {
            items.sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
        });
        return map;
    }, [searchedRows]);

    const monthDays = useMemo(() => getMonthMatrix(monthCursor), [monthCursor]);
    const selectedDate = useMemo(() => parseDayKey(selectedDay), [selectedDay]);
    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
    const selectedDayTasks = tasksByDay.get(selectedDay) ?? [];
    const unscheduledTasks = searchedRows.filter((task) => !task.dueDate);

    const stats = useMemo(() => {
        const month = monthCursor.getMonth();
        const year = monthCursor.getFullYear();
        const inMonth = searchedRows.filter((task) => {
            if (!task.dueDate) return false;
            const date = new Date(task.dueDate);
            return date.getMonth() === month && date.getFullYear() === year;
        }).length;

        return {
            total: searchedRows.length,
            monthCount: inMonth,
            selectedCount: selectedDayTasks.length,
            unscheduled: unscheduledTasks.length,
        };
    }, [monthCursor, searchedRows, selectedDayTasks.length, unscheduledTasks.length]);

    const createTaskMutation = useMutation({
        mutationFn: async (payload: TaskCreatePayload) => createTask(selectedProjectId, payload),
        onSuccess: async () => {
            toast.success('Icerik plani eklendi.');
            setCreateModalOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['project-tasks', 'content-plan'] });
        },
        onError: (error: unknown) => {
            const message = extractErrorMessage(error, 'Icerik plani eklenemedi.');
            toast.error(message);
        },
    });

    const headerActions = canCreateTask ? (
        <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            disabled={!selectedProjectId}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[color:var(--role-accent-600)] px-3 text-xs font-semibold text-white transition hover:bg-[color:var(--role-accent-700)] disabled:cursor-not-allowed disabled:bg-gray-400"
        >
            <Plus size={14} />
            Yeni Icerik
        </button>
    ) : null;

    function handleCalendarNavigate(direction: 'prev' | 'next') {
        if (calendarView === 'month') {
            setMonthCursor((prev) => {
                const next = new Date(prev);
                next.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
                return new Date(next.getFullYear(), next.getMonth(), 1);
            });
            return;
        }

        const delta = calendarView === 'week' ? 7 : 1;
        const nextDate = addDays(selectedDate, direction === 'next' ? delta : -delta);
        setSelectedDay(toDayKey(nextDate));
    }

    const monthLabel = calendarView === 'month'
        ? getMonthLabel(monthCursor)
        : calendarView === 'week'
            ? `${formatDate(toDayKey(weekDays[0]))} - ${formatDate(toDayKey(weekDays[6]))}`
            : formatDate(selectedDay);

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CalendarDays size={20} color="var(--role-accent-600)" />}
                title="Icerik Planlari"
                subtitle="Icerik teslim tarihlerini planlayip takip edin."
                actions={headerActions}
            />

            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Toplam Icerik</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Bu Ay</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.monthCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Secili Gun</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.selectedCount}</p>
                </article>
                <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Planlanmamis</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.unscheduled}</p>
                </article>
            </section>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr]">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Proje</label>
                        <select
                            value={selectedProjectId}
                            onChange={(event) => setSelectedProjectId(event.target.value)}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            {!selectedProjectId && <option value="">Proje secin</option>}
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</label>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            <option value="">Tum Durumlar</option>
                            {TASK_STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Oncelik</label>
                        <select
                            value={priorityFilter}
                            onChange={(event) => setPriorityFilter(event.target.value)}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        >
                            <option value="">Tum Oncelikler</option>
                            {TASK_PRIORITY_OPTIONS.map((priority) => (
                                <option key={priority.value} value={priority.value}>{priority.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Atanan</label>
                        <select
                            value={assigneeFilter}
                            onChange={(event) => setAssigneeFilter(event.target.value)}
                            disabled={forceMyTasksOnly}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)] disabled:cursor-not-allowed disabled:bg-gray-100"
                        >
                            <option value="">Tum Kullanicilar</option>
                            {sortedMembers.map((member) => (
                                <option key={member.userId} value={member.userId}>{memberName(member)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <div className="relative w-full">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Icerik adi, aciklama, atanan kisi..."
                            className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Takvim</p>
                            <h3 className="text-base font-semibold text-gray-900">{monthLabel}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 text-xs font-semibold text-gray-600">
                                {(['month', 'week', 'day'] as CalendarView[]).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setCalendarView(mode)}
                                        className={
                                            `rounded-md px-3 py-1 transition ${
                                                calendarView === mode
                                                    ? 'bg-[color:var(--role-accent-600)] text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`
                                        }
                                    >
                                        {mode === 'month' ? 'Aylik' : mode === 'week' ? 'Haftalik' : '24 Saat'}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCalendarNavigate('prev')}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCalendarNavigate('next')}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {calendarView !== 'day' && (
                        <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-gray-400">
                            {WEEKDAY_LABELS.map((label) => (
                                <div key={label} className="px-1 py-1 text-center">{label}</div>
                            ))}
                        </div>
                    )}

                    {calendarView === 'month' && (
                        <div className="mt-2 grid grid-cols-7 gap-1">
                            {monthDays.map((day) => {
                                const dayKey = toDayKey(day);
                                const dayTasks = tasksByDay.get(dayKey) ?? [];
                                const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
                                const isSelected = dayKey === selectedDay;
                                const isToday = dayKey === toDayKey(new Date());

                                return (
                                    <button
                                        key={dayKey}
                                        type="button"
                                        onClick={() => setSelectedDay(dayKey)}
                                        className={
                                            `flex min-h-[100px] flex-col items-start rounded-lg border px-2 py-2 text-left transition `
                                            + (isSelected ? 'border-[color:var(--role-accent-500)] bg-[color:var(--role-accent-50)]' : 'border-gray-200')
                                            + (isCurrentMonth ? ' bg-white' : ' bg-gray-50 text-gray-400')
                                        }
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className={`text-xs font-semibold ${isToday ? 'text-[color:var(--role-accent-600)]' : 'text-gray-500'}`}>
                                                {day.getDate()}
                                            </span>
                                            {dayTasks.length > 0 && (
                                                <span className="rounded-full bg-[color:var(--role-accent-100)] px-2 text-[10px] font-semibold text-[color:var(--role-accent-700)]">
                                                    {dayTasks.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex w-full flex-col gap-1">
                                            {dayTasks.slice(0, 3).map((task) => (
                                                <span key={task.id} className="truncate rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                                                    {task.title}
                                                </span>
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <span className="text-[10px] text-gray-400">+{dayTasks.length - 3} daha</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {calendarView === 'week' && (
                        <div className="mt-2 grid grid-cols-7 gap-1">
                            {weekDays.map((day) => {
                                const dayKey = toDayKey(day);
                                const dayTasks = tasksByDay.get(dayKey) ?? [];
                                const isSelected = dayKey === selectedDay;
                                const isToday = dayKey === toDayKey(new Date());

                                return (
                                    <button
                                        key={dayKey}
                                        type="button"
                                        onClick={() => setSelectedDay(dayKey)}
                                        className={
                                            `flex min-h-[140px] flex-col items-start rounded-lg border px-2 py-2 text-left transition `
                                            + (isSelected ? 'border-[color:var(--role-accent-500)] bg-[color:var(--role-accent-50)]' : 'border-gray-200')
                                            + ' bg-white'
                                        }
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className={`text-xs font-semibold ${isToday ? 'text-[color:var(--role-accent-600)]' : 'text-gray-500'}`}>
                                                {day.getDate()}
                                            </span>
                                            {dayTasks.length > 0 && (
                                                <span className="rounded-full bg-[color:var(--role-accent-100)] px-2 text-[10px] font-semibold text-[color:var(--role-accent-700)]">
                                                    {dayTasks.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex w-full flex-col gap-1">
                                            {dayTasks.slice(0, 4).map((task) => (
                                                <span key={task.id} className="truncate rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                                                    {task.title}
                                                </span>
                                            ))}
                                            {dayTasks.length > 4 && (
                                                <span className="text-[10px] text-gray-400">+{dayTasks.length - 4} daha</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {calendarView === 'day' && (
                        <div className="mt-2 grid gap-3">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                                <span className="font-semibold text-gray-800">Secili Gun:</span> {formatDate(selectedDay)}
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Planli Icerikler</p>
                                {selectedDayTasks.length === 0 && (
                                    <p className="mt-2 text-sm text-gray-500">Bu gunde planli icerik yok.</p>
                                )}
                                {selectedDayTasks.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {selectedDayTasks.map((task) => (
                                            <div key={task.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">
                                                <p className="font-semibold text-gray-900">{task.title}</p>
                                                <p className="text-xs text-gray-500">{task.description || 'Aciklama yok'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white">
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div key={hour} className="flex items-center gap-3 border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
                                        <div className="w-12 font-semibold">{String(hour).padStart(2, '0')}:00</div>
                                        <div className="h-2 flex-1 rounded-full bg-gray-100" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="mb-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Secili Gun</p>
                            <h3 className="text-base font-semibold text-gray-900">{formatDate(selectedDay)}</h3>
                        </div>

                        {tasksQuery.isLoading && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                Icerik planlari yukleniyor...
                            </div>
                        )}

                        {tasksQuery.isError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                Icerik planlari getirilirken hata olustu.
                            </div>
                        )}

                        {!tasksQuery.isLoading && !tasksQuery.isError && selectedDayTasks.length === 0 && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                Secili gunde planli icerik yok.
                            </div>
                        )}

                        {!tasksQuery.isLoading && !tasksQuery.isError && selectedDayTasks.length > 0 && (
                            <div className="space-y-3">
                                {selectedDayTasks.map((task) => {
                                    const status = toTaskStatus(task.status);
                                    return (
                                        <div key={task.id} className="rounded-lg border border-gray-200 p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                                                    <p className="mt-1 text-xs text-gray-500">{task.description || 'Aciklama bulunamadi.'}</p>
                                                </div>
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${taskStatusBadgeClass(status)}`}>
                                                    {taskStatusLabel(status)}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                                                <span className={`rounded-full px-2 py-1 font-semibold ${taskPriorityBadgeClass(task.priority)}`}>
                                                    {taskPriorityLabel(task.priority)}
                                                </span>
                                                <span className="rounded-full bg-gray-100 px-2 py-1">Atanan: {taskAssigneeNames(task)}</span>
                                                <span className="rounded-full bg-gray-100 px-2 py-1">Son Tarih: {task.dueDate ? formatDate(task.dueDate) : '-'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="mb-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Planlanmamis Icerikler</p>
                            <h3 className="text-base font-semibold text-gray-900">{unscheduledTasks.length} Kayit</h3>
                        </div>

                        {unscheduledTasks.length === 0 && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                Tum icerikler planlandi.
                            </div>
                        )}

                        {unscheduledTasks.length > 0 && (
                            <div className="space-y-2">
                                {unscheduledTasks.slice(0, 6).map((task) => (
                                    <div key={task.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                                        <p className="font-semibold text-gray-900">{task.title}</p>
                                        <p className="text-xs text-gray-500">{taskPriorityLabel(task.priority)} - {taskStatusLabel(task.status)}</p>
                                    </div>
                                ))}
                                {unscheduledTasks.length > 6 && (
                                    <p className="text-xs text-gray-500">+{unscheduledTasks.length - 6} kayit daha</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <TaskCreateModal
                isOpen={createModalOpen}
                projectName={selectedProject?.name ?? 'Icerik Plani'}
                members={sortedMembers}
                isPending={createTaskMutation.isPending}
                onClose={() => setCreateModalOpen(false)}
                onCreate={async (payload) => {
                    await createTaskMutation.mutateAsync(payload);
                }}
            />
        </div>
    );
}
