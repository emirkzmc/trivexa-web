import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BellRing } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useActiveTimer } from '../../features/time-tracker/hooks/useActiveTimer';
import { useStopTimer } from '../../features/time-tracker/hooks/useTimerMutations';
import { DraggableActiveTimer } from '../../features/time-tracker/components/DraggableActiveTimer';
import { NAV_CONFIG } from '../constants/navConfig';
import { buildRoleAccentPalette } from '../utils/colorTheme';
import { normalizeRoleKey } from '../utils/roleUtils';

interface PresenceUser {
    userId: string;
    email: string;
    displayName?: string;
    currentPath: string;
}

interface GlobalPresenceUpdatePayload {
    activeUsers?: PresenceUser[];
}

const PAGE_NAMES: Record<string, string> = {
    '/app/dashboard': 'Dashboard',
    '/app/notifications': 'Bildirimler',
    '/app/personel': 'Personel Yönetimi',
    '/app/departmanlar': 'Departmanlar',
    '/app/musteriler': 'Müşteri Yönetimi',
    '/app/projeler': 'Projeler',
    '/app/gorevler': 'Görev Yönetimi',
    '/app/time-tracker': 'Time Tracker',
    '/app/talepler': 'Destek Talepleri',
    '/app/finans-dashboard': 'Finans Dashboard',
    '/app/finans': 'Finans Dashboard',
    '/app/tahsilat-takibi': 'Tahsilat Takibi',
    '/app/gider-yonetimi': 'Gider Yönetimi',
    '/app/puantaj': 'Puantaj ve Bordro',
    '/app/banka-mutabakat': 'Banka POS Mutabakat',
    '/app/musteri-ekstresi': 'Müşteri Hesap Ekstresi',
    '/app/vergi-beyan': 'Vergi Beyan Hazırlık',
    '/app/sozlesmeler': 'Sözleşmeler',
    '/app/dosyalar': 'Dosya Yönetimi',
    '/app/roller': 'Roller ve İzinler',
    '/app/audit-log': 'Audit Log',
    '/app/ayarlar': 'Ayarlar',
    '/app/hesabim': 'Hesap Ayarlari',
    '/app/faturalar': 'Fatura Yönetimi',
    '/app/musterilerim': 'Müşterilerim',
    '/app/iletisim-talepleri': 'Iletisim Talepleri',
    '/app/portal-talepleri': 'Portal Talepleri',
    '/app/gorusme-talepleri': 'Gorusme Talepleri',
    '/app/gorusmeler': 'Görüşme Yönetimi',
    '/app/personel-toplantilari': 'Personel Toplanti Plani',
    '/app/toplanti-takvimi': 'Personel Toplanti Plani',
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
    '/app/calisma-suresi': 'Çalışma Suresi',
    '/app/performans': 'Performans',
};

function resolvePageName(pathname: string): string {
    if (pathname === '/app/projeler/yeni') {
        return 'Yeni Proje';
    }
    if (pathname.startsWith('/app/projeler/')) {
        return 'Proje Detayı';
    }
    if (pathname.startsWith('/app/gorevler/')) {
        return 'Görev Detayı';
    }
    if (pathname.startsWith('/app/faturalar/')) {
        return 'Fatura Detayı';
    }
    return PAGE_NAMES[pathname] ?? 'Dashboard';
}

const MOBILE_BREAKPOINT = 768;

function resolveNotificationsSocketUrl(): string {
    const explicitUrl = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
    if (explicitUrl) {
        return explicitUrl;
    }

    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
    if (apiBaseUrl) {
        try {
            const parsed = new URL(apiBaseUrl);
            return `${parsed.protocol}//${parsed.host}`;
        } catch {
            // Fall back to current origin.
        }
    }

    return window.location.origin;
}

export function AppLayout() {
    const user = useAuthStore((s) => s.user);
    const token = useAuthStore((s) => s.token);
    const isFirstLogin = useAuthStore((s) => s.isFirstLogin);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const activeTimerQuery = useActiveTimer();
    const stopMutation = useStopTimer();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [liveNoticeText, setLiveNoticeText] = useState('');
    const [showLiveNotice, setShowLiveNotice] = useState(false);
    const [hasFreshNotification, setHasFreshNotification] = useState(false);
    const [activePresenceUsers, setActivePresenceUsers] = useState<PresenceUser[]>([]);
    const [isPresenceConnected, setIsPresenceConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const presenceSocketRef = useRef<Socket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioUnlockedRef = useRef(false);
    const noticeTimerRef = useRef<number | null>(null);
    const roleAccent = useMemo(() => {
        if (!user?.role) return '#DC2626';
        const normalizedRole = normalizeRoleKey(user.role);
        return NAV_CONFIG[user.role]?.theme.accent
            ?? NAV_CONFIG[normalizedRole]?.theme.accent
            ?? '#DC2626';
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

    function disconnectPresenceSocket() {
        const socket = presenceSocketRef.current;
        if (!socket) return;
        socket.emit('leaveGlobalPresence');
        socket.disconnect();
        presenceSocketRef.current = null;
        setIsPresenceConnected(false);
        setActivePresenceUsers([]);
    }

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

    function playNotificationTone() {
        try {
            if (!audioUnlockedRef.current) {
                return;
            }

            const audioContextCtor =
                window.AudioContext
                || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!audioContextCtor) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new audioContextCtor();
            }

            const ctx = audioContextRef.current;
            if (ctx.state !== 'running') {
                return;
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.value = 0.0001;
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } catch {
            // Audio may be blocked by browser permissions; fail silently.
        }
    }

    useEffect(() => {
        const unlockAudio = () => {
            try {
                audioUnlockedRef.current = true;
                const audioContextCtor =
                    window.AudioContext
                    || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (!audioContextCtor) return;
                if (!audioContextRef.current) {
                    audioContextRef.current = new audioContextCtor();
                }
                if (audioContextRef.current.state === 'suspended') {
                    void audioContextRef.current.resume();
                }
            } catch {
                // ignore
            }
        };

        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        return () => {
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    useEffect(() => {
        if (!user?.id || !token) return;

        let disposed = false;
        let notificationsSocket: Socket | null = null;
        const connectTimer = window.setTimeout(() => {
            if (disposed) return;

            const socketUrl = resolveNotificationsSocketUrl();
            const socket = io(`${socketUrl}/notifications`, {
                query: { token },
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionDelay: 1_000,
            });
            notificationsSocket = socket;
            socketRef.current = socket;

            socket.on('notification', (payload: unknown) => {
                const title =
                    typeof payload === 'object'
                    && payload !== null
                    && 'title' in payload
                    && typeof (payload as { title?: unknown }).title === 'string'
                        ? (payload as { title: string }).title
                        : '';

                void queryClient.invalidateQueries({ queryKey: ['notifications'] });
                void queryClient.invalidateQueries({ queryKey: ['unread-count'] });

                playNotificationTone();
                toast.info(title ? `Yeni bildiriminiz var: ${title}` : 'Yeni bildiriminiz var', {
                    duration: 3_500,
                });

                setLiveNoticeText('Yeni bildiriminiz var');
                setShowLiveNotice(true);
                setHasFreshNotification(true);

                if (noticeTimerRef.current) {
                    window.clearTimeout(noticeTimerRef.current);
                }
                noticeTimerRef.current = window.setTimeout(() => {
                    setShowLiveNotice(false);
                }, 3_500);
            });
        }, 0);

        return () => {
            disposed = true;
            window.clearTimeout(connectTimer);
            if (notificationsSocket) {
                notificationsSocket.disconnect();
                if (socketRef.current === notificationsSocket) {
                    socketRef.current = null;
                }
            }
        };
    }, [user?.id, token, queryClient]);

    useEffect(() => {
        if (!user?.id || !token) return;

        let disposed = false;
        let presenceSocket: Socket | null = null;
        const connectTimer = window.setTimeout(() => {
            if (disposed) return;

            const socketUrl = resolveNotificationsSocketUrl();
            const socket = io(`${socketUrl}/presence`, {
                auth: { token },
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionDelay: 1_000,
            });
            presenceSocket = socket;
            presenceSocketRef.current = socket;

            const handleGlobalActiveUsersUpdate = (payload: GlobalPresenceUpdatePayload) => {
                const users = Array.isArray(payload?.activeUsers)
                    ? payload.activeUsers.filter(
                        (presenceUser): presenceUser is PresenceUser =>
                            !!presenceUser
                            && typeof presenceUser.userId === 'string'
                            && typeof presenceUser.email === 'string'
                            && typeof presenceUser.currentPath === 'string',
                    )
                    : [];
                setActivePresenceUsers(users);
            };

            socket.on('connect', () => {
                setIsPresenceConnected(true);
                socket.emit('joinGlobalPresence', { currentPath: location.pathname });
            });
            socket.on('disconnect', () => {
                setIsPresenceConnected(false);
                setActivePresenceUsers([]);
            });
            socket.on('globalActiveUsersUpdate', handleGlobalActiveUsersUpdate);
        }, 0);

        return () => {
            disposed = true;
            window.clearTimeout(connectTimer);
            if (presenceSocket) {
                presenceSocket.emit('leaveGlobalPresence');
                presenceSocket.disconnect();
            }
            if (presenceSocketRef.current === presenceSocket) {
                presenceSocketRef.current = null;
            }
            setIsPresenceConnected(false);
            setActivePresenceUsers([]);
        };
    }, [user?.id, token]);

    useEffect(() => {
        const handlePageExit = () => {
            disconnectPresenceSocket();
        };

        window.addEventListener('beforeunload', handlePageExit);
        window.addEventListener('pagehide', handlePageExit);
        return () => {
            window.removeEventListener('beforeunload', handlePageExit);
            window.removeEventListener('pagehide', handlePageExit);
        };
    }, []);

    useEffect(() => {
        if (!isPresenceConnected) return;
        const socket = presenceSocketRef.current;
        if (!socket) return;
        socket.emit('updateGlobalPresencePath', { currentPath: location.pathname });
    }, [isPresenceConnected, location.pathname]);

    useEffect(() => {
        if (location.pathname.startsWith('/app/notifications')) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasFreshNotification(false);
        }
    }, [location.pathname]);

    useEffect(() => () => {
        if (noticeTimerRef.current) {
            window.clearTimeout(noticeTimerRef.current);
        }
    }, []);

    useEffect(() => {
        if (user && isFirstLogin) {
            navigate('/login', { replace: true });
        }
    }, [user, isFirstLogin, navigate]);

    if (!user || isFirstLogin) return null;

    const pageName = resolvePageName(location.pathname);

    const headerUser = {
        name: user.name ?? '',
        initials: user.initials ?? (user.name ?? '?').charAt(0).toUpperCase(),
        role: user.role ?? '',
        email: user.email ?? '',
        avatarUrl: user.avatarUrl ?? null,
        avatarFit: user.avatarFit ?? null,
        avatarPosition: user.avatarPosition ?? null,
    };

    function handleLogout() {
        disconnectPresenceSocket();
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

            {showLiveNotice && (
                <div
                    style={{
                        position: 'fixed',
                        top: isMobile ? 72 : 18,
                        right: 18,
                        zIndex: 80,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 10,
                        border: '1px solid var(--role-accent-border)',
                        backgroundColor: '#ffffff',
                        padding: '10px 12px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                        color: '#111827',
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    <BellRing size={15} color="var(--role-accent-600)" />
                    {liveNoticeText}
                </div>
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
                    hasFreshNotification={hasFreshNotification}
                    onClearFreshNotification={() => setHasFreshNotification(false)}
                    activePresenceUsers={activePresenceUsers}
                    isPresenceConnected={isPresenceConnected}
                    currentUserId={user.id}
                    currentPath={location.pathname}
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
