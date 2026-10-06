import { useEffect, useState, useCallback } from 'react'
import { Plus, Check, X, CalendarOff, Eye } from 'lucide-react'
import { hrService } from '../../../services/hrService'
import { Spinner, EmptyState, Alert, StatusBadge, Toast } from '../../../components/ui'
import { useToast } from '../../../hooks/useToast'
import { getErrorMessage, formatDate, LEAVE_TYPES } from '../../../utils/helpers'

const LEAVE_STATUS_OPTS = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

// ── Apply Leave Modal ─────────────────────────────────────────────────────────
function ApplyLeaveModal({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: '', leave_type: 'ANNUAL', start_date: '', end_date: '', reason: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving]   = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalDays = form.start_date && form.end_date
    ? Math.max(0, (new Date(form.end_date) - new Date(form.start_date)) / 86400000 + 1)
    : 0

  function validate() {
    const e = {}
    if (!form.employee_id)    e.employee_id = 'Select an employee'
    if (!form.start_date)     e.start_date  = 'Required'
    if (!form.end_date)       e.end_date    = 'Required'
    if (form.end_date < form.start_date) e.end_date = 'Cannot be before start date'
    if (!form.reason.trim())  e.reason      = 'Reason is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await hrService.createLeave({ ...form, employee_id: Number(form.employee_id) })
      onSave()
    } catch (err) {
      setErrors({ _global: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-slate-800">Apply for Leave</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {errors._global && <Alert type="error" message={errors._global} />}

            <div>
              <label className="form-label">Employee <span className="text-red-500">*</span></label>
              <select className={errors.employee_id ? 'form-input-error' : 'form-select'}
                value={form.employee_id} onChange={e => set('employee_id', e.target.value)}>
                <option value="">— Select Employee —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
              </select>
              {errors.employee_id && <p className="form-error">{errors.employee_id}</p>}
            </div>

            <div>
              <label className="form-label">Leave Type</label>
              <select className="form-select" value={form.leave_type} onChange={e => set('leave_type', e.target.value)}>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date <span className="text-red-500">*</span></label>
                <input type="date" className={errors.start_date ? 'form-input-error' : 'form-input'}
                  value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                {errors.start_date && <p className="form-error">{errors.start_date}</p>}
              </div>
              <div>
                <label className="form-label">End Date <span className="text-red-500">*</span></label>
                <input type="date" className={errors.end_date ? 'form-input-error' : 'form-input'}
                  value={form.end_date} onChange={e => set('end_date', e.target.value)} />
                {errors.end_date && <p className="form-error">{errors.end_date}</p>}
              </div>
            </div>

            {totalDays > 0 && (
              <p className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
                📅 Total: {totalDays} day{totalDays !== 1 ? 's' : ''}
              </p>
            )}

            <div>
              <label className="form-label">Reason <span className="text-red-500">*</span></label>
              <textarea className={`${errors.reason ? 'form-input-error' : 'form-input'} resize-none`}
                rows={3} value={form.reason} onChange={e => set('reason', e.target.value)}
                placeholder="Briefly describe the reason for leave" />
              {errors.reason && <p className="form-error">{errors.reason}</p>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ leave, onSave, onClose }) {
  const [status, setStatus]   = useState('APPROVED')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await hrService.reviewLeave(leave.id, { status, remarks })
      onSave()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-semibold text-slate-800">Review Leave Request</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {error && <Alert type="error" message={error} />}
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="text-slate-500">Employee:</span> <strong>{leave.employee?.full_name}</strong></p>
              <p><span className="text-slate-500">Type:</span> {leave.leave_type}</p>
              <p><span className="text-slate-500">Dates:</span> {formatDate(leave.start_date)} → {formatDate(leave.end_date)}</p>
              <p><span className="text-slate-500">Days:</span> {leave.total_days}</p>
              <p><span className="text-slate-500">Reason:</span> {leave.reason}</p>
            </div>
            <div>
              <label className="form-label">Decision</label>
              <div className="flex gap-3">
                {['APPROVED', 'REJECTED'].map(s => (
                  <label key={s} className={`flex items-center gap-2 flex-1 border rounded-lg p-3 cursor-pointer transition-all
                    ${status === s
                      ? s === 'APPROVED' ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="status" value={s} checked={status === s}
                      onChange={() => setStatus(s)} className="hidden" />
                    <span className={`text-sm font-semibold ${s === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'}`}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Remarks</label>
              <textarea className="form-input resize-none" rows={2} value={remarks}
                onChange={e => setRemarks(e.target.value)} placeholder="Optional note to employee" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit"
              className={status === 'APPROVED' ? 'btn-success' : 'btn-danger'}
              disabled={saving}>
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving…' : status === 'APPROVED' ? '✓ Approve' : '✕ Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function LeaveDetailModal({ leave, onClose }) {
  const Row = ({ label, children }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{children || '—'}</span>
    </div>
  )
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-semibold text-slate-800">Leave Request Details</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <div className="modal-body space-y-1">
          <Row label="Employee">{leave.employee?.full_name}</Row>
          <Row label="Leave Type">{leave.leave_type}</Row>
          <Row label="Start Date">{formatDate(leave.start_date)}</Row>
          <Row label="End Date">{formatDate(leave.end_date)}</Row>
          <Row label="Total Days">{leave.total_days}</Row>
          <Row label="Status"><StatusBadge status={leave.status} /></Row>
          <Row label="Reason">{leave.reason}</Row>
          {leave.remarks && <Row label="Remarks">{leave.remarks}</Row>}
          {leave.reviewed_at && <Row label="Reviewed On">{formatDate(leave.reviewed_at)}</Row>}
          <Row label="Applied On">{formatDate(leave.created_at)}</Row>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Leave Page ───────────────────────────────────────────────────────────
export default function LeaveList() {
  const toast = useToast()
  const [leaves, setLeaves]       = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [empFilter, setEmpFilter]       = useState('')
  const [modal, setModal]         = useState(null)  // null | 'apply' | 'review' | 'view'
  const [selected, setSelected]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 300 }
      if (statusFilter) params.status      = statusFilter
      if (typeFilter)   params.type        = typeFilter
      if (empFilter)    params.employee_id = empFilter
      const [leavRes, empRes] = await Promise.all([
        hrService.getLeaves(params),
        hrService.getEmployees({ limit: 500 }),
      ])
      setLeaves(leavRes.data)
      setEmployees(empRes.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, empFilter])

  useEffect(() => { load() }, [load])

  function handleSaved() {
    setModal(null)
    setSelected(null)
    load()
    toast.success('Leave request saved')
  }

  async function handleCancel(leave) {
    try {
      await hrService.cancelLeave(leave.id)
      load()
      toast.success('Leave request cancelled')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{leaves.length} request{leaves.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="apply-leave-btn" className="btn-primary" onClick={() => setModal('apply')}>
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="form-select flex-1 min-w-[180px]" value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
          <option value="">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <select className="form-select w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {LEAVE_STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-select w-36" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(statusFilter || typeFilter || empFilter) && (
          <button className="btn-ghost" onClick={() => { setStatusFilter(''); setTypeFilter(''); setEmpFilter('') }}>
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : leaves.length === 0 ? (
          <EmptyState icon={CalendarOff} title="No leave requests" description="Submit a leave request to get started."
            action={<button className="btn-primary" onClick={() => setModal('apply')}><Plus className="w-4 h-4" /> Apply for Leave</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-800">{leave.employee?.full_name || '—'}</p>
                        <p className="text-xs text-slate-500">{leave.employee?.job_title}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{leave.leave_type}</span>
                    </td>
                    <td>{formatDate(leave.start_date)}</td>
                    <td>{formatDate(leave.end_date)}</td>
                    <td className="font-semibold text-slate-700">{leave.total_days}</td>
                    <td><StatusBadge status={leave.status} /></td>
                    <td className="text-slate-500 text-xs">{formatDate(leave.created_at)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button id={`view-leave-${leave.id}`} title="View" className="btn-ghost p-1.5"
                          onClick={() => { setSelected(leave); setModal('view') }}>
                          <Eye className="w-4 h-4" />
                        </button>
                        {leave.status === 'PENDING' && (
                          <>
                            <button id={`review-leave-${leave.id}`} title="Review" className="btn-ghost p-1.5 text-primary-600 hover:bg-primary-50"
                              onClick={() => { setSelected(leave); setModal('review') }}>
                              <Check className="w-4 h-4" />
                            </button>
                            <button id={`cancel-leave-${leave.id}`} title="Cancel" className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                              onClick={() => handleCancel(leave)}>
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'apply' && (
        <ApplyLeaveModal employees={employees} onSave={handleSaved} onClose={() => setModal(null)} />
      )}
      {modal === 'review' && selected && (
        <ReviewModal leave={selected} onSave={handleSaved} onClose={() => { setModal(null); setSelected(null) }} />
      )}
      {modal === 'view' && selected && (
        <LeaveDetailModal leave={selected} onClose={() => { setModal(null); setSelected(null) }} />
      )}
    </div>
  )
}
