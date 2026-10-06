import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { User, Mail, Shield, Key, Clock, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <Breadcrumb items={[{ label: 'User Profile', url: '/profile' }]} />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl shadow-sm">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-indigo-600/20">
            {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.full_name}</h1>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {user.is_superuser ? 'Super Administrator' : (user.roles?.[0]?.name || 'Standard User')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                @{user.username}
              </span>
            </div>
          </div>
        </div>

        <div className="py-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Assigned Roles & Access Permissions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 mb-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Assigned Roles</span>
              </div>
              {user.roles && user.roles.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {user.roles.map((r) => (
                    <li key={r.id} className="flex items-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-semibold">{r.name}</span>
                      {r.description && <span className="text-slate-400">({r.description})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-slate-400">Standard User Access</span>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 mb-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Effective Permissions</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {user.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((p) => (
                    <span key={p} className="text-[10px] font-mono font-medium px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No explicit permissions</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
