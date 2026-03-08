import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectMember } from '../../projects/api/projects.api';
import type { TaskCreatePayload } from '../api/tasks.api';
import { TASK_PRIORITY_OPTIONS } from './tasks.constants';

interface TaskCreateModalProps {
    isOpen: boolean;
    projectName: string;
    members: ProjectMember[];
    isPending: boolean;
    onClose: () => void;
    onCreate: (payload: TaskCreatePayload) => Promise<void> | void;
}

interface TaskCreateFormState {
    title: string;
    description: string;
    priority: string;
    assigneeIds: string[];
    dueDate: string;
}

const INITIAL_STATE: TaskCreateFormState = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeIds: [],
    dueDate: '',
};

function memberName(member: ProjectMember): string {
    const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
    return fullName || member.email || member.userId;
}

export function TaskCreateModal({
    isOpen,
    projectName,
    members,
    isPending,
    onClose,
    onCreate,
}: TaskCreateModalProps) {
    const [form, setForm] = useState<TaskCreateFormState>(INITIAL_STATE);

    useEffect(() => {
        if (isOpen) {
            setForm(INITIAL_STATE);
        }
    }, [isOpen]);

    const sortedMembers = useMemo(
        () => [...members].sort((a, b) => memberName(a).localeCompare(memberName(b), 'tr')),
        [members],
    );

    if (!isOpen) {
        return null;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.title.trim()) {
            toast.error('Görev adi zorunludur.');
            return;
        }

        await onCreate({
            title: form.title.trim(),
            description: form.description.trim(),
            priority: form.priority,
            assigneeIds: form.assigneeIds.length ? form.assigneeIds : undefined,
            dueDate: form.dueDate || undefined,
        });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Görev Olustur</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">{projectName}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Görev Adi</label>
                        <input
                            value={form.title}
                            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                            placeholder="Orn: API entegrasyon testlerini tamamla"
                            className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Açıklama</label>
                        <textarea
                            value={form.description}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                            rows={4}
                            placeholder="Görev kapsamini ve teslim kriterlerini yazin..."
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Oncelik</label>
                            <select
                                value={form.priority}
                                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
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
                                className="h-24 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            >
                                {sortedMembers.map((member) => (
                                    <option key={member.userId} value={member.userId}>
                                        {memberName(member)}
                                    </option>
                                ))}
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
                                    className="h-10 w-full rounded-xl border border-gray-300 pl-8 pr-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 items-center rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Vazgec
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus size={14} />
                            {isPending ? 'Kaydediliyor...' : 'Görev Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
