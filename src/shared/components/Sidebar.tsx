import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Bell, Users, Building2, FolderKanban, CheckSquare,
    Timer, BarChart3, FileText, FolderOpen, ShieldCheck, Settings,
    Receipt, Code2, CalendarDays, Megaphone, Palette, Film, Network,
    CalendarCheck, Clock, TrendingUp, Inbox, ClipboardList, MessageSquare,
    MessageSquarePlus, StickyNote, LogOut, ChevronRight, X,
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useUnreadCount } from '../../features/notifications/hooks/useUnreadCount';
import { NAV_CONFIG, type RoleNavConfig } from '../../shared/constants/navConfig';
import { ROLES } from '../../shared/constants/roles';
import { NAV_PERMISSION_MAP } from '../constants/navPermissions';
import { usePermission } from '../hooks/usePermission';

const ICON_MAP: Record<string, React.ElementType> = {
    LayoutDashboard, Bell, Users, Building2, FolderKanban, CheckSquare,
    Timer, BarChart3, FileText, FolderOpen, ShieldCheck, Settings,
    Receipt, Code2, CalendarDays, Megaphone, Palette, Film, Network,
    CalendarCheck, Clock, TrendingUp, Inbox, ClipboardList, MessageSquare,
    MessageSquarePlus, StickyNote,
};

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 100;
const MOBILE_SIDEBAR_WIDTH = 280;

interface SidebarProps {
    isMobile?: boolean;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function Sidebar({
    isMobile = false,
    mobileOpen = false,
    onMobileClose,
}: SidebarProps) {
    const user = useAuthStore((s) => s.user);
    const logoutStore = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const unreadCountQuery = useUnreadCount();
    const { hasAnyPermission, hasPermission } = usePermission();

    if (!user) return null;

    const navConfigMap = NAV_CONFIG as Record<string, RoleNavConfig>;
    const rawRole = String(user.role ?? '');
    const normalizedRole = rawRole.toUpperCase();
    const config = navConfigMap[rawRole]
        ?? navConfigMap[normalizedRole]
        ?? (normalizedRole === 'SEO' ? navConfigMap[ROLES.SOCIAL_MEDIA] : undefined)
        ?? (
            normalizedRole.includes('MUHASEBE') || normalizedRole.includes('ACCOUNTING')
                ? navConfigMap[ROLES.ACCOUNTING]
                : undefined
        );
    if (!config) return null;

    const { theme, groups } = config;
    const unreadCount = unreadCountQuery.data ?? 0;
    const collapsedState = isMobile ? false : collapsed;
    const sidebarWidth = isMobile
        ? MOBILE_SIDEBAR_WIDTH
        : (collapsedState ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH);

    const visibleGroups = groups
        .map((group) => {
            const visibleItems = group.items.filter((item) => {
                const required = NAV_PERMISSION_MAP[item.path];
                if (!required) return true;
                return Array.isArray(required)
                    ? hasAnyPermission(required)
                    : hasPermission(required);
            });
            return { ...group, items: visibleItems };
        })
        .filter((group) => group.items.length > 0);

    function handleLogout() {
        logoutStore();
        navigate('/login');
    }

    function handleTopButtonClick() {
        if (isMobile) {
            onMobileClose?.();
            return;
        }
        setCollapsed((prev) => !prev);
    }

    function handleItemClick() {
        if (isMobile) {
            onMobileClose?.();
        }
    }

    return (
        <aside
            aria-label="Sidebar navigasyonu"
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: sidebarWidth,
                minWidth: sidebarWidth,
                backgroundColor: theme.bg,
                color: theme.text,
                fontFamily: "'Poppins', system-ui, sans-serif",
                overflowY: 'auto',
                overflowX: 'hidden',
                borderRight: `1px solid ${theme.border}`,
                transition: isMobile
                    ? 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
                    : 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                position: isMobile ? 'fixed' : 'relative',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: isMobile ? 60 : 'auto',
                transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
                boxShadow: isMobile ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
            }}
        >
            <div
                style={{
                    padding: collapsedState ? '20px 10px' : '24px 20px 20px',
                    borderBottom: `1px solid ${theme.border}`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: collapsedState ? 8 : 0,
                    transition: 'padding 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: theme.bg,
                }}
            >
                <span
                    style={{
                        fontSize: 18,
                        fontWeight: 800,
                        letterSpacing: '-0.5px',
                        color: theme.accent,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {collapsedState ? 'TVX' : 'TRIVEXA'}
                </span>

                <button
                    onClick={handleTopButtonClick}
                    title={isMobile ? 'Menüyü kapat' : (collapsedState ? 'Menüyü aç' : 'Menüyü kapat')}
                    aria-label={isMobile ? 'Menüyü kapat' : (collapsedState ? 'Menüyü aç' : 'Menüyü kapat')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${theme.accent}15`;
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
                >
                    {isMobile ? (
                        <X size={18} color={theme.accent} />
                    ) : (
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 25 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                                transform: collapsedState ? 'rotate(45deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                flexShrink: 0,
                            }}
                        >
                            <path d="M0 0H10.5769V10.1538H0V0Z" fill={theme.accent} />
                            <path d="M0 13.8462H10.5769V24H0V13.8462Z" fill={theme.accent} />
                            <path d="M14.4231 0H25V10.1538H14.4231V0Z" fill={theme.accent} />
                            <path d="M14.4231 13.8462H25V24H14.4231V13.8462Z" fill={theme.accent} />
                        </svg>
                    )}
                </button>
            </div>

            <nav style={{ flex: 1, padding: '12px 0' }}>
                {visibleGroups.map((grp, gi) => (
                    <div key={gi} style={{ marginBottom: 8 }}>
                        {grp.group && !collapsedState && (
                            <p
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: theme.muted,
                                    padding: '8px 20px 4px',
                                    margin: 0,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                }}
                            >
                                {grp.group}
                            </p>
                        )}

                        {grp.group && collapsedState && gi > 0 && (
                            <div
                                style={{
                                    margin: '8px auto',
                                    width: 24,
                                    height: 1,
                                    backgroundColor: theme.border,
                                }}
                            />
                        )}

                        <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {grp.items.map((item) => {
                                const IconComponent = item.icon ? ICON_MAP[item.icon] : null;
                                const badgeNum = item.badge === 'unread' ? unreadCount : 0;

                                return (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            onClick={handleItemClick}
                                            title={collapsedState ? item.label : undefined}
                                            style={({ isActive }) => ({
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: collapsedState ? 'center' : 'flex-start',
                                                gap: collapsedState ? 0 : 10,
                                                padding: collapsedState ? '9px 0' : '9px 20px',
                                                margin: collapsedState ? '1px 6px' : '1px 8px',
                                                borderRadius: 8,
                                                textDecoration: 'none',
                                                fontSize: 13.5,
                                                fontWeight: isActive ? 600 : 400,
                                                color: isActive ? theme.accent : theme.text,
                                                backgroundColor: isActive
                                                    ? `${theme.accent}18`
                                                    : 'transparent',
                                                borderLeft: isActive && !collapsedState
                                                    ? `3px solid ${theme.accent}`
                                                    : '3px solid transparent',
                                                transition: 'background-color 0.15s, color 0.15s',
                                                overflow: 'hidden',
                                            })}
                                            onMouseEnter={(e) => {
                                                if (isMobile) return;
                                                const el = e.currentTarget as HTMLAnchorElement;
                                                el.style.backgroundColor = `${theme.accent}10`;
                                                el.style.color = theme.text;
                                            }}
                                            onMouseLeave={(e) => {
                                                if (isMobile) return;
                                                const el = e.currentTarget as HTMLAnchorElement;
                                                el.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            {IconComponent && (
                                                <IconComponent size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                                            )}

                                            {!collapsedState && (
                                                <span style={{ flex: 1, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                                                    {item.label}
                                                </span>
                                            )}

                                            {!collapsedState && item.badge === 'unread' && badgeNum > 0 && (
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 18,
                                                        height: 18,
                                                        borderRadius: 9,
                                                        backgroundColor: theme.accent,
                                                        color: '#ffffff',
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        padding: '0 4px',
                                                    }}
                                                >
                                                    {badgeNum > 99 ? '99+' : badgeNum}
                                                </span>
                                            )}

                                            {!collapsedState && item.badge !== 'unread' && (
                                                <ChevronRight
                                                    size={13}
                                                    style={{ color: theme.muted, flexShrink: 0 }}
                                                />
                                            )}
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div
                style={{
                    borderTop: `1px solid ${theme.border}`,
                    padding: collapsedState ? '12px 0' : '12px 16px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: collapsedState ? 'center' : 'flex-start',
                    transition: 'padding 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {!collapsedState && (
                    <span
                        style={{
                            display: 'inline-block',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: theme.accent,
                            backgroundColor: `${theme.accent}18`,
                            borderRadius: 4,
                            padding: '2px 7px',
                            marginBottom: 8,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {user.role}
                    </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: collapsedState ? 0 : 10, width: '100%', justifyContent: collapsedState ? 'center' : 'flex-start' }}>
                    <div
                        title={collapsedState ? user.name : undefined}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: `${theme.accent}30`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: 13,
                            fontWeight: 700,
                            color: theme.accent,
                            cursor: collapsedState ? 'default' : 'auto',
                        }}
                    >
                        {user.initials ?? '?'}
                    </div>

                    {!collapsedState && (
                        <span
                            style={{
                                flex: 1,
                                fontSize: 13,
                                fontWeight: 500,
                                color: theme.text,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user.name}
                        </span>
                    )}

                    {!collapsedState && (
                        <button
                            onClick={handleLogout}
                            title="Çıkış Yap"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 6,
                                borderRadius: 6,
                                color: theme.muted,
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--role-accent-600)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = theme.muted;
                            }}
                        >
                            <LogOut size={16} strokeWidth={1.75} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
