import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000, title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notifySuccess = useCallback((message, title = 'Success') => {
    addToast(message, 'success', 4000, title);
  }, [addToast]);

  const notifyError = useCallback((message, title = 'Error') => {
    addToast(message || 'An error occurred', 'error', 5000, title);
  }, [addToast]);

  const notifyWarning = useCallback((message, title = 'Warning') => {
    addToast(message, 'warning', 4000, title);
  }, [addToast]);

  const notifyInfo = useCallback((message, title = 'Information') => {
    addToast(message, 'info', 4000, title);
  }, [addToast]);

  const value = {
    // Inventory module interface
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    addNotification: ({ message, type, title, duration }) => addToast(message, type, duration, title),
    // Sales module interface
    success: (msg) => notifySuccess(msg),
    error: (msg) => notifyError(msg),
    info: (msg) => notifyInfo(msg),
    warning: (msg) => notifyWarning(msg),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {notifications.map((n) => {
          let bg = 'bg-slate-900/95 text-slate-100 border-slate-700 shadow-xl';
          let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0" />;

          if (n.type === 'success') {
            bg = 'bg-slate-900/95 text-emerald-100 border-emerald-500/40 shadow-emerald-500/10';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (n.type === 'error') {
            bg = 'bg-slate-900/95 text-rose-100 border-rose-500/40 shadow-rose-500/10';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (n.type === 'warning') {
            bg = 'bg-slate-900/95 text-amber-100 border-amber-500/40 shadow-amber-500/10';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={n.id}
              className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-in slide-in-from-right ${bg}`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{icon}</div>
                <div>
                  {n.title && <div className="text-xs font-semibold uppercase tracking-wider mb-0.5">{n.title}</div>}
                  <div className="text-sm font-medium">{n.message}</div>
                </div>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="ml-3 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotify must be used within NotificationProvider');
  }
  return context;
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
