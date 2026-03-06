import { CalendarDays, UserRound } from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatDate';
import type { TaskItem } from '../api/tasks.api';
import { nextStatusOptions, taskPriorityBadgeClass, taskPriorityLabel, taskStatusBadgeClass, taskStatusLabel, toTaskStatus } from './tasks.utils';

interface TaskBoardColumnProps {
    title: string;
    tasks: TaskItem[];
    pendingTaskId: string | null;
    onOpenTask: (taskId: string) => void;
    onStatusChange: (taskId: string, currentStatus: string, nextStatus: string) => void;
}

function assigneeName(task: TaskItem): string {
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
    return fullName || task.assigneeEmail || 'Atama bekliyor';
}

export function TaskBoardColumn({
    title,
    tasks,
    pendingTaskId,
    onOpenTask,
    onStatusChange,
}: TaskBoardColumnProps) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{tasks.length}</span>
            </div>

            <div className="space-y-2">
                {tasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-3 py-5 text-center text-xs text-gray-500">
                        Kayit yok
                    </div>
                ) : (
                    tasks.map((task) => {
                        const normalizedStatus = toTaskStatus(task.status);
                        const statusOptions = nextStatusOptions(normalizedStatus);
                        const isPending = pendingTaskId === task.id;

                        return (
                            <article
                                key={task.id}
                                className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-gray-300 hover:bg-white"
                                onClick={() => onOpenTask(task.id)}
                            >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <p className="line-clamp-2 text-sm font-semibold text-gray-900">{task.title}</p>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${taskPriorityBadgeClass(task.priority)}`}>
                                        {taskPriorityLabel(task.priority)}
                                    </span>
                                </div>

                                <p className="mb-2 line-clamp-2 text-xs text-gray-500">
                                    {task.description?.trim() || 'Aciklama eklenmemis'}
                                </p>

                                <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                        <UserRound size={12} />
                                        {assigneeName(task)}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDays size={12} />
                                        {task.dueDate ? formatDate(task.dueDate) : '-'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${taskStatusBadgeClass(task.status)}`}>
                                        {taskStatusLabel(task.status)}
                                    </span>
                                    <select
                                        value={normalizedStatus}
                                        disabled={isPending}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => onStatusChange(task.id, normalizedStatus, event.target.value)}
                                        className="h-7 flex-1 rounded-md border border-gray-300 bg-white px-2 text-[11px] text-gray-700 outline-none transition focus:border-red-500"
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={`${task.id}-${option}`} value={option}>
                                                {taskStatusLabel(option)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>
        </section>
    );
}
