export type ViewMode = 'grid' | 'list';
export type CreateStep = 1 | 2;
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DepartmentFormType = 'SOFTWARE' | 'MARKETING' | 'PRODUCTION' | 'DESIGN' | 'GENERAL';

export interface DepartmentDetailsState {
    software: {
        repoUrl: string;
        techStack: string;
        apiDocumentation: string;
        serverInfo: string;
    };
    marketing: {
        targetAudience: string;
        adChannels: string;
        campaignBudget: string;
    };
    production: {
        equipmentNeeds: string;
        shootingLocation: string;
        rawFilePath: string;
    };
    design: {
        designTools: string;
        brandGuide: string;
        deliveryFormat: string;
    };
    general: {
        notes: string;
    };
}

export interface ProjectCreatePanelState {
    name: string;
    description: string;
    clientId: string;
    departmentId: string;
    status: string;
    priority: PriorityLevel;
    isPrivate: boolean;
    startDate: string;
    deadline: string;
    budget: string;
    teamSize: string;
    tags: string;
    projectManagerId: string;
    teamLeadId: string;
    personnelSearch: string;
    assignedPersonnelIds: string[];
    departmentDetails: DepartmentDetailsState;
}
