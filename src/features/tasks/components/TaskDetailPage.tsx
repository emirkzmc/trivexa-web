import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, CheckSquare, Clock3, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { formatDate } from '../../../shared/utils/formatDate';
import { getProjectById, getProjectMembers } from '../../projects/api/projects.api';
import { getTaskById, updateTask, updateTaskStatus, type PaginatedTaskResponse, type TaskItem } from '../api/tasks.api';
import { TASK_PRIORITY_OPTIONS } from './tasks.constants';
import {
    extractErrorMessage,
    nextStatusOptions,
    taskPriorityBadgeClass,
    taskPriorityLabel,
    taskStatusBadgeClass,
    taskStatusLabel,
} from './tasks.utils';

interface TaskFormState {
    title: string;
    description: string;
    priority: string;
    assigneeIds: string[];
    dueDate: string;
}

function toDateInput(value?: string): string {
    if (!value) {
        return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toISOString().slice(0, 10);
}

function memberName(task: TaskItem): string {
    if (Array.isArray(task.assignees) && task.assignees.length > 0) {
        return task.assignees
            .map((assignee) => `${assignee.firstName ?? ''} ${assignee.lastName ?? ''}`.trim() || assignee.email || assignee.userId)
            .join(', ');
    }

    const fullName = `${task.assigneeFirstName ?? ''} ${task.assigneeLastName ?? ''}`.trim();
    return fullName || task.assigneeEmail || 'Atanmamis';
}

export function TaskDetailPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { taskId = '' } = useParams<{ taskId: string }>();
    const [form, setForm] = useState<TaskFormState>({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeIds: [],
        dueDate: '',
    });

    const taskQuery = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => getTaskById(taskId),
        enabled: !!taskId,
    });

    const task = taskQuery.data;
    const projectId = task?.projectId ?? '';

    const projectQuery = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectById(projectId),
        enabled: !!projectId,
    });

    const membersQuery = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => getProjectMembers(projectId),
        enabled: !!projectId,
    });

    useEffect(() => {
        if (!task) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
            title: task.title,
            description: task.description ?? '',
            priority: task.priority ?? 'MEDIUM',
            assigneeIds: Array.isArray(task.assigneeIds)
                ? task.assigneeIds
                : task.assigneeId
                    ? [task.assigneeId]
                    : [],
            dueDate: toDateInput(task.dueDate),
        });
    }, [task]);

    const sortedMembers = useMemo(
        () => [...(membersQuery.data ?? [])].sort((a, b) => {
            const aName = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim() || a.email || a.userId;
            const bName = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim() || b.email || b.userId;
            return aName.localeCompare(bName, 'tr');
        }),
        [membersQuery.data],
    );

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!taskId) {
                throw new Error('Görev kimligi bulunamadı.');
            }

            return updateTask(taskId, {
                title: form.title.trim(),
                description: form.description.trim(),
                priority: form.priority,
                assigneeIds: form.assigneeIds,
                dueDate: form.dueDate || undefined,
            });
        },
        onSuccess: async (updatedTask) => {
            queryClient.setQueryData(['task', taskId], updatedTask);
            if (updatedTask.projectId) {
                await queryClient.invalidateQueries({ queryKey: ['project-tasks', updatedTask.projectId] });
            }
            toast.success('Görev güncellendi.');
        },
        onError: (error) => {
            toast.error(extractErrorMessage(error, 'Görev guncellenemedi.'));
        },
    });

    const statusMutation = useMutation({
        mutationFn: async (nextStatus: string) => {
            if (!taskId) {
                throw new Error('Görev kimligi bulunamadı.');
            }
            return updateTaskStatus(taskId, nextStatus);
        },
        onMutate: async (nextStatus) => {
            const taskKey: QueryKey = ['task', taskId];
            const previousTask = queryClient.getQueryData<TaskItem>(taskKey);

            if (previousTask) {
                queryClient.setQueryData<TaskItem>(taskKey, {
                    ...previousTask,
                    status: nextStatus,
                    updatedAt: new Date().toISOString(),
                });
            }

            if (projectId) {
                const previousProjectTasks = queryClient.getQueriesData<PaginatedTaskResponse>({
                    queryKey: ['project-tasks', projectId],
                });

                queryClient.setQueriesData<PaginatedTaskResponse>(
                    { queryKey: ['project-tasks', projectId] },
                    (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            data: old.data.map((row) => (
                                row.id === taskId
                                    ? { ...row, status: nextStatus, updatedAt: new Date().toISOString() }
                                    : row
                            )),
                        };
                    },
                );

                return { previousTask, previousProjectTasks };
            }

            return { previousTask, previousProjectTasks: [] as Array<[QueryKey, PaginatedTaskResponse | undefined]> };
        },
        onError: (error, _status, context) => {
            if (context?.previousTask) {
                queryClient.setQueryData(['task', taskId], context.previousTask);
            }
            context?.previousProjectTasks.forEach(([key, data]) => queryClient.setQueryData(key, data));
            toast.error(extractErrorMessage(error, 'Durum degistirilemedi.'));
        },
        onSuccess: (updatedTask) => {
            if (!updatedTask) {
                return;
            }

            queryClient.setQueryData(['task', taskId], updatedTask);
            if (updatedTask.projectId) {
                queryClient.setQueriesData<PaginatedTaskResponse>(
                    { queryKey: ['project-tasks', updatedTask.projectId] },
                    (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            data: old.data.map((row) => (row.id === updatedTask.id ? updatedTask : row)),
                        };
                    },
                );
            }
            toast.success('Görev durumu güncellendi.');
        },
        onSettled: async () => {
            if (!projectId) {
                return;
            }
            await queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
        },
    });

    const availableTransitions = useMemo(() => {
        if (!task) {
            return [];
        }
        return nextStatusOptions(task.status).filter((status) => status !== task.status);
    }, [task]);

    async function handleSave() {
        if (!form.title.trim()) {
            toast.error('Görev adi zorunludur.');
            return;
        }
        await updateMutation.mutateAsync();
    }

    if (!taskId) {
        return <div className="px-8 py-6 text-sm text-red-700">Görev kimligi bulunamadı.</div>;
    }

    if (taskQuery.isLoading) {
        return <div className="px-8 py-6 text-sm text-gray-500">Görev detaylari yükleniyor...</div>;
    }

    if (taskQuery.isError || !task) {
        return <div className="px-8 py-6 text-sm text-red-700">Görev detayi yüklenemedi.</div>;
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<CheckSquare size={20} color="#DC2626" />}
                title={task.title}
                subtitle={`${taskStatusLabel(task.status)} - ${projectQuery.data?.name ?? 'Proje bilgisi yükleniyor'}`}
                actions={(
                    <button
                        type="button"
                        onClick={() => navigate('/app/gorevler')}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Gorevlere Don
                    </button>
                )}
            />

            <div className="grid gap-4 xl:grid-cols-3">
                <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 xl:col-span-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Görev Adi</label>
                        <input
                            value={form.title}
                            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-red-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Açıklama</label>
                        <textarea
                            value={form.description}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                            rows={6}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-red-500"
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Oncelik</label>
                            <select
                                value={form.priority}
                                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500"
                            >
                                {TASK_PRIORITY_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Atanan Kisiler</label>
                            <select
                                multiple
                                value={form.assigneeIds}
                                onChange={(event) => {
                                    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                                    setForm((prev) => ({ ...prev, assigneeIds: values }));
                                }}
                                className="h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500"
                            >
                                {sortedMembers.map((member) => {
                                    const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email || member.userId;
                                    return (
                                        <option key={member.userId} value={member.userId}>
                                            {fullName}
                                        </option>
                                    );
                                })}
                            </select>
                            <p className="text-[11px] text-gray-500">Birden fazla seçim icin Ctrl/Cmd kullanabilirsiniz.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Son Tarih</label>
                            <div className="relative">
                                <CalendarDays size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={form.dueDate}
                                    onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                                    type="date"
                                    className="h-10 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none transition focus:border-red-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={14} />
                            {updateMutation.isPending ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
                        </button>
                    </div>
                </section>

                <section className="space-y-4">
                    <article className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${taskStatusBadgeClass(task.status)}`}>
                                {taskStatusLabel(task.status)}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${taskPriorityBadgeClass(task.priority)}`}>
                                {taskPriorityLabel(task.priority)}
                            </span>
                        </div>

                        <div className="mt-3 grid gap-2">
                            {availableTransitions.length === 0 ? (
                                <p className="text-xs text-gray-500">Bu durumdan ilerleme adimi tanimli degil.</p>
                            ) : (
                                availableTransitions.map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        disabled={statusMutation.isPending}
                                        onClick={() => statusMutation.mutate(status)}
                                        className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {taskStatusLabel(status)} olarak guncelle
                                    </button>
                                ))
                            )}
                        </div>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Baglantilar</p>
                        <div className="mt-2 space-y-2 text-sm text-gray-700">
                            <p>
                                <span className="font-semibold text-gray-900">Proje:</span>{' '}
                                {projectQuery.isLoading ? 'Yükleniyor...' : projectQuery.data?.name ?? task.projectId}
                            </p>
                            <p>
                                <span className="font-semibold text-gray-900">Atanan:</span>{' '}
                                {memberName(task)}
                            </p>
                        </div>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Zaman Damgalari</p>
                        <div className="mt-2 space-y-2 text-sm text-gray-700">
                            <p className="inline-flex items-center gap-2">
                                <Clock3 size={14} className="text-gray-400" />
                                Olusturma: {formatDate(task.createdAt)}
                            </p>
                            <p className="inline-flex items-center gap-2">
                                <Clock3 size={14} className="text-gray-400" />
                                Guncelleme: {formatDate(task.updatedAt)}
                            </p>
                            <p className="inline-flex items-center gap-2">
                                <Clock3 size={14} className="text-gray-400" />
                                Son Tarih: {task.dueDate ? formatDate(task.dueDate) : '-'}
                            </p>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
}
