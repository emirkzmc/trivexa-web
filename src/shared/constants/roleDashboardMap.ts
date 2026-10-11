import { ROLES } from './roles';

export const ROLE_DASHBOARD_MAP: Record<string, string> = {
    [ROLES.CEO]: '/app/dashboard',
    [ROLES.MANAGER]: '/app/dashboard',
    [ROLES.ACCOUNTING]: '/app/dashboard',
    [ROLES.DEVELOPER]: '/app/dashboard',
    [ROLES.SOCIAL_MEDIA]: '/app/dashboard',
    [ROLES.CREATIVE]: '/app/dashboard',
    [ROLES.MARKETING]: '/app/dashboard',
    [ROLES.PRODUCTION]: '/app/dashboard',
    [ROLES.ACCOUNT_MANAGER]: '/app/dashboard',
    [ROLES.HR]: '/app/dashboard',
    [ROLES.CLIENT]: '/customer-panel/dashboard',
    [ROLES.ADMIN]: '/app/dashboard',
};
