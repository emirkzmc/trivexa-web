import { BarChart3, ClipboardList, FolderKanban, LogOut, Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore';
import { ROLES } from '../../../shared/constants/roles';

interface CustomerNavItem {
    label: string;
    to: string;
    icon: ReactNode;
}

const CUSTOMER_NAV_ITEMS: CustomerNavItem[] = [
    { label: 'Dashboard', to: '/customer-panel/dashboard', icon: <BarChart3 size={16} /> },
    { label: 'Projelerim', to: '/customer-panel/projeler', icon: <FolderKanban size={16} /> },
    { label: 'Taleplerim', to: '/customer-panel/talepler', icon: <ClipboardList size={16} /> },
    { label: 'Onaylar', to: '/customer-panel/onaylar', icon: <ClipboardList size={16} /> },
];

function PanelNav({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <nav className="mt-6 space-y-1">
            {CUSTOMER_NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        [
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-[#111827] text-white'
                                : 'text-slate-700 hover:bg-slate-100',
                        ].join(' ')
                    }
                >
                    {item.icon}
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export function CustomerPanelLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== ROLES.CLIENT) {
        return <Navigate to="/app/dashboard" replace />;
    }

    const initials = user.initials || user.name.charAt(0).toUpperCase() || '?';

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
            <div className="mx-auto flex min-h-screen max-w-[1600px]">
                <aside
                    className={[
                        'fixed inset-y-0 left-0 z-40 w-[280px] border-r border-slate-200 bg-white p-6 transition-transform duration-200 md:static md:translate-x-0',
                        mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    ].join(' ')}
                >
                    <div className="rounded-2xl bg-[#111827] px-4 py-4 text-white">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">TRIVEXA</p>
                        <p className="mt-2 text-lg font-semibold">Customer Panel</p>
                        <p className="mt-1 text-sm text-slate-300">Musteri takip alani</p>
                    </div>
                    <PanelNav onNavigate={() => setMobileOpen(false)} />
                </aside>

                {mobileOpen && (
                    <button
                        type="button"
                        aria-label="Menuyu kapat"
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    />
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 md:hidden"
                                    onClick={() => setMobileOpen((prev) => !prev)}
                                    aria-label="Menuyu ac"
                                >
                                    <Menu size={16} />
                                </button>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Customer Route</p>
                                    <h1 className="text-base font-semibold text-slate-900 md:text-lg">/customer-panel</h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                    {initials}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    <LogOut size={15} />
                                    Cikis
                                </button>
                            </div>
                        </div>
                    </header>

                    <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:hidden">
                        {CUSTOMER_NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    [
                                        'rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap',
                                        isActive
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-300 bg-white text-slate-700',
                                    ].join(' ')
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <main className="flex-1 overflow-auto p-4 md:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
