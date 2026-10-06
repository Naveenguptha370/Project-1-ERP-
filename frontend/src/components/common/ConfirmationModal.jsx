import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full flex-shrink-0 ${
          type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {type === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end space-x-3">
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          {cancelText}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition flex items-center gap-2 ${
            type === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
          }`}
        >
          {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
