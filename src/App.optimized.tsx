import './App.css';
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FeatureFlagService } from './shared/services/feature-flag.service';
import { LoadingFallback } from './shared/components/LoadingFallback';
import { RouteErrorBoundary } from './shared/components/RouteErrorBoundary';

// ============================================
// EAGER LOADED (Critical - Always needed)
// ============================================
import { AppLayout } from './shared/components/AppLayout';
import { NotFoundPage } from './shared/components/NotFoundPage';

// ============================================
// LAZY LOADED - Auth & Landing
// ============================================
const LandingPage = lazy(() => import('./features/landing/components/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginForm = lazy(() => import('./features/auth/components/LoginForm').then(m => ({ default: m.LoginForm })));
const DemoLogin = lazy(() => import('./features/auth/components/DemoLogin').then(m => ({ default: m.DemoLogin })));
const FirstLoginPage = lazy(() => import('./features/auth/components/FirstLoginPage').then(m => ({ default: m.FirstLoginPage })));

// ============================================
// LAZY LOADED - Customer Panel
// ============================================
const CustomerPanelLayout = lazy(() => import('./features/customer-panel/components/CustomerPanelLayout').then(m => ({ default: m.CustomerPanelLayout })));
const CustomerPanelDashboardPage = lazy(() => import('./features/customer-panel/components/CustomerPanelDashboardPage').then(m => ({ default: m.CustomerPanelDashboardPage })));
const CustomerPanelProjectsPage = lazy(() => import('./features/customer-panel/components/CustomerPanelProjectsPage').then(m => ({ default: m.CustomerPanelProjectsPage })));
const CustomerPanelProjectDetailPage = lazy(() => import('./features/customer-panel/components/CustomerPanelProjectDetailPage').then(m => ({ default: m.CustomerPanelProjectDetailPage })));
const CustomerPanelContractsPage = lazy(() => import('./features/customer-panel/components/CustomerPanelContractsPage').then(m => ({ default: m.CustomerPanelContractsPage })));
const CustomerPanelPlaceholderPage = lazy(() => import('./features/customer-panel/components/CustomerPanelPlaceholderPage').then(m => ({ default: m.CustomerPanelPlaceholderPage })));

// ============================================
// LAZY LOADED - Dashboard & Core
// ============================================
const AdminDashboardPage = lazy(() => import('./features/dashboard/components/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const NotificationsPage = lazy(() => import('./features/notifications/components/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

// ============================================
// LAZY LOADED - Personnel & HR
// ============================================
const PersonnelPage = lazy(() => import('./features/personnel/components/PersonnelPage').then(m => ({ default: m.PersonnelPage })));
const DepartmentsPage = lazy(() => import('./features/departments/components/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const DepartmentAssignmentsPage = lazy(() => import('./features/departments/components/DepartmentAssignmentsPage').then(m => ({ default: m.DepartmentAssignmentsPage })));
const LeaveManagementPage = lazy(() => import('./features/leave-management/components/LeaveManagementPage').then(m => ({ default: m.LeaveManagementPage })));
const WorkingHoursPage = lazy(() => import('./features/working-hours/components/WorkingHoursPage').then(m => ({ default: m.WorkingHoursPage })));
const PerformancePage = lazy(() => import('./features/performance/components/PerformancePage').then(m => ({ default: m.PerformancePage })));

// ============================================
// LAZY LOADED - Projects & Tasks
// ============================================
const ProjectsPage = lazy(() => import('./features/projects/components/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('./features/projects/components/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const TasksPage = lazy(() => import('./features/tasks/components/TasksPage').then(m => ({ default: m.TasksPage })));
const TaskDetailPage = lazy(() => import('./features/tasks/components/TaskDetailPage').then(m => ({ default: m.TaskDetailPage })));

// ============================================
// LAZY LOADED - Workflow Pages
// ============================================
const CodeProcessesPage = lazy(() => import('./features/code-processes/components/CodeProcessesPage').then(m => ({ default: m.CodeProcessesPage })));
const ContentPlanPage = lazy(() => import('./features/content-plan/components/ContentPlanPage').then(m => ({ default: m.ContentPlanPage })));
const CampaignsPage = lazy(() => import('./features/campaigns/components/CampaignsPage').then(m => ({ default: m.CampaignsPage })));
const DesignProcessesPage = lazy(() => import('./features/design-processes/components/DesignProcessesPage').then(m => ({ default: m.DesignProcessesPage })));
const ProductionProcessesPage = lazy(() => import('./features/production-processes/components/ProductionProcessesPage').then(m => ({ default: m.ProductionProcessesPage })));

// ============================================
// LAZY LOADED - Clients
// ============================================
const ClientsPage = lazy(() => import('./features/clients/components/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import('./features/clients/components/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));

// ============================================
// LAZY LOADED - Finance
// ============================================
const CashflowDashboardPage = lazy(() => import('./features/finance/components/CashflowDashboardPage').then(m => ({ default: m.CashflowDashboardPage })));
const InvoicesPage = lazy(() => import('./features/finance/components/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const InvoiceDetailPage = lazy(() => import('./features/finance/components/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const CollectionTrackingPage = lazy(() => import('./features/finance/components/CollectionTrackingPage').then(m => ({ default: m.CollectionTrackingPage })));
const ExpenseManagementPage = lazy(() => import('./features/finance/components/ExpenseManagementPage').then(m => ({ default: m.ExpenseManagementPage })));
const PayrollAttendancePage = lazy(() => import('./features/finance/components/PayrollAttendancePage').then(m => ({ default: m.PayrollAttendancePage })));
const BankReconciliationPage = lazy(() => import('./features/finance/components/BankReconciliationPage').then(m => ({ default: m.BankReconciliationPage })));
const CustomerStatementPage = lazy(() => import('./features/finance/components/CustomerStatementPage').then(m => ({ default: m.CustomerStatementPage })));
const TaxDeclarationPrepPage = lazy(() => import('./features/finance/components/TaxDeclarationPrepPage').then(m => ({ default: m.TaxDeclarationPrepPage })));
const ContractsPage = lazy(() => import('./features/contracts/components/ContractsPage').then(m => ({ default: m.ContractsPage })));

// ============================================
// LAZY LOADED - Support & Tickets
// ============================================
const SupportRequestsPage = lazy(() => import('./features/tickets/components/SupportRequestsPage').then(m => ({ default: m.SupportRequestsPage })));
const SupportRequestDetailPage = lazy(() => import('./features/tickets/components/SupportRequestDetailPage').then(m => ({ default: m.SupportRequestDetailPage })));

// ============================================
// LAZY LOADED - Meetings
// ============================================
const MeetingsPage = lazy(() => import('./features/meetings/components/MeetingsPage').then(m => ({ default: m.MeetingsPage })));
const MeetingDetailPage = lazy(() => import('./features/meetings/components/MeetingDetailPage').then(m => ({ default: m.MeetingDetailPage })));
const MeetingsCalendarPage = lazy(() => import('./features/meetings/components/MeetingsCalendarPage').then(m => ({ default: m.MeetingsCalendarPage })));

// ============================================
// LAZY LOADED - Files & Time Tracking
// ============================================
const FilesManagementPage = lazy(() => import('./features/files/components/FilesManagementPage').then(m => ({ default: m.FilesManagementPage })));
const TimeTrackerPage = lazy(() => import('./features/time-tracker/components/TimeTrackerPage').then(m => ({ default: m.TimeTrackerPage })));

// ============================================
// LAZY LOADED - Admin & Settings
// ============================================
const RolesPermissionsPage = lazy(() => import('./features/roles/components/RolesPermissionsPage').then(m => ({ default: m.RolesPermissionsPage })));
const AuditLogPage = lazy(() => import('./features/audit/components/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const SettingsPage = lazy(() => import('./features/settings/components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UserSettingsPage = lazy(() => import('./features/profile/components/UserSettingsPage').then(m => ({ default: m.UserSettingsPage })));

function App() {
  const isDemo = FeatureFlagService.isEnabled('DEMO_MODE');

  return (
    <RouteErrorBoundary>
      <Routes>
        {/* Landing / Public */}
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LandingPage />
            </Suspense>
          }
        />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              {isDemo ? <Navigate to="/demo-login" replace /> : <LoginForm />}
            </Suspense>
          }
        />
        <Route
          path="/demo-login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              {isDemo ? <DemoLogin /> : <Navigate to="/login" replace />}
            </Suspense>
          }
        />
        <Route
          path="/app/first-login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FirstLoginPage />
            </Suspense>
          }
        />

        {/* Customer Panel */}
        <Route
          path="/customer-panel"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CustomerPanelLayout />
            </Suspense>
          }
        >
          <Route index element={<Navigate to="/customer-panel/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CustomerPanelDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="projeler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CustomerPanelProjectsPage />
              </Suspense>
            }
          />
          <Route
            path="projeler/:projectId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CustomerPanelProjectDetailPage />
              </Suspense>
            }
          />
          <Route
            path="kontratlarim"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CustomerPanelContractsPage />
              </Suspense>
            }
          />
          <Route
            path="talepler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CustomerPanelPlaceholderPage
                  title="Taleplerim"
                  description="Musteri talepleri listesi ve yeni talep olusturma adimi bu alanda devam edecek."
                />
              </Suspense>
            }
          />
          <Route
            path="onaylar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CustomerPanelPlaceholderPage
                  title="Onaylar"
                  description="Musteriden onay bekleyen kayitlarin yonetimi bu alana eklenecek."
                />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/app" element={<AppLayout />}>
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="notifications"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <NotificationsPage />
              </Suspense>
            }
          />

          {/* Personnel & HR */}
          <Route
            path="personel"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PersonnelPage />
              </Suspense>
            }
          />
          <Route
            path="departmanlar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <DepartmentsPage />
              </Suspense>
            }
          />
          <Route
            path="departman-atamalari"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <DepartmentAssignmentsPage />
              </Suspense>
            }
          />
          <Route
            path="izin-yonetimi"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LeaveManagementPage />
              </Suspense>
            }
          />
          <Route
            path="calisma-suresi"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <WorkingHoursPage />
              </Suspense>
            }
          />
          <Route
            path="performans"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PerformancePage />
              </Suspense>
            }
          />

          {/* Projects & Tasks */}
          <Route
            path="projeler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ProjectsPage />
              </Suspense>
            }
          />
          <Route path="projelerim" element={<Navigate to="/app/projeler" replace />} />
          <Route path="projeler/yeni" element={<Navigate to="/app/projeler" replace />} />
          <Route
            path="projeler/:projectId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ProjectDetailPage />
              </Suspense>
            }
          />
          <Route
            path="gorevler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <TasksPage />
              </Suspense>
            }
          />
          <Route path="gorevlerim" element={<Navigate to="/app/gorevler" replace />} />
          <Route
            path="gorevler/:taskId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <TaskDetailPage />
              </Suspense>
            }
          />

          {/* Workflow Pages */}
          <Route
            path="kod"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CodeProcessesPage />
              </Suspense>
            }
          />
          <Route
            path="icerik-plani"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ContentPlanPage />
              </Suspense>
            }
          />
          <Route
            path="kampanyalar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CampaignsPage />
              </Suspense>
            }
          />
          <Route
            path="tasarim"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <DesignProcessesPage />
              </Suspense>
            }
          />
          <Route
            path="produksiyon"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ProductionProcessesPage />
              </Suspense>
            }
          />

          {/* Support */}
          <Route
            path="talepler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SupportRequestsPage />
              </Suspense>
            }
          />
          <Route
            path="talepler/:requestId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SupportRequestDetailPage />
              </Suspense>
            }
          />

          {/* Meetings */}
          <Route
            path="personel-toplantilari"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <MeetingsCalendarPage />
              </Suspense>
            }
          />
          <Route
            path="gorusmeler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <MeetingsPage />
              </Suspense>
            }
          />
          <Route
            path="gorusmeler/:meetingId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <MeetingDetailPage />
              </Suspense>
            }
          />
          <Route
            path="toplanti-takvimi"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <MeetingsCalendarPage />
              </Suspense>
            }
          />

          {/* Clients */}
          <Route
            path="musteriler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ClientsPage />
              </Suspense>
            }
          />
          <Route
            path="musteriler/:clientId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ClientDetailPage />
              </Suspense>
            }
          />
          <Route path="musterilerim" element={<Navigate to="/app/musteriler" replace />} />

          {/* Finance */}
          <Route
            path="finans"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CashflowDashboardPage />
              </Suspense>
            }
          />
          <Route path="finans-dashboard" element={<Navigate to="/app/finans" replace />} />
          <Route
            path="sozlesmeler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ContractsPage />
              </Suspense>
            }
          />
          <Route
            path="faturalar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InvoicesPage />
              </Suspense>
            }
          />
          <Route
            path="faturalar/:invoiceId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InvoiceDetailPage />
              </Suspense>
            }
          />
          <Route
            path="tahsilat-takibi"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CollectionTrackingPage />
              </Suspense>
            }
          />
          <Route
            path="gider-yonetimi"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ExpenseManagementPage />
              </Suspense>
            }
          />
          <Route
            path="puantaj"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PayrollAttendancePage />
              </Suspense>
            }
          />
          <Route
            path="banka-mutabakat"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <BankReconciliationPage />
              </Suspense>
            }
          />
          <Route
            path="musteri-ekstresi"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CustomerStatementPage />
              </Suspense>
            }
          />
          <Route
            path="vergi-beyan"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <TaxDeclarationPrepPage />
              </Suspense>
            }
          />

          {/* Files & Time */}
          <Route
            path="dosyalar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <FilesManagementPage />
              </Suspense>
            }
          />
          <Route path="dosyalarim" element={<FilesManagementPage />} />
          <Route
            path="time-tracker"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <TimeTrackerPage />
              </Suspense>
            }
          />

          {/* Admin & Settings */}
          <Route
            path="roller"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <RolesPermissionsPage />
              </Suspense>
            }
          />
          <Route
            path="audit-log"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AuditLogPage />
              </Suspense>
            }
          />
          <Route
            path="ayarlar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="hesabim"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <UserSettingsPage />
              </Suspense>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RouteErrorBoundary>
  );
}

export default App;
