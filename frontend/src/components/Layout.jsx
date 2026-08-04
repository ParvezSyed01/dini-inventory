import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    ClipboardList,
    PlusCircle,
    Layers,
    ListChecks,
    UserPlus,
    LogOut,
    Menu,
    X,
    Scissors,
} from './Icons';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { role, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItemClass = (path) =>
        `nav-link ${location.pathname === path ? 'nav-link-active' : 'nav-link-idle'}`;

    // Case-insensitive check
    const isAdmin = role?.toLowerCase() === 'admin';

    // Strictly ADMIN ONLY links
    const adminLinks = [
        { to: '/admin/orders', label: 'All Orders', Icon: ClipboardList },
        { to: '/admin/orders/new', label: 'New Order', Icon: PlusCircle },
        { to: '/admin/inventory', label: 'Fabric Stock', Icon: Layers },
        { to: '/admin/tasks', label: 'Assign Tasks', Icon: ListChecks },
        { to: '/admin/employees/new', label: 'Create Employee', Icon: UserPlus },
    ];

    // Strictly WORKER ONLY links
    const workerLinks = [{ to: '/my-tasks', label: 'My Tasks', Icon: ListChecks }];

    const links = isAdmin ? adminLinks : workerLinks;

    return (
        <div className="min-h-screen flex flex-col font-body antialiased">
            <header className="sticky top-0 z-40 bg-brass-sheen text-white shadow-header border-b border-amber-900/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex h-16 items-center justify-between gap-4">
                        {/* Brand */}
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100/10 ring-1 ring-amber-200/25 backdrop-blur">
                                <Scissors className="h-4 w-4 text-amber-200" strokeWidth={2.5} />
                            </span>
                            <div className="min-w-0">
                                <p className="font-display text-base sm:text-lg font-extrabold tracking-[0.16em] text-amber-50 leading-none truncate">
                                    DINI DESIGNERS
                                </p>
                                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-amber-200/60 leading-none">
                                    Atelier Management
                                </p>
                            </div>
                        </div>

                        {/* Desktop nav */}
                        <nav className="hidden lg:flex items-center gap-1 rounded-2xl border border-amber-900/50 bg-amber-950/40 p-1.5 backdrop-blur">
                            {links.map(({ to, label, Icon }) => (
                                <Link key={to} to={to} className={navItemClass(to)}>
                                    <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                    {label}
                                </Link>
                            ))}
                        </nav>

                        {/* Right cluster */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-100/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-100 backdrop-blur">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]" />
                                {role || 'User'}
                            </span>

                            <button
                                onClick={handleLogout}
                                title="Log out"
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-200/20 bg-amber-100/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-100 transition-all hover:border-red-400/40 hover:bg-red-900/40 hover:text-white active:translate-y-px"
                            >
                                <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>

                            <button
                                onClick={() => setMobileOpen((v) => !v)}
                                aria-label="Toggle navigation"
                                className="lg:hidden grid h-9 w-9 place-items-center rounded-xl border border-amber-200/20 bg-amber-100/5 text-amber-100 transition-colors hover:bg-amber-900/50"
                            >
                                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile nav */}
                    {mobileOpen && (
                        <nav className="lg:hidden pb-4 animate-fade-in">
                            <div className="grid gap-1 rounded-2xl border border-amber-900/50 bg-amber-950/50 p-2">
                                {links.map(({ to, label, Icon }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        onClick={() => setMobileOpen(false)}
                                        className={`${navItemClass(to)} w-full justify-start`}
                                    >
                                        <Icon className="h-4 w-4" strokeWidth={2.5} />
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </nav>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div key={location.pathname} className="animate-rise-in">
                    <Outlet />
                </div>
            </main>

            <footer className="border-t border-stone-200/70 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Dini Designers · Bespoke Tailoring
                    </p>
                    <p className="text-[11px] text-stone-400">Smart Apparel Business Management</p>
                </div>
            </footer>
        </div>
    );
}
