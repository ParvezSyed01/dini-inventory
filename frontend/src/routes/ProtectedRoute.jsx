import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles }) {
  const { role, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7 animate-spin text-amber-800"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">Loading</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role to handle lowercase casing
  const userRole = role ? role.toLowerCase() : '';
  const normalizedAllowedRoles = allowedRoles ? allowedRoles.map(r => r.toLowerCase()) : [];

  if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    // If worker tries to visit an admin route, send them to /my-tasks
    return <Navigate to="/my-tasks" replace />;
  }

  return <Outlet />;
}