import { useState } from 'react';
import { CalendarDays, Plus, X } from 'lucide-react';
import type { CampaignCreatePayload, CampaignObjective, CampaignPlatform, CampaignStatus } from '../api/campaigns.api';
import type { ProjectItem } from '../../projects/api/projects.api';

interface CampaignFormModalProps {
    isOpen: boolean;
    isPending: boolean;
    projects: ProjectItem[];
    initialData?: Partial<CampaignCreatePayload>;
    onClose: () => void;
    onSubmit: (payload: CampaignCreatePayload) => void | Promise<void>;
}

const PLATFORM_OPTIONS: Array<{ value: CampaignPlatform; label: string }> = [
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'GOOGLE_ADS', label: 'Google Ads' },
    { value: 'LINKEDIN', label: 'LinkedIn' },
];

const OBJECTIVE_OPTIONS: Array<{ value: CampaignObjective; label: string }> = [
    { value: 'AWARENESS', label: 'Bilinirlik' },
    { value: 'ENGAGEMENT', label: 'Etkilesim' },
    { value: 'LEADS', label: 'Lead' },
    { value: 'SALES', label: 'Satis' },
];

const STATUS_OPTIONS: Array<{ value: CampaignStatus; label: string }> = [
    { value: 'DRAFT', label: 'Taslak' },
    { value: 'ACTIVE', label: 'Yayinda' },
    { value: 'PAUSED', label: 'Duraklatildi' },
    { value: 'COMPLETED', label: 'Tamamlandi' },
];

const INITIAL_STATE: CampaignCreatePayload = {
    title: '',
    projectId: '',
    description: '',
    platform: 'INSTAGRAM',
    objective: 'AWARENESS',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    budget: 0,
    owner: '',
};

export function CampaignFormModal({
    isOpen,
    isPending,
    projects,
    initialData,
    onClose,
    onSubmit,
}: CampaignFormModalProps) {
    const [form, setForm] = useState<CampaignCreatePayload>(() => ({
        ...INITIAL_STATE,
        ...initialData,
    }));

    if (!isOpen) return null;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await onSubmit({
            ...form,
            title: form.title.trim(),
            description: form.description?.trim() || undefined,
            projectId: form.projectId || undefined,
            owner: form.owner?.trim() || undefined,
            budget: Number(form.budget) || 0,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Kampanya Olustur</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">Yeni Kampanya</h3>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">
                        <X size={16} />
                    </button>
                </div>

                <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Baslik</label>
                        <input
                            value={form.title}
                            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                            placeholder="Orn: Bahar Lansman Kampanyasi"
                            className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            required
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Proje</label>
                            <select
                                value={form.projectId || ''}
                                onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
                                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            >
                                <option value="">Proje secin</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Sorumlu</label>
                            <input
                                value={form.owner || ''}
                                onChange={(event) => setForm((prev) => ({ ...prev, owner: event.target.value }))}
                                placeholder="Orn: Social Media Team"
                                className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Platform</label>
                            <select
                                value={form.platform}
                                onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value as CampaignPlatform }))}
                                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            >
                                {PLATFORM_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Hedef</label>
                            <select
                                value={form.objective}
                                onChange={(event) => setForm((prev) => ({ ...prev, objective: event.target.value as CampaignObjective }))}
                                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            >
                                {OBJECTIVE_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Durum</label>
                            <select
                                value={form.status}
                                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as CampaignStatus }))}
                                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            >
                                {STATUS_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Baslangic</label>
                            <div className="relative">
                                <CalendarDays size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={form.startDate}
                                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                                    type="date"
                                    className="h-10 w-full rounded-xl border border-gray-300 pl-8 pr-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Bitis</label>
                            <div className="relative">
                                <CalendarDays size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={form.endDate}
                                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                                    type="date"
                                    className="h-10 w-full rounded-xl border border-gray-300 pl-8 pr-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Butce (TRY)</label>
                            <input
                                value={form.budget ?? 0}
                                onChange={(event) => setForm((prev) => ({ ...prev, budget: Number(event.target.value) }))}
                                type="number"
                                min={0}
                                className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Aciklama</label>
                        <textarea
                            value={form.description || ''}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                            rows={4}
                            placeholder="Kampanya detaylari, hedef kitle, kreatif notlar..."
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                        />
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
                            {isPending ? 'Kaydediliyor...' : 'Kampanya Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
