// ====================================
// AdminRoute Component
// Requires user to be logged in AND have admin role
// ====================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg text-center p-4">
        <h1 className="text-5xl font-black text-red-500 mb-4">403</h1>
        <p className="text-xl text-slate-400 mb-2">Access Denied</p>
        <p className="text-sm text-slate-500 mb-6">You don't have permission to view this page.</p>
        <a
          href="/"
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transition-all"
        >
          Go Home
        </a>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
