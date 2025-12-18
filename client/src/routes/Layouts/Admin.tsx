import { useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import { SystemRoles } from 'aladin-data-provider';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { Users, Key, Shield } from 'lucide-react';

export default function AdminLayout() {
  const { user, isAuthenticated, token } = useAuthContext();

  console.log('AdminLayout Debug:', { isAuthenticated, userRole: user?.role, expectedRole: SystemRoles.ADMIN, token: !!token });

  // If there is no token, we are definitely not authenticated, redirect to login (or home if public)
  if (token === undefined && !isAuthenticated) {
     // Wait for initial auth check to complete? 
     // AuthContext initializes token as undefined. It sets it after silent refresh.
     // We can show a loader if token is undefined but we expect to be logged in?
     // Actually, if we hit this route directly, silent refresh runs.
     return <div className="flex h-screen items-center justify-center">Loading Admin Portal...</div>;
  }
  
  // If we have determined we are NOT authenticated (token is null/false or isAuthenticated is explicitly false after check)
  if (token === null || (token !== undefined && !isAuthenticated)) {
      return <Navigate to="/" />;
  }

  // If authenticated but wrong role
  if (isAuthenticated && user?.role !== SystemRoles.ADMIN) {
      return <Navigate to="/" />;
  }

  // If authenticated and correct role
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Portal</h1>
        </div>
        <nav className="p-4 space-y-2">
          <AdminNavLink to="/admin/users" icon={<Users size={20} />} label="Users" />
          <AdminNavLink to="/admin/licenses" icon={<Key size={20} />} label="Licenses" />
          <AdminNavLink to="/admin/roles" icon={<Shield size={20} />} label="Roles & Permissions" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  );
}

function AdminNavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
