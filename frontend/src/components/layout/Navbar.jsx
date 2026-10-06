import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Shield, Layers } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xl tracking-tight">
          <Layers className="w-6 h-6 text-indigo-600" />
          <span>Smart<span className="text-slate-900">ERP</span></span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
          Enterprise v1.0
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 pr-2 border-r border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user.full_name}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                {user.is_superuser ? 'Super Admin' : (user.roles?.[0]?.name || 'Staff')}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
