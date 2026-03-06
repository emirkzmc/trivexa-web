import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useActiveTimer } from '../../features/time-tracker/hooks/useActiveTimer';
import { useStopTimer } from '../../features/time-tracker/hooks/useTimerMutations';
import { DraggableActiveTimer } from '../../features/time-tracker/components/DraggableActiveTimer';
import { NAV_CONFIG } from '../constants/navConfig';
import { buildRoleAccentPalette } from '../utils/colorTheme';

const PAGE_NAMES: Record<string, string> = {
    '/app/dashboard': 'Dashboard',
    '/app/notifications': 'Bildirimler',
    '/app/personel': 'Personel Yonetimi',
    '/app/departmanlar': 'Departmanlar',
    '/app/musteriler': 'Musteri Yonetimi',
    '/app/projeler': 'Projeler',
    '/app/gorevler': 'Gorev Yonetimi',
    '/app/time-tracker': 'Time Tracker',
    '/app/finans': 'Finansal Raporlar',
    '/app/sozlesmeler': 'Sozlesmeler',
    '/app/dosyalar': 'Dosya Yonetimi',
    '/app/roller': 'Roller ve Izinler',
    '/app/audit-log': 'Audit Log',
    '/app/ayarlar': 'Ayarlar',
    '/app/faturalar': 'Fatura Yonetimi',
    '/app/musterilerim': 'Musterilerim',
    '/app/yeni-talepler': 'Yeni Talepler',
    '/app/briefler': 'Brief Yonetimi',
    '/app/on-onay': 'On Onay Paneli',
    '/app/gorusmeler': 'Gorusme Yonetimi',
    '/app/gorevlerim': 'Gorevlerim',
    '/app/projelerim': 'Projelerim',
    '/app/kod': 'Kod Surecleri',
    '/app/dosyalarim': 'Dosyalarim',
    '/app/icerik-plani': 'Icerik Planlari',
    '/app/kampanyalar': 'Kampanya Yonetimi',
    '/app/tasarim': 'Tasarim Surecleri',
    '/app/produksiyon': 'Produksiyon Surecleri',
    '/app/departman-atamalari': 'Departman Atamalari',
    '/app/izin-yonetimi': 'Izin Yonetimi',
    '/app/calisma-suresi': 'Calisma Suresi',
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
    const roleAccent = useMemo(() => {
        if (!user?.role) return '#DC2626';
        return NAV_CONFIG[user.role]?.theme.accent ?? '#DC2626';
    }, [user?.role]);
    const rolePalette = useMemo(() => buildRoleAccentPalette(roleAccent), [roleAccent]);
    const layoutStyle = useMemo<CSSProperties>(
        () => ({
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
        }),
        [],
    );

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

    useEffect(() => {
        const root = document.documentElement;
        const vars: Record<string, string> = {
            '--role-accent': rolePalette.accent500,
            '--role-accent-50': rolePalette.accent50,
            '--role-accent-100': rolePalette.accent100,
            '--role-accent-200': rolePalette.accent200,
            '--role-accent-300': rolePalette.accent300,
            '--role-accent-400': rolePalette.accent400,
            '--role-accent-500': rolePalette.accent500,
            '--role-accent-600': rolePalette.accent600,
            '--role-accent-700': rolePalette.accent700,
            '--role-accent-800': rolePalette.accent800,
            '--role-accent-rgb': rolePalette.rgbChannels,
            '--role-accent-soft': rolePalette.accentSoft,
            '--role-accent-border': rolePalette.accentBorder,
            '--role-accent-shadow': rolePalette.accentShadow,
            '--role-gradient-from': rolePalette.gradientFrom,
            '--role-gradient-mid': rolePalette.gradientMid,
            '--role-gradient-to': rolePalette.gradientTo,
        };

        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }, [rolePalette]);

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
        <div style={layoutStyle}>
            {isMobile && mobileSidebarOpen && (
                <div
                    role="button"
                    aria-label="Menuyu kapat"
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
