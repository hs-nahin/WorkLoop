import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

const ProtectedRoute = ({ allowedPermissions, requiredRole }) => {
  const { user, token, loading, permissionsVersion } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="animate-pulse text-yellow-400 font-mono">Initializing secure session...</div>
    </div>
  );

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user?.role || '';

  if (requiredRole) {
    const required = (requiredRole || '').toUpperCase();
    const userRole = (role || '').toUpperCase();
    if (userRole !== required) {
      if (userRole === 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (allowedPermissions && allowedPermissions.length > 0) {
    const hasAccess = allowedPermissions.some(p => hasPermission(role, p));
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
