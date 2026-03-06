import type { ProjectItem } from '../api/projects.api';
import { formatDate } from '../../../shared/utils/formatDate';
import { formatMoney, toMeta } from './projectsPage.utils';

export function ProjectCard({ project, onOpen }: { project: ProjectItem; onOpen: () => void }) {
    const meta = toMeta(project.status);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">{project.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {project.description?.trim() || 'Aciklama eklenmedi.'}
                    </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClass}`}>
                    {meta.label}
                </span>
            </div>

            <div className="mb-3 h-2 rounded-full bg-gray-100">
                <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${Math.max(0, Math.min(100, meta.progress))}%` }}
                />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Baslangic</p>
                    <p className="font-medium text-gray-700">{project.startDate ? formatDate(project.startDate) : '-'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Teslim</p>
                    <p className="font-medium text-gray-700">{project.deadline ? formatDate(project.deadline) : '-'}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-gray-50 px-2.5 py-2">
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Butce</p>
                    <p className="font-medium text-gray-700">{formatMoney(project.budget)}</p>
                </div>
            </div>
        </button>
    );
}
