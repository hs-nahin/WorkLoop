
import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="animate-pulse text-yellow-400 font-mono">Initializing secure session...</div>
    </div>
  );

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role?.toUpperCase() || 'USER';
  
  if (allowedRoles && allowedRoles.length > 0) {
    const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());
    if (!allowedRolesUpper.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;