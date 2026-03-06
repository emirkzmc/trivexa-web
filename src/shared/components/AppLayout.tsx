import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useActiveTimer } from '../../features/time-tracker/hooks/useActiveTimer';
import { useStopTimer } from '../../features/time-tracker/hooks/useTimerMutations';
import { DraggableActiveTimer } from '../../features/time-tracker/components/DraggableActiveTimer';

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
    '/app/roller': 'Roller ve Izinler',
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

const MOBILE_BREAKPOINT = 768;

export function AppLayout() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const location = useLocation();
    const activeTimerQuery = useActiveTimer();
    const stopMutation = useStopTimer();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const onResize = () => {
            const nextIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(nextIsMobile);
            if (!nextIsMobile) {
                setMobileSidebarOpen(false);
            }
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

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

    function handleGlobalStopTimer() {
        if (activeTimerQuery.isActive) {
            stopMutation.mutate();
        }
    }

    const activeProjectName = activeTimerQuery.timer?.projectName
        ?? activeTimerQuery.timer?.projectId
        ?? 'Proje secilmedi';

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {isMobile && mobileSidebarOpen && (
                <div
                    role="button"
                    aria-label="Menüyü kapat"
                    onClick={() => setMobileSidebarOpen(false)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            setMobileSidebarOpen(false);
                        }
                    }}
                    tabIndex={0}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.35)',
                        zIndex: 50,
                    }}
                />
            )}

            <Sidebar
                isMobile={isMobile}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <AppHeader
                    pageName={pageName}
                    user={headerUser}
                    onLogout={handleLogout}
                    showMenuButton={isMobile}
                    onMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
                />
                <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#F9FAFB' }}>
                    <Outlet />
                </main>
            </div>
            <DraggableActiveTimer
                visible={activeTimerQuery.isActive}
                elapsedSeconds={activeTimerQuery.elapsed}
                projectName={activeProjectName}
                onStop={handleGlobalStopTimer}
                isStopping={stopMutation.isPending}
            />
        </div>
    );
}
