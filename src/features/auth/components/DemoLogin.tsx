import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/auth.api';
import { ROLE_DASHBOARD_MAP } from '../../../shared/constants/roleDashboardMap';
import { normalizeRoleKey } from '../../../shared/utils/roleUtils';

const DEMO_USERS = [
  {
    roleName: 'Yönetici (Admin)',
    email: 'demoadmin@trivexa.com',
    description: 'Tüm modüllere tam erişim yetkisi.',
    color: 'bg-indigo-600',
  },
  {
    roleName: 'Muhasebe (Accounting)',
    email: 'demomuhasebe@trivexa.com',
    description: 'Fatura, gelir-gider ve finansal raporlar.',
    color: 'bg-emerald-600',
  },
  {
    roleName: 'Proje Yöneticisi',
    email: 'demoproje@trivexa.com',
    description: 'Projeler, görevler ve ekip koordinasyonu.',
    color: 'bg-blue-600',
  },
  {
    roleName: 'İnsan Kaynakları',
    email: 'demoik@trivexa.com',
    description: 'Personel, izinler ve performans takibi.',
    color: 'bg-pink-600',
  },
  {
    roleName: 'Müşteri (Customer)',
    email: 'customer@demo.com',
    description: 'Projeleri, görevleri ve faturaları izleme.',
    color: 'bg-teal-600',
  },
];

export const DemoLogin: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (email: string) => {
    if (email === 'customer@demo.com') {
      window.location.href = 'http://localhost:3001/customer-login?email=customer@demo.com&autologin=true';
      return;
    }

    setLoadingEmail(email);
    setError(null);
    try {
      // Demo kullanıcılarının şifresi seed dosyasında 'password123' olarak belirlendi
      const response = await authApi.login({ email, password: 'password123' });
      
      const { accessToken, refreshToken, user } = response.data;
      
      const authUser = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl ?? null,
        avatarFit: user.avatarFit ?? null,
        avatarPosition: user.avatarPosition ?? null,
      };

      setAuth(
        accessToken,
        refreshToken,
        authUser
      );

      const normalizedRole = normalizeRoleKey(user.role);
      const targetRoute = ROLE_DASHBOARD_MAP[user.role]
        || ROLE_DASHBOARD_MAP[normalizedRole]
        || "/app/dashboard";
      
      navigate(targetRoute, { replace: true });
    } catch (err: any) {
      setError('Giriş başarısız oldu. Lütfen veritabanı Seed işleminin yapıldığından emin olun.');
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Demo Moduna Hoş Geldiniz
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Lütfen deneyimlemek istediğiniz departmanı (rolü) seçin.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DEMO_USERS.map((user) => (
              <div
                key={user.email}
                onClick={() => !loadingEmail && handleDemoLogin(user.email)}
                className={`relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                  loadingEmail === user.email ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${user.color}`}>
                    <span className="text-white font-medium text-lg">
                      {user.roleName.charAt(0)}
                    </span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">{user.roleName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.description}</p>
                </div>
                {loadingEmail === user.email && (
                  <div className="absolute top-2 right-2">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <a
              href="/"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              &larr; Demo Bilgi Sayfasına Dön
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
