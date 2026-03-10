
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './features/auth/components/LoginForm';
import { FirstLoginPage } from './features/auth/components/FirstLoginPage';
import { AppLayout } from './shared/components/AppLayout';
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
import { SupportRequestsPage } from './features/tickets/components/SupportRequestsPage';
import { CustomerStatementPage } from './features/finance/components/CustomerStatementPage';
import { BankReconciliationPage } from './features/finance/components/BankReconciliationPage';
import { TaxDeclarationPrepPage } from './features/finance/components/TaxDeclarationPrepPage';
import { MeetingsPage } from './features/meetings/components/MeetingsPage';
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

function App() {
  return (
    <Routes>
      {/* TanÄ±tÄ±m / public alan ileride eklenecek */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<LoginForm />} />
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
        <Route path="*" element={<Navigate to="/customer-panel/dashboard" replace />} />
      </Route>

      {/* Panel â€” AppLayout ile sarmalanmÄ±ÅŸ tÃ¼m /app/* sayfalarÄ± */}
      <Route path="/app" element={<AppLayout />}>
        <Route path="dashboard" element={<div>Dashboard Paneli</div>} />
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
        <Route path="personel-toplantilari" element={<MeetingsCalendarPage />} />
        <Route path="gorusmeler" element={<MeetingsPage />} />
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
        <Route path="*" element={<div>YapÄ±m AÅŸamasÄ±nda</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;


