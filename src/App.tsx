
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './features/auth/components/LoginForm';
import { FirstLoginPage } from './features/auth/components/FirstLoginPage';
import { SidebarPreviewPage } from './shared/components/SidebarPreviewPage'; // 🗑️ GEÇİCİ

function App() {
  return (
    <Routes>
      {/* Tanıtım / public alan ileride eklenecek */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/app/first-login" element={<FirstLoginPage />} />

      {/* Dashboard placeholder - gerçek layout/guard daha sonra eklenecek */}
      <Route
        path="/app/dashboard/*"
        element={<div>Dashboard (placeholder)</div>}
      />

      {/* 🗑️ GEÇİCİ — Sidebar preview */}
      <Route path="/app/sidebar-preview" element={<SidebarPreviewPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
