import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUpDown,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    CircleDashed,
    Filter,
    FolderKanban,
    LayoutGrid,
    Plus,
    Rows3,
    Search,
    Wallet,
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { usePermission } from '../../../shared/hooks/usePermission';
import { formatDate } from '../../../shared/utils/formatDate';
import { ROLES } from '../../../shared/constants/roles';
import { useAuthStore } from '../../auth/store/authStore';
import { getProjects } from '../api/projects.api';
import { ProjectCard } from './ProjectCard';
import { StatsCard } from './StatsCard';
import { STATUS_OPTIONS } from './projectsPage.constants';
import { formatMoney, toMeta } from './projectsPage.utils';
import type { ViewMode } from './projectsPage.types';
import { useProjectCreate } from '../hooks/useProjectCreate';
import { ProjectCreateModal } from './create/ProjectCreateModal';

type ListColumnKey = 'project' | 'status' | 'date' | 'budget';
type ResizableListColumnKey = Exclude<ListColumnKey, 'budget'>;
type SortDirection = 'asc' | 'desc';

const MIN_COLUMN_WIDTH = 140;
const INITIAL_COLUMN_WIDTHS: Record<ResizableListColumnKey, number> = {
    project: 840,
    status: 180,
    date: 240,
};
const RESIZABLE_COLUMN_COUNT = Object.keys(INITIAL_COLUMN_WIDTHS).length;
const PERSONAL_PROJECT_SCOPE_ROLES = new Set<string>([
    ROLES.DEVELOPER,
    ROLES.SOCIAL_MEDIA,
    ROLES.CREATIVE,
    ROLES.MARKETING,
    ROLES.PRODUCTION,
]);

export function ProjectsPage() {
    const navigate = useNavigate();
    const userRole = useAuthStore((state) => state.user?.role);
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [view, setView] = useState<ViewMode>('grid');
    const [sortField, setSortField] = useState<ListColumnKey>('project');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [columnWidths, setColumnWidths] = useState<Record<ResizableListColumnKey, number>>(INITIAL_COLUMN_WIDTHS);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const resizeStateRef = useRef<{
        column: ResizableListColumnKey;
        startX: number;
        startWidth: number;
    } | null>(null);

    const projectCreate = useProjectCreate();
    const isAdminOrCeo = userRole === ROLES.ADMIN || userRole === ROLES.CEO;
    const canCreateProject = isAdminOrCeo || hasPermission('projects:create');
    const canReadProjects = isAdminOrCeo
        || hasPermission('projects:read')
        || hasPermission('projects:update')
        || hasPermission('projects:delete')
        || canCreateProject;
    const myProjectsOnly = !!userRole && PERSONAL_PROJECT_SCOPE_ROLES.has(userRole);

    const projectsQuery = useQuery({
        queryKey: ['projects', { page, limit, status, search, userRole, myProjectsOnly }],
        queryFn: () =>
            getProjects({
                page,
                limit,
                status: status || undefined,
                search: search.trim() || undefined,
                myProjectsOnly: myProjectsOnly || undefined,
            }),
        enabled: canReadProjects,
    });

    const rows = useMemo(() => projectsQuery.data?.data || [], [projectsQuery.data?.data]);
    const total = projectsQuery.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

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
        if (view !== 'list') {
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
                const nextEntries = (Object.entries(prev) as Array<[ResizableListColumnKey, number]>)
                    .map(([key, width]) => [key, Math.max(MIN_COLUMN_WIDTH, Math.round(width * ratio))] as const);
                const nextTotal = nextEntries.reduce((sum, [, width]) => sum + width, 0);
                const delta = targetTotal - nextTotal;

                if (delta !== 0) {
                    const [firstKey, firstWidth] = nextEntries[0];
                    nextEntries[0] = [firstKey, Math.max(MIN_COLUMN_WIDTH, firstWidth + delta)];
                }

                const next = Object.fromEntries(nextEntries) as Record<ResizableListColumnKey, number>;
                const unchanged = (Object.keys(prev) as ResizableListColumnKey[])
                    .every((key) => prev[key] === next[key]);

                return unchanged ? prev : next;
            });
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, [view]);

    const sortedRows = useMemo(() => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        const normalized = [...rows];

        normalized.sort((left, right) => {
            if (sortField === 'project') {
                return left.name.localeCompare(right.name, 'tr-TR', { sensitivity: 'base' }) * direction;
            }

            if (sortField === 'status') {
                return toMeta(left.status).label.localeCompare(toMeta(right.status).label, 'tr-TR', { sensitivity: 'base' }) * direction;
            }

            if (sortField === 'date') {
                const leftDate = left.startDate ? Date.parse(left.startDate) : Number.NEGATIVE_INFINITY;
                const rightDate = right.startDate ? Date.parse(right.startDate) : Number.NEGATIVE_INFINITY;
                const safeLeft = Number.isFinite(leftDate) ? leftDate : Number.NEGATIVE_INFINITY;
                const safeRight = Number.isFinite(rightDate) ? rightDate : Number.NEGATIVE_INFINITY;
                return (safeLeft - safeRight) * direction;
            }

            const leftBudget = left.budget ?? Number.NEGATIVE_INFINITY;
            const rightBudget = right.budget ?? Number.NEGATIVE_INFINITY;
            return (leftBudget - rightBudget) * direction;
        });

        return normalized;
    }, [rows, sortDirection, sortField]);

    const tableMinWidth = useMemo(
        () => Object.values(columnWidths).reduce((sum, width) => sum + width, 0) + MIN_COLUMN_WIDTH,
        [columnWidths],
    );

    const stats = useMemo(() => {
        const inProgress = rows.filter((item) => item.status === 'IN_PROGRESS').length;
        const completed = rows.filter((item) => item.status === 'COMPLETED').length;
        const totalBudget = rows.reduce((sum, item) => sum + (item.budget ?? 0), 0);

        return {
            inProgress,
            completed,
            totalBudget,
        };
    }, [rows]);

    function handleStatusChange(nextStatus: string) {
        setStatus(nextStatus);
        setPage(1);
    }

    function handleSearchChange(nextSearch: string) {
        setSearch(nextSearch);
        setPage(1);
    }

    function handleListSort(column: ListColumnKey) {
        if (sortField === column) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortField(column);
        setSortDirection('asc');
    }

    function handleColumnResizeStart(column: ResizableListColumnKey, event: ReactMouseEvent<HTMLDivElement>) {
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

    function renderSortIcon(column: ListColumnKey) {
        if (sortField !== column) {
            return <ArrowUpDown size={13} className="text-gray-400" />;
        }

        return sortDirection === 'asc'
            ? <ChevronUp size={13} className="text-red-600" />
            : <ChevronDown size={13} className="text-red-600" />;
    }

    const actions = (
        <>
            <button
                type="button"
                onClick={() => setView((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
                {view === 'grid' ? <Rows3 size={14} /> : <LayoutGrid size={14} />}
                {view === 'grid' ? 'Liste Gorunumu' : 'Kart Gorunumu'}
            </button>

            {canCreateProject && (
                <button
                    type="button"
                    onClick={projectCreate.openCreatePanel}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                    <Plus size={14} />
                    Yeni Proje
                </button>
            )}
        </>
    );

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<FolderKanban size={20} color="#DC2626" />}
                title={myProjectsOnly ? 'Projelerim' : 'Projeler'}
                subtitle={`Toplam ${total} proje kaydı`}
                actions={actions}
            />

            {!canReadProjects && (
                <section className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-10 text-center text-sm font-medium text-yellow-800">
                    Bu role proje listesine erişim izni tanimli degil.
                </section>
            )}

            {canReadProjects && (
                <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatsCard title="Toplam Proje" value={String(total)} subtitle="Filtrelenmis toplam kayıt" />
                    <StatsCard title="Devam Eden" value={String(stats.inProgress)} subtitle="Aktif operasyon surecinde" />
                    <StatsCard title="Tamamlanan" value={String(stats.completed)} subtitle="Tamamlanmis proje adedi" />
                    <StatsCard title="Sayfa Butcesi" value={formatMoney(stats.totalBudget)} subtitle="Görünen kayitlara göre" />
                </section>
            )}

            {canReadProjects && (
                <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder="Proje adi veya açıklama ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2">
                        <Filter size={13} className="text-gray-400" />
                        <select
                            value={status}
                            onChange={(event) => handleStatusChange(event.target.value)}
                            className="h-9 min-w-[160px] border-0 bg-transparent text-sm text-gray-700 outline-none"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                </section>
            )}

            {canReadProjects && (
                <section className="rounded-xl border border-gray-200 bg-white p-4">
                {projectsQuery.isLoading ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-44 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
                        ))}
                    </div>
                ) : projectsQuery.isError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-10 text-center text-sm font-medium text-red-600">
                        Proje listesi yüklenemedi.
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                        Eslesen proje bulunamadı.
                    </div>
                ) : view === 'grid' ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {rows.map((project) => (
                            <ProjectCard key={project.id} project={project} onOpen={() => navigate(`/app/projeler/${project.id}`)} />
                        ))}
                    </div>
                ) : (
                    <div ref={tableContainerRef} className="overflow-x-auto">
                        <table
                            className="w-full table-fixed text-left text-sm"
                            style={{ minWidth: `${tableMinWidth}px` }}
                        >
                            <colgroup>
                                <col style={{ width: `${columnWidths.project}px` }} />
                                <col style={{ width: `${columnWidths.status}px` }} />
                                <col style={{ width: `${columnWidths.date}px` }} />
                                <col />
                            </colgroup>
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="group relative px-3 py-2.5 font-semibold">
                                        <button type="button" className="flex items-center gap-1" onClick={() => handleListSort('project')}>
                                            Proje
                                            {renderSortIcon('project')}
                                        </button>
                                        <div
                                            role="separator"
                                            aria-orientation="vertical"
                                            aria-label="Proje sutunu genisligini degistir"
                                            className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                            onMouseDown={(event) => handleColumnResizeStart('project', event)}
                                        >
                                            <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                        </div>
                                    </th>
                                    <th className="group relative px-3 py-2.5 font-semibold">
                                        <button type="button" className="flex items-center gap-1" onClick={() => handleListSort('status')}>
                                            Durum
                                            {renderSortIcon('status')}
                                        </button>
                                        <div
                                            role="separator"
                                            aria-orientation="vertical"
                                            aria-label="Durum sutunu genisligini degistir"
                                            className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                            onMouseDown={(event) => handleColumnResizeStart('status', event)}
                                        >
                                            <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                        </div>
                                    </th>
                                    <th className="group relative px-3 py-2.5 font-semibold">
                                        <button type="button" className="flex items-center gap-1" onClick={() => handleListSort('date')}>
                                            Tarih
                                            {renderSortIcon('date')}
                                        </button>
                                        <div
                                            role="separator"
                                            aria-orientation="vertical"
                                            aria-label="Tarih sutunu genisligini degistir"
                                            className="absolute right-0 top-0 h-full w-2 translate-x-1 cursor-col-resize select-none"
                                            onMouseDown={(event) => handleColumnResizeStart('date', event)}
                                        >
                                            <span className="absolute inset-y-2 right-1 w-px bg-gray-200 transition group-hover:bg-red-300" />
                                        </div>
                                    </th>
                                    <th className="group relative px-3 py-2.5 font-semibold">
                                        <button type="button" className="flex items-center gap-1" onClick={() => handleListSort('budget')}>
                                            Butce
                                            {renderSortIcon('budget')}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedRows.map((project) => {
                                    const meta = toMeta(project.status);

                                    return (
                                        <tr
                                            key={project.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => navigate(`/app/projeler/${project.id}`)}
                                        >
                                            <td className="px-3 py-2.5">
                                                <p className="font-semibold text-gray-900">{project.name}</p>
                                                <p className="text-xs text-gray-500">{project.description?.trim() || '-'}</p>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClass}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarDays size={13} className="text-gray-400" />
                                                    <span>{project.startDate ? formatDate(project.startDate) : '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-700">
                                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5">
                                                    <Wallet size={13} className="text-gray-400" />
                                                    <span className="font-medium">{formatMoney(project.budget)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!projectsQuery.isLoading && !projectsQuery.isError && rows.length > 0 && (
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
                )}
                </section>
            )}

            {canReadProjects && (
                <section className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-xs text-gray-500">
                <p className="flex items-center gap-1.5">
                    <CircleDashed size={13} />
                    Proje karti veya satirina tiklayarak detay ekranini acabilirsiniz.
                </p>
                </section>
            )}

            {canCreateProject && <ProjectCreateModal controller={projectCreate} />}
        </div>
    );
}
