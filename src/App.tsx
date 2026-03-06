
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

function App() {
  return (
    <Routes>
      {/* Tanıtım / public alan ileride eklenecek */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/app/first-login" element={<FirstLoginPage />} />

      {/* Panel — AppLayout ile sarmalanmış tüm /app/* sayfaları */}
      <Route path="/app" element={<AppLayout />}>
        <Route path="dashboard" element={<div>Dashboard Paneli</div>} />
        <Route path="personel" element={<PersonnelPage />} />
        <Route path="projeler" element={<ProjectsPage />} />
        <Route path="projeler/yeni" element={<Navigate to="/app/projeler" replace />} />
        <Route path="projeler/:projectId" element={<ProjectDetailPage />} />
        <Route path="gorevler" element={<TasksPage />} />
        <Route path="gorevler/:taskId" element={<TaskDetailPage />} />
        <Route path="departmanlar" element={<DepartmentsPage />} />
        <Route path="time-tracker" element={<TimeTrackerPage />} />
        <Route path="roller" element={<RolesPermissionsPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="*" element={<div>Yapım Aşamasında</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
