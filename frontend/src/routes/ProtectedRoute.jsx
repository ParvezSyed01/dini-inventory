import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles }) {
  const { role, user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center font-bold">Loading...</div>;
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