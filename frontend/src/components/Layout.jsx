import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { role, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItemClass = (path) =>
        `px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
            location.pathname === path
                ? 'bg-amber-900 text-amber-100 shadow-sm'
                : 'text-amber-200 hover:bg-amber-900/50 hover:text-white'
        }`;

    // Case-insensitive check
    const isAdmin = role?.toLowerCase() === 'admin';

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans antialiased">
            <header className="bg-amber-950 text-white shadow-md border-b border-amber-900">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl font-black tracking-widest text-amber-100">DINI DESIGNERS</span>
                        <span className="text-[10px] bg-amber-900 border border-amber-700 text-amber-200 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                            {role || 'User'}
                        </span>
                    </div>

                    <nav className="flex space-x-2 bg-amber-950/60 p-1.5 rounded-xl border border-amber-900/80">
                        {/* Strictly ADMIN ONLY Links */}
                        {isAdmin && (
                            <>
                                <Link to="/admin/orders" className={navItemClass('/admin/orders')}>
                                    All Orders
                                </Link>
                                <Link to="/admin/orders/new" className={navItemClass('/admin/orders/new')}>
                                    + New Order
                                </Link>
                                <Link to="/admin/inventory" className={navItemClass('/admin/inventory')}>
                                    Fabric Stock
                                </Link>
                                <Link to="/admin/tasks" className={navItemClass('/admin/tasks')}>
                                    Assign Tasks
                                </Link>
                                <Link to="/admin/employees/new" className={navItemClass('/admin/employees/new')}>
                                    + Create Employee
                                </Link>
                            </>
                        )}

                        {/* Strictly WORKER ONLY Links */}
                        {!isAdmin && (
                            <Link to="/my-tasks" className={navItemClass('/my-tasks')}>
                                My Tasks
                            </Link>
                        )}
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="bg-red-800/90 hover:bg-red-900 text-white text-xs px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}