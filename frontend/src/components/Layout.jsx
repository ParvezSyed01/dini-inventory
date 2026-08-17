import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    ClipboardList,
    PlusCircle,
    Layers,
    ListChecks,
    UserPlus,
    LogOut,
    CalendarCheck,
    Wallet,
    History,
    MoreHorizontal,
} from './Icons';
import { useAuth } from '../context/AuthContext';
import { LOGIN_PATH } from '../routes/paths';
import logo from '../assets/logo.png';

// `mobileLabel` keeps the fixed-width bottom tab bar from wrapping or
// truncating — the full `label` is still used in the desktop sidebar and
// the mobile "More" sheet, where there's room to spell it out.
const ADMIN_LINKS = [
    { to: '/admin/orders', label: 'All Orders', mobileLabel: 'Orders', Icon: ClipboardList },
    { to: '/admin/orders/new', label: 'New Order', mobileLabel: 'New', Icon: PlusCircle },
    { to: '/admin/inventory', label: 'Fabric Stock', mobileLabel: 'Fabric', Icon: Layers },
    { to: '/admin/tasks', label: 'Assign Tasks', mobileLabel: 'Tasks', Icon: ListChecks },
    { to: '/admin/attendance', label: 'Attendance', Icon: CalendarCheck },
    { to: '/admin/advances', label: 'Advance Payments', Icon: Wallet },
    { to: '/admin/worker-overview', label: 'Worker Overview', Icon: History },
    { to: '/admin/employees/new', label: 'Create Employee', Icon: UserPlus },
];

const WORKER_LINKS = [
    { to: '/my-tasks', label: 'My Tasks', Icon: ListChecks },
    { to: '/my-attendance', label: 'My Attendance', Icon: CalendarCheck },
    { to: '/my-advances', label: 'My Advances', Icon: Wallet },
];

// Bottom nav fits five tabs at most before it gets cramped — admins get
// their four most-used links direct, everything else lives behind "More".
const ADMIN_TAB_COUNT = 4;

export default function Layout() {
    const { role, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);

    // Close any open overlay whenever the route changes, so a tap doesn't
    // leave a stale sheet or popover hanging around on the next screen.
    useEffect(() => {
        setSheetOpen(false);
        setAccountOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate(LOGIN_PATH);
    };

    // Case-insensitive check
    const isAdmin = role?.toLowerCase() === 'admin';

    const links = isAdmin ? ADMIN_LINKS : WORKER_LINKS;
    const tabLinks = isAdmin ? ADMIN_LINKS.slice(0, ADMIN_TAB_COUNT) : WORKER_LINKS;
    const moreLinks = isAdmin ? ADMIN_LINKS.slice(ADMIN_TAB_COUNT) : [];
    const hasMore = moreLinks.length > 0;
    const moreActive = hasMore && moreLinks.some((l) => l.to === location.pathname);
    const initials = (role || 'U').slice(0, 2);

    const sidebarContent = (
        <div className="sidebar">
            {/* Brand — full width, no truncation */}
            <div className="border-b border-stone-200 px-5 py-6">
                <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl chip-dark shadow-sm">
                        <img src={logo} alt="Dini Designers" className="h-7 w-7 object-contain" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-display text-[19px] font-semibold leading-none tracking-tight text-stone-900">
                            Dini Designers
                        </p>
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.24em] leading-none text-amber-600">
                            Atelier Management
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-5">
                <p className="eyebrow px-3.5 pb-2.5">
                    {isAdmin ? 'Studio' : 'Workshop'}
                </p>
                <div className="space-y-1">
                    {links.map(({ to, label, Icon }) => {
                        const active = location.pathname === to;
                        return (
                            <Link
                                key={to}
                                to={to}
                                aria-current={active ? 'page' : undefined}
                                className={`side-link ${active ? 'side-link-active' : 'side-link-idle'}`}
                            >
                                <Icon
                                    className={`h-[17px] w-[17px] shrink-0 ${
                                        active ? 'text-amber-600' : 'text-stone-400'
                                    }`}
                                    strokeWidth={2}
                                />
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Account */}
            <div className="border-t border-stone-200 p-3">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber-200 bg-amber-50 text-[11px] font-bold uppercase text-amber-700">
                        {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-stone-800">{role || 'User'}</p>
                        <p className="flex items-center gap-1.5 text-[10px] text-stone-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Signed in
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[12px] font-semibold tracking-wide text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                    <LogOut className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
                    Log out
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-[100dvh] font-body antialiased">
            {/* Fixed sidebar on desktop */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden lg:block">
                {sidebarContent}
            </aside>

            <div className="lg:pl-64">
                {/* ---------- Mobile app bar ---------- */}
                <header className="app-bar lg:hidden">
                    <div className="flex h-14 items-center gap-3 px-4">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg chip-dark">
                            <img src={logo} alt="Dini Designers" className="h-5 w-5 object-contain" />
                        </span>
                        <p className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-stone-900">
                            Dini Designers
                        </p>

                        <div className="relative ml-auto">
                            <button
                                onClick={() => setAccountOpen((v) => !v)}
                                aria-label="Account menu"
                                aria-expanded={accountOpen}
                                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-amber-200 bg-amber-50 text-[11px] font-bold uppercase tracking-wide text-amber-700 shadow-sm transition-all active:scale-95"
                            >
                                {initials}
                            </button>

                            {accountOpen && (
                                <>
                                    <button
                                        aria-label="Close account menu"
                                        className="fixed inset-0 z-40 cursor-default"
                                        onClick={() => setAccountOpen(false)}
                                    />
                                    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 animate-pop-in rounded-2xl border border-stone-200 bg-white p-2 shadow-pop">
                                        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber-200 bg-amber-50 text-[11px] font-bold uppercase text-amber-700">
                                                {initials}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-bold text-stone-800">
                                                    {role || 'User'}
                                                </p>
                                                <p className="flex items-center gap-1.5 text-[10px] text-stone-400">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                    Signed in
                                                </p>
                                            </div>
                                        </div>
                                        <div className="divider my-1.5" />
                                        <button
                                            onClick={handleLogout}
                                            className="sheet-link w-full text-red-700 active:bg-red-50"
                                        >
                                            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />
                                            Log out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-7xl px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:py-10">
                    <div key={location.pathname} className="animate-rise-in">
                        <Outlet />
                    </div>
                </main>

                <footer className="mx-auto hidden w-full max-w-7xl px-4 pb-8 sm:px-6 lg:block lg:px-10">
                    <div className="gold-rule mb-4" />
                    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                            Dini Designers · Bespoke Tailoring
                        </p>
                        <p className="text-[11px] text-stone-400">
                            Smart Apparel Business Management
                        </p>
                    </div>
                </footer>
            </div>

            {/* ---------- Mobile bottom tab bar ---------- */}
            <nav className="bottom-nav lg:hidden" aria-label="Primary">
                {tabLinks.map(({ to, label, mobileLabel, Icon }) => {
                    const active = location.pathname === to;
                    return (
                        <Link
                            key={to}
                            to={to}
                            aria-current={active ? 'page' : undefined}
                            className={`bottom-nav-item ${active ? 'bottom-nav-item-active' : ''}`}
                        >
                            <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                            <span className="bottom-nav-label">{mobileLabel || label}</span>
                        </Link>
                    );
                })}

                {hasMore && (
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        aria-label="More options"
                        aria-expanded={sheetOpen}
                        className={`bottom-nav-item ${moreActive ? 'bottom-nav-item-active' : ''}`}
                    >
                        <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive ? 2.4 : 2} />
                        <span className="bottom-nav-label">More</span>
                    </button>
                )}
            </nav>

            {/* ---------- "More" bottom sheet — remaining admin links + sign out ---------- */}
            {sheetOpen && (
                <>
                    <div
                        className="sheet-backdrop lg:hidden"
                        onClick={() => setSheetOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        className="sheet-panel lg:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="More options"
                    >
                        <div className="sheet-handle" />
                        <p className="eyebrow px-5 pb-2 pt-3.5">More</p>

                        <div className="space-y-0.5 px-3 pb-2">
                            {moreLinks.map(({ to, label, Icon }) => {
                                const active = location.pathname === to;
                                return (
                                    <Link
                                        key={to}
                                        to={to}
                                        aria-current={active ? 'page' : undefined}
                                        className={`sheet-link ${active ? 'sheet-link-active' : ''}`}
                                    >
                                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="divider my-1" />

                        <div className="px-3 pb-3 pt-1">
                            <button
                                onClick={handleLogout}
                                className="sheet-link w-full text-red-700 active:bg-red-50"
                            >
                                <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />
                                Log out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
