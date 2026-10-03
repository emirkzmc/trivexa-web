
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './features/auth/components/LoginForm';
import { DemoLogin } from './features/auth/components/DemoLogin';
import { FirstLoginPage } from './features/auth/components/FirstLoginPage';
import { AppLayout } from './shared/components/AppLayout';
import { FeatureFlagService } from './shared/services/feature-flag.service';
import { PersonnelPage } from './features/personnel/components/PersonnelPage';
import { TimeTrackerPage } from './features/time-tracker/components/TimeTrackerPage';
import { AuditLogPage } from './features/audit/components/AuditLogPage';
import { RolesPermissionsPage } from './features/roles/components/RolesPermissionsPage';
import { DepartmentsPage } from './features/departments/components/DepartmentsPage';
import { ProjectsPage } from './features/projects/components/ProjectsPage';
import { ProjectDetailPage } from './features/projects/components/ProjectDetailPage';
import { TasksPage } from './features/tasks/components/TasksPage';
import { TaskDetailPage } from './features/tasks/components/TaskDetailPage';
import { NotificationsPage } from './features/notifications/components/NotificationsPage';
import { ClientsPage } from './features/clients/components/ClientsPage';
import { ClientDetailPage } from './features/clients/components/ClientDetailPage';
import { InvoicesPage } from './features/finance/components/InvoicesPage';
import { InvoiceDetailPage } from './features/finance/components/InvoiceDetailPage';
import { CollectionTrackingPage } from './features/finance/components/CollectionTrackingPage';
import { ExpenseManagementPage } from './features/finance/components/ExpenseManagementPage';
import { CashflowDashboardPage } from './features/finance/components/CashflowDashboardPage';
import { PayrollAttendancePage } from './features/finance/components/PayrollAttendancePage';
import { AdminDashboardPage } from './features/dashboard/components/AdminDashboardPage';
import { SupportRequestsPage } from './features/tickets/components/SupportRequestsPage';
import { SupportRequestDetailPage } from './features/tickets/components/SupportRequestDetailPage';
import { CustomerStatementPage } from './features/finance/components/CustomerStatementPage';
import { BankReconciliationPage } from './features/finance/components/BankReconciliationPage';
import { TaxDeclarationPrepPage } from './features/finance/components/TaxDeclarationPrepPage';
import { MeetingsPage } from './features/meetings/components/MeetingsPage';
import { MeetingDetailPage } from './features/meetings/components/MeetingDetailPage';
import { FilesManagementPage } from './features/files/components/FilesManagementPage';
import { MeetingsCalendarPage } from './features/meetings/components/MeetingsCalendarPage';
import { CustomerPanelLayout } from './features/customer-panel/components/CustomerPanelLayout';
import { CustomerPanelDashboardPage } from './features/customer-panel/components/CustomerPanelDashboardPage';
import { CustomerPanelPlaceholderPage } from './features/customer-panel/components/CustomerPanelPlaceholderPage';
import { CustomerPanelContractsPage } from './features/customer-panel/components/CustomerPanelContractsPage';
import { CustomerPanelProjectsPage } from './features/customer-panel/components/CustomerPanelProjectsPage';
import { CustomerPanelProjectDetailPage } from './features/customer-panel/components/CustomerPanelProjectDetailPage';
import { CodeProcessesPage } from './features/code-processes/components/CodeProcessesPage';
import { DepartmentAssignmentsPage } from './features/departments/components/DepartmentAssignmentsPage';
import { LeaveManagementPage } from './features/leave-management/components/LeaveManagementPage';
import { ContentPlanPage } from './features/content-plan/components/ContentPlanPage';
import { CampaignsPage } from './features/campaigns/components/CampaignsPage';
import { DesignProcessesPage } from './features/design-processes/components/DesignProcessesPage';
import { ProductionProcessesPage } from './features/production-processes/components/ProductionProcessesPage';
import { WorkingHoursPage } from './features/working-hours/components/WorkingHoursPage';
import { PerformancePage } from './features/performance/components/PerformancePage';
import { ContractsPage } from './features/contracts/components/ContractsPage';
import { SettingsPage } from './features/settings/components/SettingsPage';
import { UserSettingsPage } from './features/profile/components/UserSettingsPage';
import { NotFoundPage } from './shared/components/NotFoundPage';

function App() {
  const isDemo = FeatureFlagService.isEnabled('DEMO_MODE');

  return (
    <Routes>
      {/* Tanıtım / public alan ileride eklenecek */}
      <Route path="/" element={<Navigate to={isDemo ? "/demo-login" : "/login"} replace />} />

      {/* Auth */}
      <Route 
        path="/login" 
        element={isDemo ? <Navigate to="/demo-login" replace /> : <LoginForm />} 
      />
      <Route 
        path="/demo-login" 
        element={isDemo ? <DemoLogin /> : <Navigate to="/login" replace />} 
      />
      <Route path="/app/first-login" element={<FirstLoginPage />} />

      <Route path="/customer-panel" element={<CustomerPanelLayout />}>
        <Route index element={<Navigate to="/customer-panel/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerPanelDashboardPage />} />
        <Route path="projeler" element={<CustomerPanelProjectsPage />} />
        <Route path="projeler/:projectId" element={<CustomerPanelProjectDetailPage />} />
        <Route path="kontratlarim" element={<CustomerPanelContractsPage />} />
        <Route
          path="talepler"
          element={(
            <CustomerPanelPlaceholderPage
              title="Taleplerim"
              description="Musteri talepleri listesi ve yeni talep olusturma adimi bu alanda devam edecek."
            />
          )}
        />
        <Route
          path="onaylar"
          element={(
            <CustomerPanelPlaceholderPage
              title="Onaylar"
              description="Musteriden onay bekleyen kayitlarin yonetimi bu alana eklenecek."
            />
          )}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Panel — AppLayout ile sarmalanmış tüm /app/* sayfaları */}
      <Route path="/app" element={<AppLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="personel" element={<PersonnelPage />} />
        <Route path="projeler" element={<ProjectsPage />} />
        <Route path="projelerim" element={<Navigate to="/app/projeler" replace />} />
        <Route path="projeler/yeni" element={<Navigate to="/app/projeler" replace />} />
        <Route path="projeler/:projectId" element={<ProjectDetailPage />} />
        <Route path="gorevler" element={<TasksPage />} />
        <Route path="gorevlerim" element={<Navigate to="/app/gorevler" replace />} />
        <Route path="gorevler/:taskId" element={<TaskDetailPage />} />
        <Route path="kod" element={<CodeProcessesPage />} />
        <Route path="icerik-plani" element={<ContentPlanPage />} />
        <Route path="kampanyalar" element={<CampaignsPage />} />
        <Route path="tasarim" element={<DesignProcessesPage />} />
        <Route path="produksiyon" element={<ProductionProcessesPage />} />
        <Route path="talepler" element={<SupportRequestsPage />} />
        <Route path="talepler/:requestId" element={<SupportRequestDetailPage />} />
        <Route path="personel-toplantilari" element={<MeetingsCalendarPage />} />
        <Route path="gorusmeler" element={<MeetingsPage />} />
        <Route path="gorusmeler/:meetingId" element={<MeetingDetailPage />} />
        <Route path="departmanlar" element={<DepartmentsPage />} />
        <Route path="departman-atamalari" element={<DepartmentAssignmentsPage />} />
        <Route path="izin-yonetimi" element={<LeaveManagementPage />} />
        <Route path="calisma-suresi" element={<WorkingHoursPage />} />
        <Route path="performans" element={<PerformancePage />} />
        <Route path="musteriler" element={<ClientsPage />} />
        <Route path="musteriler/:clientId" element={<ClientDetailPage />} />
        <Route path="musterilerim" element={<Navigate to="/app/musteriler" replace />} />
        <Route path="finans" element={<CashflowDashboardPage />} />
        <Route path="finans-dashboard" element={<Navigate to="/app/finans" replace />} />
        <Route path="sozlesmeler" element={<ContractsPage />} />
        <Route path="faturalar" element={<InvoicesPage />} />
        <Route path="faturalar/:invoiceId" element={<InvoiceDetailPage />} />
        <Route
          path="tahsilat-takibi"
          element={<CollectionTrackingPage />}
        />
        <Route
          path="gider-yonetimi"
          element={<ExpenseManagementPage />}
        />
        <Route
          path="puantaj"
          element={<PayrollAttendancePage />}
        />
        <Route
          path="banka-mutabakat"
          element={<BankReconciliationPage />}
        />
        <Route
          path="musteri-ekstresi"
          element={<CustomerStatementPage />}
        />
        <Route
          path="vergi-beyan"
          element={<TaxDeclarationPrepPage />}
        />
        <Route path="toplanti-takvimi" element={<MeetingsCalendarPage />} />
        <Route path="dosyalar" element={<FilesManagementPage />} />
        <Route path="dosyalarim" element={<FilesManagementPage />} />
        <Route path="time-tracker" element={<TimeTrackerPage />} />
        <Route path="roller" element={<RolesPermissionsPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="ayarlar" element={<SettingsPage />} />
        <Route path="hesabim" element={<UserSettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;



