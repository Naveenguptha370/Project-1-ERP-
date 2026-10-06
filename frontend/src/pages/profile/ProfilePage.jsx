import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import api from '../../services/api';
import { ShieldCheck, Key, Lock, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/constants';

export const ProfilePage = () => {
  const { user, role, token } = useAuth();
  const notify = useNotify();

  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const testEndpoint = async (url) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.get(url);
      setTestResult({
        success: true,
        endpoint: url,
        data: res.data,
      });
      notify.success('Security test passed successfully!');
    } catch (err) {
      setTestResult({
        success: false,
        endpoint: url,
        status: err.response?.status,
        data: err.response?.data,
      });
      notify.error(err.response?.data?.detail || 'Access denied');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          User Security & Profile
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Authenticated session details, JWT credentials, and RBAC permission verification
        </p>
      </div>

      {/* User Info Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.full_name}</h3>
            <p className="text-xs text-slate-400">@{user?.username}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {role}
              </span>
              <span className="text-xs text-emerald-400 flex items-center font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Active Session
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 font-medium block mb-1">User ID:</span>
            <span className="font-mono text-white text-sm">#{user?.id}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 font-medium block mb-1">Email Address:</span>
            <span className="font-medium text-white text-sm">{user?.email}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 font-medium block mb-1">Account Created:</span>
            <span className="text-slate-300 text-sm">{formatDate(user?.created_at)}</span>
          </div>
        </div>

        {/* Security & Token Inspector */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Active JWT Bearer Token</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400">Valid & Signed</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 break-all select-all">
            {token ? `${token.substring(0, 48)}...[truncated]...${token.slice(-16)}` : 'No token active'}
          </div>
        </div>
      </div>

      {/* RBAC Verification Box */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
          Role-Based Access Control (RBAC) Verification
        </h4>
        <p className="text-xs text-slate-400">
          Verify backend authorization dependencies and middleware protection endpoints
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => testEndpoint('/auth/protected')}
            disabled={testing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test /auth/protected (Any User)</span>
          </button>

          <button
            onClick={() => testEndpoint('/auth/admin-only')}
            disabled={testing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Test /auth/admin-only (Admin Restricted)</span>
          </button>
        </div>

        {/* Test Result Inspector */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono space-y-2 mt-4 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>Endpoint: {testResult.endpoint}</span>
              <span>{testResult.success ? '200 OK — Authorized' : `${testResult.status} Forbidden`}</span>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg text-slate-300 text-[11px] overflow-x-auto">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
