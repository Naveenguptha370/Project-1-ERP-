/** Reusable UI components */
import { X, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react'

// ── Loading Spinner ────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  return <Loader2 className={`${s} animate-spin text-primary-500 ${className}`} />
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ── Alert / Error Banner ───────────────────────────────────────────────────
export function Alert({ type = 'error', message, onDismiss }) {
  if (!message) return null
  const styles = {
    error:   { bg: 'bg-red-50 border-red-200',   text: 'text-red-700',   Icon: AlertCircle },
    success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', Icon: CheckCircle },
    info:    { bg: 'bg-blue-50 border-blue-200',  text: 'text-blue-700',  Icon: Info },
  }
  const { bg, text, Icon } = styles[type] || styles.error
  return (
    <div className={`${bg} ${text} border rounded-lg p-3 flex items-start gap-2 text-sm animate-fade-in`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────
export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', danger = false }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

// ── Status Badge helpers ───────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    ACTIVE:      'badge-green',
    INACTIVE:    'badge-gray',
    ON_LEAVE:    'badge-yellow',
    TERMINATED:  'badge-red',
    PRESENT:     'badge-green',
    ABSENT:      'badge-red',
    LATE:        'badge-yellow',
    HALF_DAY:    'badge-blue',
    ON_LEAVE_ATT:'badge-purple',
    HOLIDAY:     'badge-gray',
    PENDING:     'badge-yellow',
    APPROVED:    'badge-green',
    REJECTED:    'badge-red',
    CANCELLED:   'badge-gray',
  }
  return <span className={map[status] || 'badge-gray'}>{status?.replace('_', ' ')}</span>
}

// ── Pagination ─────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button className="btn-secondary btn-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        ← Prev
      </button>
      <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
      <button className="btn-secondary btn-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next →
      </button>
    </div>
  )
}

// ── Toast Notification ─────────────────────────────────────────────────────
export function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map(t => (
        <div key={t.id} className={`animate-fade-in rounded-xl shadow-lg p-4 flex items-start gap-3 border
          ${t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
                                   'bg-blue-50 border-blue-200 text-blue-800'}`}>
          {t.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> :
           t.type === 'error'   ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> :
                                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="flex-1 text-sm font-medium">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="hover:opacity-60">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
