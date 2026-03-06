import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Calendar, Clock, Loader2, Save } from 'lucide-react';
import { getProjects } from '../../projects/api/projects.api';
import { getProjectTasks } from '../../tasks/api/tasks.api';
import { useCreateManualEntry } from '../hooks/useTimerMutations';

interface ManualEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ManualEntryModal({ isOpen, onClose }: ManualEntryModalProps) {
    const [projectId, setProjectId] = useState('');
    const [taskId, setTaskId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [description, setDescription] = useState('');

    const createMutation = useCreateManualEntry();

    const projectQuery = useQuery({
        queryKey: ['projects', 'timer-modal-select'],
        queryFn: () => getProjects({ page: 1, limit: 100 }),
        enabled: isOpen,
    });

    const taskQuery = useQuery({
        queryKey: ['project-tasks', 'timer-modal-select', projectId],
        queryFn: () => getProjectTasks(projectId, { page: 1, limit: 100 }),
        enabled: isOpen && !!projectId,
    });

    if (!isOpen) return null;

    const projects = projectQuery.data?.data ?? [];
    const tasks = taskQuery.data?.data ?? [];

    const isSubmitting = createMutation.isPending;
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    const hasValidTimeRange = Number.isFinite(startDateTime.getTime())
        && Number.isFinite(endDateTime.getTime())
        && endDateTime.getTime() > startDateTime.getTime();
    const isValid = !!date && !!startTime && !!endTime && !!description.trim() && hasValidTimeRange;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid) return;

        createMutation.mutate(
            {
                projectId: projectId || undefined,
                taskId: taskId || undefined,
                description: description.trim(),
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
            },
            {
                onSuccess: () => onClose(),
            }
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 transition-all duration-300">
            <div className="w-full max-w-[500px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Manuel Kayıt Ekle</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6">
                    <form id="manual-entry-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Proje</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => {
                                        setProjectId(e.target.value);
                                        setTaskId('');
                                    }}
                                    disabled={isSubmitting || projectQuery.isLoading}
                                    className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[14px] text-gray-900 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all"
                                >
                                    <option value="">{projectQuery.isLoading ? 'Yükleniyor...' : 'Seçiniz (Opsiyonel)'}</option>
                                    {projects.map((p: { id: string; name: string }) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Task</label>
                                <select
                                    value={taskId}
                                    onChange={(e) => setTaskId(e.target.value)}
                                    disabled={isSubmitting || !projectId || taskQuery.isLoading}
                                    className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[14px] text-gray-900 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all disabled:opacity-50"
                                >
                                    <option value="">{!projectId ? 'Önce Proje Seçin' : taskQuery.isLoading ? 'Yükleniyor...' : 'Seçiniz (Opsiyonel)'}</option>
                                    {tasks.map((t: { id: string; title: string }) => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {!hasValidTimeRange && (
                            <p className="m-0 text-xs sem-danger-text">
                                Bitis saati, baslangic saatinden sonra olmalidir.
                            </p>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                <Calendar size={16} className="text-gray-400" /> Tarih
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                disabled={isSubmitting}
                                className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[14px] text-gray-900 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                    <Clock size={16} className="text-gray-400" /> Başlangıç Saati
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[14px] text-gray-900 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all font-mono"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                    <Clock size={16} className="text-gray-400" /> Bitiş Saati
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[14px] text-gray-900 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Açıklama</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Neler yapıldı?"
                                required
                                disabled={isSubmitting}
                                className="min-h-[100px] resize-y rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-[14px] text-gray-900 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-10 rounded-xl px-4 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Vazgeç
                    </button>
                    <button
                        form="manual-entry-form"
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        className="role-accent-btn inline-flex h-10 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
