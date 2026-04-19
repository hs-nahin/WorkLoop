import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = () => {
  const { user, token, loading } = React.useContext(AuthContext);
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="animate-pulse text-yellow-400 font-mono">Initializing secure session...</div>
    </div>
  );

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
