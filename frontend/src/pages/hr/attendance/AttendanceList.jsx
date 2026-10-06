import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Clock, X, Filter } from 'lucide-react'
import { hrService } from '../../../services/hrService'
import { Spinner, EmptyState, Alert, ConfirmDialog, StatusBadge, Toast } from '../../../components/ui'
import { useToast } from '../../../hooks/useToast'
import { getErrorMessage, formatDate, formatTime, ATTENDANCE_STATUSES } from '../../../utils/helpers'

// ── Attendance Modal ──────────────────────────────────────────────────────────
function AttendanceModal({ record, employees, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    employee_id: '', date: today, check_in: '', check_out: '',
    status: 'PRESENT', remarks: '',
    ...(record ? {
      ...record,
      employee_id: record.employee_id,
      check_in:  record.check_in  ? record.check_in.slice(0, 5)  : '',
      check_out: record.check_out ? record.check_out.slice(0, 5) : '',
    } : {}),
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (!form.employee_id) e.employee_id = 'Select an employee'
    if (!form.date)        e.date        = 'Date is required'
    if (!form.status)      e.status      = 'Status is required'
    if (form.check_in && form.check_out && form.check_out <= form.check_in)
      e.check_out = 'Check-out must be after check-in'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        employee_id: Number(form.employee_id),
        check_in:  form.check_in  ? form.check_in + ':00'  : null,
        check_out: form.check_out ? form.check_out + ':00' : null,
      }
      if (record) await hrService.updateAttendance(record.id, payload)
      else        await hrService.createAttendance(payload)
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
          <h2 className="text-lg font-semibold text-slate-800">
            {record ? 'Edit Attendance' : 'Record Attendance'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {errors._global && <Alert type="error" message={errors._global} />}

            {!record && (
              <div>
                <label className="form-label">Employee <span className="text-red-500">*</span></label>
                <select className={errors.employee_id ? 'form-input-error' : 'form-select'}
                  value={form.employee_id} onChange={e => set('employee_id', e.target.value)}>
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>
                  ))}
                </select>
                {errors.employee_id && <p className="form-error">{errors.employee_id}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date <span className="text-red-500">*</span></label>
                <input type="date" className={errors.date ? 'form-input-error' : 'form-input'}
                  value={form.date} onChange={e => set('date', e.target.value)} />
                {errors.date && <p className="form-error">{errors.date}</p>}
              </div>
              <div>
                <label className="form-label">Status <span className="text-red-500">*</span></label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  {ATTENDANCE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Check In</label>
                <input type="time" className="form-input" value={form.check_in}
                  onChange={e => set('check_in', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Check Out</label>
                <input type="time" className="form-input" value={form.check_out}
                  onChange={e => set('check_out', e.target.value)} />
                {errors.check_out && <p className="form-error">{errors.check_out}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Remarks</label>
              <textarea className="form-input resize-none" rows={2} value={form.remarks}
                onChange={e => set('remarks', e.target.value)} placeholder="Optional note" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving…' : record ? 'Update' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Attendance Page ──────────────────────────────────────────────────────
export default function AttendanceList() {
  const toast = useToast()
  const [records, setRecords]   = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]   = useState(true)
  const [empFilter, setEmpFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [modal, setModal]       = useState(false)
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 300 }
      if (empFilter)    params.employee_id = empFilter
      if (statusFilter) params.status      = statusFilter
      if (dateFrom)     params.date_from   = dateFrom
      if (dateTo)       params.date_to     = dateTo
      const [attRes, empRes] = await Promise.all([
        hrService.getAttendance(params),
        hrService.getEmployees({ limit: 500 }),
      ])
      setRecords(attRes.data)
      setEmployees(empRes.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [empFilter, statusFilter, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  function handleSaved() {
    setModal(false)
    setSelected(null)
    load()
    toast.success('Attendance recorded')
  }

  function handleDelete(rec) {
    setConfirm({
      title: 'Delete Record',
      message: `Delete attendance for ${rec.employee?.full_name} on ${formatDate(rec.date)}?`,
      onConfirm: async () => {
        try {
          await hrService.deleteAttendance(rec.id)
          setConfirm(null); load()
          toast.success('Record deleted')
        } catch (err) { toast.error(getErrorMessage(err)) }
      },
    })
  }

  return (
    <div className="animate-fade-in space-y-4">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">{records.length} record{records.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="add-attendance-btn" className="btn-primary" onClick={() => { setSelected(null); setModal(true) }}>
          <Plus className="w-4 h-4" /> Record Attendance
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select className="form-select flex-1 min-w-[180px]" value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <select className="form-select w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {ATTENDANCE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <input type="date" className="form-input w-40" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
          <input type="date" className="form-input w-40" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
          {(empFilter || statusFilter || dateFrom || dateTo) && (
            <button className="btn-ghost" onClick={() => { setEmpFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo('') }}>
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : records.length === 0 ? (
          <EmptyState icon={Clock} title="No attendance records" description="Record attendance to get started."
            action={<button className="btn-primary" onClick={() => setModal(true)}><Plus className="w-4 h-4" /> Record</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec.id}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-800">{rec.employee?.full_name || '—'}</p>
                        <p className="text-xs text-slate-500">{rec.employee?.department?.name}</p>
                      </div>
                    </td>
                    <td>{formatDate(rec.date)}</td>
                    <td>{formatTime(rec.check_in)}</td>
                    <td>{formatTime(rec.check_out)}</td>
                    <td><StatusBadge status={rec.status} /></td>
                    <td className="text-slate-500 text-xs max-w-[120px] truncate">{rec.remarks || '—'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button id={`edit-att-${rec.id}`} title="Edit" className="btn-ghost p-1.5"
                          onClick={() => { setSelected(rec); setModal(true) }}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button id={`del-att-${rec.id}`} title="Delete" className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(rec)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <AttendanceModal
          record={selected}
          employees={employees}
          onSave={handleSaved}
          onClose={() => { setModal(false); setSelected(null) }}
        />
      )}
      <ConfirmDialog isOpen={!!confirm} title={confirm?.title} message={confirm?.message}
        onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} confirmText="Delete" danger />
    </div>
  )
}
