export type TrackerTab = 'dashboard' | 'timer' | 'team';

export type TeamSortField =
    | 'userName'
    | 'projectName'
    | 'taskTitle'
    | 'description'
    | 'startedAt'
    | 'stoppedAt'
    | 'duration'
    | 'status';

export interface DashboardTopProject {
    projectName: string;
    seconds: number;
}

export interface DashboardTopUser {
    name: string;
    seconds: number;
    entries: number;
}
