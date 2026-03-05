
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './features/auth/components/LoginForm';
import { FirstLoginPage } from './features/auth/components/FirstLoginPage';
import { AppLayout } from './shared/components/AppLayout';

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
        <Route path="*" element={<div>Yapım Aşamasında</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
