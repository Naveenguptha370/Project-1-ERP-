import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ requiredPermission, requiredRole }) => {
  const { user, isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium text-sm">Authenticating SmartERP Session...</p>
      </div>
    );
  }

  const isAuthed = isAuthenticated || !!user;
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole && role !== 'ADMIN') {
    return (
      <div className="p-8 max-w-lg mx-auto bg-slate-900 border border-rose-500/30 rounded-2xl text-center shadow-xl my-12 text-white">
        <h3 className="text-base font-bold text-rose-400 mb-2">Access Forbidden (403)</h3>
        <p className="text-xs text-slate-400 mb-4">
          Required role: <code className="font-mono text-indigo-400 font-bold">{requiredRole}</code>.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
