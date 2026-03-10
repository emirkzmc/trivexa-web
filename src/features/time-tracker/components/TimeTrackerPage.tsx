import {useCallback, useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Timer} from 'lucide-react';
import {PageHeader} from '../../../shared/components/PageHeader';
import {useAuthStore} from '../../auth/store/authStore';
import {getProjects} from '../../projects/api/projects.api';
import {getProjectTasks} from '../../tasks/api/tasks.api';
import {getTimerHistory, type StartTimerPayload, type TimerEntry} from '../api/timeTracker.api';
import {useActiveTimer} from '../hooks/useActiveTimer';
import {useDeleteTimerEntry, useStartTimer, useStopTimer} from '../hooks/useTimerMutations';
import {TeamTab} from './sections/TeamTab';
import {TimerTab} from './sections/TimerTab';
import {DashboardTab} from './sections/DashboardTab';
import {TimeTrackerTabs} from './sections/TimeTrackerTabs';
import type {TeamSortField, TrackerTab} from './timeTracker.types';
import {getDisplayUserName, getEntryDurationSeconds} from '../utils/timeTracker.utils';
import {showConfirmDialog} from '../../../shared/lib/sweetAlert';
import {NAV_CONFIG} from '../../../shared/constants/navConfig';
import { ManualEntryModal } from './ManualEntryModal';
import { getPersonnel } from '../../personnel/api/personnel.api';
import { DEPARTMENT_LABELS } from '../../../shared/constants/departments';

const HISTORY_LIMIT_OPTIONS = [10, 20, 50];

export function TimeTrackerPage() {
    const currentUser = useAuthStore((state) => state.user);
    const userRole = currentUser?.role;
    const activeTimerAccent = userRole ? (NAV_CONFIG[userRole]?.theme.accent ?? '#DC2626') : '#DC2626';
    const hasTeamAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'CEO';
    const myProjectsOnly = !hasTeamAccess;

    const [activeTab, setActiveTab] = useState<TrackerTab>('timer');
    const [manualEntryOpen, setManualEntryOpen] = useState(false);
    const [formData, setFormData] = useState<StartTimerPayload>({projectId: '', taskId: '', description: ''});

    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortField, setSortField] = useState<keyof TimerEntry | 'projectName'>('updatedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const [teamStatusFilter, setTeamStatusFilter] = useState<string>('');
    const [teamDepartmentFilter, setTeamDepartmentFilter] = useState<string>('');
    const [teamUserFilter, setTeamUserFilter] = useState<string>('');
    const [teamPage, setTeamPage] = useState(1);
    const [teamLimit, setTeamLimit] = useState(10);
    const [teamSortField, setTeamSortField] = useState<TeamSortField>('startedAt');
    const [teamSortDirection, setTeamSortDirection] = useState<'asc' | 'desc'>('desc');

    const activeTimerQuery = useActiveTimer();
    const startMutation = useStartTimer();
    const stopMutation = useStopTimer();
    const deleteMutation = useDeleteTimerEntry();

    const historyQuery = useQuery({
        queryKey: ['timer-history', 'personal', currentUser?.id, page, limit],
        queryFn: () =>
            getTimerHistory({
                page,
                limit,
                userId: currentUser?.id,
            }),
        enabled: !!currentUser?.id,
    });

    const shouldLoadTeamData = hasTeamAccess && (activeTab === 'team' || activeTab === 'dashboard');

    const teamPersonnelQuery = useQuery({
        queryKey: ['time-tracker', 'team-personnel'],
        queryFn: () => getPersonnel({ page: 1, limit: 500 }),
        enabled: shouldLoadTeamData,
    });

    const teamHistoryQuery = useQuery({
        queryKey: ['timer-history', 'team', teamPage, teamLimit, teamUserFilter],
        queryFn: () =>
            getTimerHistory({
                page: teamPage,
                limit: teamLimit,
                userId: teamUserFilter || undefined,
            }),
        enabled: shouldLoadTeamData,
    });

    const dashboardHistoryQuery = useQuery({
        queryKey: ['timer-history', 'dashboard', hasTeamAccess ? 'team' : 'personal', currentUser?.id],
        queryFn: () =>
            getTimerHistory({
                page: 1,
                limit: 100,
                userId: hasTeamAccess ? undefined : currentUser?.id,
            }),
        enabled: hasTeamAccess || !!currentUser?.id,
    });

    const projectQuery = useQuery({
        queryKey: ['projects', 'timer-select', userRole, myProjectsOnly],
        queryFn: () => getProjects({page: 1, limit: 100, myProjectsOnly}),
    });

    const taskQuery = useQuery({
        queryKey: ['project-tasks', 'timer-select', formData.projectId],
        queryFn: () => getProjectTasks(formData.projectId, {page: 1, limit: 100}),
        enabled: !!formData.projectId,
    });

    const projects = projectQuery.data?.data ?? [];
    const tasks = taskQuery.data?.data ?? [];
    const historyRows = historyQuery.data?.data ?? [];
    const teamRows = teamHistoryQuery.data?.data ?? [];
    const dashboardRows = dashboardHistoryQuery.data?.data ?? [];
    const teamPersonnelRows = teamPersonnelQuery.data?.data ?? [];
    const personnelMapById = useMemo(
        () => new Map(teamPersonnelRows.map((row) => [row.id, row])),
        [teamPersonnelRows],
    );
    const personnelNameById = useMemo(
        () => new Map(teamPersonnelRows.map((row) => [row.id, `${row.firstName} ${row.lastName}`.trim() || row.email || row.id])),
        [teamPersonnelRows],
    );

    const filteredHistoryRows = useMemo(
        () => historyRows.filter((row) => !statusFilter || row.status === statusFilter),
        [historyRows, statusFilter],
    );

    const total = historyQuery.data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);
    const teamTotal = teamHistoryQuery.data?.total ?? 0;
    const teamTotalPages = Math.ceil(teamTotal / teamLimit);

    const projectNameMap = useMemo(
        () => new Map(projects.map((project) => [project.id, project.name])),
        [projects],
    );

    const resolveProjectName = (row: TimerEntry): string =>
        row.projectName || projectNameMap.get(row.projectId) || row.projectId || '-';

    const resolveDepartmentName = useCallback((row: TimerEntry): string => {
        const department = personnelMapById.get(row.userId)?.department;
        if (!department) return '-';
        const normalized = department.trim().toUpperCase();
        return DEPARTMENT_LABELS[normalized as keyof typeof DEPARTMENT_LABELS] ?? department;
    }, [personnelMapById]);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const filteredAndSortedHistoryRows = useMemo(() => {
        const sorted = [...filteredHistoryRows].sort((a, b) => {
            let aVal: unknown = a[sortField as keyof TimerEntry];
            let bVal: unknown = b[sortField as keyof TimerEntry];

            if (sortField === 'projectName') {
                aVal = resolveProjectName(a);
                bVal = resolveProjectName(b);
            } else if (sortField === 'startedAt' || sortField === 'stoppedAt' || sortField === 'updatedAt') {
                aVal = aVal ? new Date(aVal as string).getTime() : 0;
                bVal = bVal ? new Date(bVal as string).getTime() : 0;
            } else if (sortField === 'duration') {
                aVal = getEntryDurationSeconds(a);
                bVal = getEntryDurationSeconds(b);
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if ((aVal as string | number) < (bVal as string | number)) return sortDirection === 'asc' ? -1 : 1;
            if ((aVal as string | number) > (bVal as string | number)) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredHistoryRows, sortField, sortDirection, projectNameMap]);

    const activeTimer = activeTimerQuery.timer;
    const activeProjectName = activeTimer?.projectName
        || (activeTimer?.projectId
            ? (projectNameMap.get(activeTimer.projectId) ?? activeTimer.projectId)
            : 'Proje secilmedi');

    const trackedSecondsInList = useMemo(
        () => filteredAndSortedHistoryRows.reduce((sum, row) => sum + getEntryDurationSeconds(row), 0),
        [filteredAndSortedHistoryRows],
    );

    const completedCountInList = useMemo(
        () => filteredAndSortedHistoryRows.filter((row) => row.status === 'STOPPED').length,
        [filteredAndSortedHistoryRows],
    );

    const dashboardTrackedSeconds = useMemo(
        () => dashboardRows.reduce((sum, row) => sum + getEntryDurationSeconds(row), 0),
        [dashboardRows],
    );

    const dashboardActiveCount = useMemo(
        () => dashboardRows.filter((row) => row.status === 'ACTIVE').length,
        [dashboardRows],
    );

    const dashboardCompletedCount = useMemo(
        () => dashboardRows.filter((row) => row.status === 'STOPPED').length,
        [dashboardRows],
    );

    const dashboardCancelledCount = useMemo(
        () => dashboardRows.filter((row) => row.status === 'CANCELLED').length,
        [dashboardRows],
    );

    const dashboardUniqueUserCount = useMemo(
        () => new Set(dashboardRows.map((row) => row.userId).filter(Boolean)).size,
        [dashboardRows],
    );

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const dashboardTopProjects = useMemo(() => {
        const totals = new Map<string, number>();
        dashboardRows.forEach((row) => {
            const key = resolveProjectName(row);
            totals.set(key, (totals.get(key) ?? 0) + getEntryDurationSeconds(row));
        });

        return [...totals.entries()]
            .map(([projectName, seconds]) => ({projectName, seconds}))
            .sort((a, b) => b.seconds - a.seconds)
            .slice(0, 6);
    }, [dashboardRows]);

    const dashboardTopUsers = useMemo(() => {
        const totals = new Map<string, { name: string; seconds: number; entries: number }>();
        dashboardRows.forEach((row) => {
            const key = row.userId || 'unknown';
            const existing = totals.get(key);
            const seconds = getEntryDurationSeconds(row);
            const name = getDisplayUserName(row);
            if (existing) {
                existing.seconds += seconds;
                existing.entries += 1;
                return;
            }
            totals.set(key, {name, seconds, entries: 1});
        });

        return [...totals.values()]
            .sort((a, b) => b.seconds - a.seconds)
            .slice(0, 8);
    }, [dashboardRows]);

    const teamUsers = useMemo(() => {
        const map = new Map<string, string>();
        [...teamRows, ...dashboardRows].forEach((row) => {
            if (!row.userId) return;
            map.set(row.userId, personnelNameById.get(row.userId) ?? getDisplayUserName(row));
        });
        return [...map.entries()]
            .map(([id, name]) => ({id, name}))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [teamRows, dashboardRows, personnelNameById]);

    const teamDepartments = useMemo(() => {
        const unique = new Set<string>();
        teamRows.forEach((row) => {
            const department = resolveDepartmentName(row);
            if (department !== '-') {
                unique.add(department);
            }
        });

        return [...unique]
            .sort((a, b) => a.localeCompare(b, 'tr'))
            .map((name) => ({ id: name, name }));
    }, [teamRows, resolveDepartmentName]);

    const filteredTeamRows = useMemo(
        () =>
            teamRows.filter((row) => {
                if (teamStatusFilter && row.status !== teamStatusFilter) return false;
                if (teamDepartmentFilter && resolveDepartmentName(row) !== teamDepartmentFilter) return false;
                return true;
            }),
        [teamRows, teamStatusFilter, teamDepartmentFilter, resolveDepartmentName],
    );

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const sortedTeamRows = useMemo(() => {
        const sorted = [...filteredTeamRows].sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            if (teamSortField === 'userName') {
                aVal = getDisplayUserName(a).toLowerCase();
                bVal = getDisplayUserName(b).toLowerCase();
            } else if (teamSortField === 'projectName') {
                aVal = resolveProjectName(a).toLowerCase();
                bVal = resolveProjectName(b).toLowerCase();
            } else if (teamSortField === 'taskTitle') {
                aVal = (a.taskTitle || '').toLowerCase();
                bVal = (b.taskTitle || '').toLowerCase();
            } else if (teamSortField === 'description') {
                aVal = (a.description || '').toLowerCase();
                bVal = (b.description || '').toLowerCase();
            } else if (teamSortField === 'startedAt') {
                aVal = new Date(a.startedAt).getTime();
                bVal = new Date(b.startedAt).getTime();
            } else if (teamSortField === 'stoppedAt') {
                aVal = a.stoppedAt ? new Date(a.stoppedAt).getTime() : 0;
                bVal = b.stoppedAt ? new Date(b.stoppedAt).getTime() : 0;
            } else if (teamSortField === 'duration') {
                aVal = getEntryDurationSeconds(a);
                bVal = getEntryDurationSeconds(b);
            } else if (teamSortField === 'status') {
                aVal = a.status.toLowerCase();
                bVal = b.status.toLowerCase();
            }

            if (aVal < bVal) return teamSortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return teamSortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [filteredTeamRows, teamSortField, teamSortDirection]);

    const handleSort = (field: keyof TimerEntry | 'projectName') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleTeamSort = (field: TeamSortField) => {
        if (teamSortField === field) {
            setTeamSortDirection(teamSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setTeamSortField(field);
            setTeamSortDirection('asc');
        }
    };

    function handleStartSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!formData.projectId) return;

        startMutation.mutate(
            {
                projectId: formData.projectId,
                taskId: formData.taskId?.trim() ? formData.taskId : undefined,
                description: (formData.description ?? '').trim() || undefined,
            },
            {
                onSuccess: () => {
                    setFormData((prev) => ({...prev, description: ''}));
                },
            },
        );
    }

    function handleStopTimer() {
        if (activeTimerQuery.isActive) {
            stopMutation.mutate();
        }
    }

    async function handleDeleteHistoryRow(id: string) {
        const isConfirmed = await showConfirmDialog({
            title: 'Zaman kaydı silinsin mi?',
            text: 'Bu zaman kaydı kalici olarak silinecek.',
            confirmText: 'Kaydi Sil',
        });
        if (!isConfirmed) return;
        deleteMutation.mutate(id);
    }

    function handleStatusFilterChange(value: string) {
        setStatusFilter(value);
        setPage(1);
    }

    function handleLimitChange(nextLimit: number) {
        setLimit(nextLimit);
        setPage(1);
    }

    function handleTeamLimitChange(nextLimit: number) {
        setTeamLimit(nextLimit);
        setTeamPage(1);
    }

    const isFormDisabled = activeTimerQuery.isActive || startMutation.isPending;

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-[18px]">
            <PageHeader
                icon={<Timer size={20} color="var(--role-accent-600)"/>}
                title="Time Tracker"
                subtitle="Çalışma suresini takip et, ozeti izle ve ekip hareketlerini gor"
            />

            <TimeTrackerTabs
                activeTab={activeTab}
                hasTeamAccess={hasTeamAccess}
                onTabChange={setActiveTab}
            />

            {activeTab === 'timer' && (
                <TimerTab
                    activeTimerQuery={{isActive: activeTimerQuery.isActive, elapsed: activeTimerQuery.elapsed}}
                    activeTimerAccent={activeTimerAccent}
                    activeTimer={activeTimer}
                    activeProjectName={activeProjectName}
                    stopPending={stopMutation.isPending}
                    onStopTimer={handleStopTimer}
                    onOpenManualEntry={() => setManualEntryOpen(true)}
                    formData={formData}
                    setFormData={setFormData}
                    onStartSubmit={handleStartSubmit}
                    isFormDisabled={isFormDisabled}
                    projectLoading={projectQuery.isLoading}
                    projectError={projectQuery.isError}
                    taskLoading={taskQuery.isLoading}
                    taskError={taskQuery.isError}
                    projects={projects}
                    tasks={tasks}
                    trackedSecondsInList={trackedSecondsInList}
                    total={total}
                    completedCountInList={completedCountInList}
                    statusFilter={statusFilter}
                    onStatusFilterChange={handleStatusFilterChange}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    historyLoading={historyQuery.isLoading}
                    historyError={historyQuery.isError}
                    filteredAndSortedHistoryRows={filteredAndSortedHistoryRows}
                    resolveProjectName={resolveProjectName}
                    deletePending={deleteMutation.isPending}
                    onDeleteHistoryRow={handleDeleteHistoryRow}
                    page={page}
                    totalPages={totalPages}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={handleLimitChange}
                    limitOptions={HISTORY_LIMIT_OPTIONS}
                />
            )}

            <ManualEntryModal
                isOpen={manualEntryOpen}
                onClose={() => setManualEntryOpen(false)}
            />

            {activeTab === 'dashboard' && (
                <DashboardTab
                    roleAccent={activeTimerAccent}
                    hasTeamAccess={hasTeamAccess}
                    dashboardTrackedSeconds={dashboardTrackedSeconds}
                    dashboardActiveCount={dashboardActiveCount}
                    dashboardCompletedCount={dashboardCompletedCount}
                    dashboardCancelledCount={dashboardCancelledCount}
                    dashboardUniqueUserCount={dashboardUniqueUserCount}
                    dashboardTopProjects={dashboardTopProjects}
                    dashboardTopUsers={dashboardTopUsers}
                    dashboardRows={dashboardRows}
                    resolveProjectName={resolveProjectName}
                    activeTimer={activeTimer}
                    activeElapsedSeconds={activeTimerQuery.elapsed}
                />
            )}


            {activeTab === 'team' && hasTeamAccess && (
                <TeamTab
                    filteredTeamRows={filteredTeamRows}
                    total={teamTotal}
                    userFilter={teamUserFilter}
                    statusFilter={teamStatusFilter}
                    departmentFilter={teamDepartmentFilter}
                    users={teamUsers}
                    departments={teamDepartments}
                    onUserFilterChange={(value) => {
                        setTeamUserFilter(value);
                        setTeamPage(1);
                    }}
                    onStatusFilterChange={(value) => {
                        setTeamStatusFilter(value);
                        setTeamPage(1);
                    }}
                    onDepartmentFilterChange={(value) => {
                        setTeamDepartmentFilter(value);
                        setTeamPage(1);
                    }}
                    sortField={teamSortField}
                    sortDirection={teamSortDirection}
                    onSort={handleTeamSort}
                    loading={teamHistoryQuery.isLoading || teamPersonnelQuery.isLoading}
                    error={teamHistoryQuery.isError}
                    sortedRows={sortedTeamRows}
                    resolveProjectName={resolveProjectName}
                    resolveDepartmentName={resolveDepartmentName}
                    getDisplayUserName={getDisplayUserName}
                    page={teamPage}
                    totalPages={teamTotalPages}
                    limit={teamLimit}
                    onPageChange={setTeamPage}
                    onLimitChange={handleTeamLimitChange}
                    limitOptions={HISTORY_LIMIT_OPTIONS}
                />
            )}

        </div>
    );
}
