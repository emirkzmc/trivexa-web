import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { useAuthStore } from '../../features/auth/store/authStore';

const PAGE_NAMES: Record<string, string> = {
    '/app/dashboard': 'Dashboard',
    '/app/notifications': 'Bildirimler',
    '/app/personel': 'Personel Yönetimi',
    '/app/musteriler': 'Müşteri Yönetimi',
    '/app/projeler': 'Projeler',
    '/app/gorevler': 'Görev Yönetimi',
    '/app/time-tracker': 'Time Tracker',
    '/app/finans': 'Finansal Raporlar',
    '/app/sozlesmeler': 'Sözleşmeler',
    '/app/dosyalar': 'Dosya Yönetimi',
    '/app/audit-log': 'Audit Log',
    '/app/ayarlar': 'Ayarlar',
    '/app/faturalar': 'Fatura Yönetimi',
    '/app/musterilerim': 'Müşterilerim',
    '/app/yeni-talepler': 'Yeni Talepler',
    '/app/briefler': 'Brief Yönetimi',
    '/app/on-onay': 'Ön Onay Paneli',
    '/app/gorusmeler': 'Görüşme Yönetimi',
    '/app/gorevlerim': 'Görevlerim',
    '/app/projelerim': 'Projelerim',
    '/app/kod': 'Kod Süreçleri',
    '/app/dosyalarim': 'Dosyalarım',
    '/app/icerik-plani': 'İçerik Planları',
    '/app/kampanyalar': 'Kampanya Yönetimi',
    '/app/tasarim': 'Tasarım Süreçleri',
    '/app/produksiyon': 'Prodüksiyon Süreçleri',
    '/app/departman-atamalari': 'Departman Atamaları',
    '/app/izin-yonetimi': 'İzin Yönetimi',
    '/app/calisma-suresi': 'Çalışma Süresi',
    '/app/performans': 'Performans',
};

function resolvePageName(pathname: string): string {
    return PAGE_NAMES[pathname] ?? 'Dashboard';
}

export function AppLayout() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    const pageName = resolvePageName(location.pathname);

    const headerUser = {
        name: user.name ?? '',
        initials: (user.name ?? '?').charAt(0).toUpperCase(),
        role: user.role ?? '',
    };

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <AppHeader
                    pageName={pageName}
                    user={headerUser}
                    onLogout={handleLogout}
                />
                <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#F9FAFB' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
