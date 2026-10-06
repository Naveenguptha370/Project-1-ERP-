import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Building2, X, Users } from 'lucide-react'
import { hrService } from '../../../services/hrService'
import { Spinner, EmptyState, Alert, ConfirmDialog, Toast } from '../../../components/ui'
import { useToast } from '../../../hooks/useToast'
import { getErrorMessage } from '../../../utils/helpers'

// ── Department Modal ──────────────────────────────────────────────────────────
function DepartmentModal({ dept, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', code: '', description: '', is_active: true, ...(dept || {}) })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Department name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      if (dept) await hrService.updateDepartment(dept.id, form)
      else       await hrService.createDepartment(form)
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
            {dept ? 'Edit Department' : 'Add Department'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {errors._global && <Alert type="error" message={errors._global} />}

            <div>
              <label className="form-label">Name <span className="text-red-500">*</span></label>
              <input className={errors.name ? 'form-input-error' : 'form-input'} value={form.name}
                onChange={e => set('name', e.target.value)} placeholder="e.g. Engineering" />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div>
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code || ''} onChange={e => set('code', e.target.value)}
                placeholder="e.g. ENG (auto-uppercased)" />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input resize-none" rows={3} value={form.description || ''}
                onChange={e => set('description', e.target.value)} placeholder="Optional description" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={e => set('is_active', e.target.checked)}
                className="w-4 h-4 rounded text-primary-600" />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving…' : dept ? 'Save Changes' : 'Add Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Department Employees Modal ────────────────────────────────────────────────
function DeptEmployeesModal({ dept, onClose }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hrService.getDepartmentEmployees(dept.id)
      .then(r => setEmployees(r.data))
      .finally(() => setLoading(false))
  }, [dept.id])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-semibold text-slate-800">{dept.name} — Employees</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <div className="modal-body">
          {loading ? <div className="flex justify-center py-8"><Spinner /></div> :
            employees.length === 0
              ? <p className="text-sm text-slate-500 text-center py-8">No employees in this department</p>
              : <ul className="divide-y divide-slate-100">
                  {employees.map(e => (
                    <li key={e.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm text-slate-800">{e.full_name}</p>
                        <p className="text-xs text-slate-500">{e.job_title}</p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{e.employee_id}</span>
                    </li>
                  ))}
                </ul>
          }
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Department List Page ─────────────────────────────────────────────────
export default function DepartmentList() {
  const toast = useToast()
  const [depts, setDepts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)   // null | 'add' | 'edit' | 'employees'
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await hrService.getDepartments({ limit: 200 })
      setDepts(r.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleSaved() {
    setModal(null)
    setSelected(null)
    load()
    toast.success('Department saved successfully')
  }

  function handleDelete(dept) {
    setConfirm({
      title: 'Delete Department',
      message: dept.employee_count > 0
        ? `Cannot delete — ${dept.employee_count} employee(s) are assigned. Reassign them first.`
        : `Delete "${dept.name}"? This cannot be undone.`,
      disabled: dept.employee_count > 0,
      onConfirm: async () => {
        try {
          await hrService.deleteDepartment(dept.id)
          setConfirm(null)
          load()
          toast.success('Department deleted')
        } catch (err) {
          toast.error(getErrorMessage(err))
          setConfirm(null)
        }
      },
    })
  }

  return (
    <div className="animate-fade-in space-y-4">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{depts.length} department{depts.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="add-dept-btn" className="btn-primary" onClick={() => { setSelected(null); setModal('add') }}>
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : depts.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet"
          action={<button className="btn-primary" onClick={() => setModal('add')}><Plus className="w-4 h-4" /> Add Department</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map(dept => (
            <div key={dept.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{dept.name}</h3>
                    {dept.code && <span className="text-xs font-mono text-slate-400">{dept.code}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button id={`edit-dept-${dept.id}`} title="Edit" className="btn-ghost p-1.5"
                    onClick={() => { setSelected(dept); setModal('edit') }}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button id={`del-dept-${dept.id}`} title="Delete" className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(dept)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {dept.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{dept.description}</p>
              )}

              <div className="flex items-center justify-between">
                <button
                  className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:underline"
                  onClick={() => { setSelected(dept); setModal('employees') }}>
                  <Users className="w-3.5 h-3.5" />
                  {dept.employee_count ?? 0} employee{dept.employee_count !== 1 ? 's' : ''}
                </button>
                <span className={`badge ${dept.is_active ? 'badge-green' : 'badge-gray'}`}>
                  {dept.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <DepartmentModal dept={modal === 'edit' ? selected : null} onSave={handleSaved}
          onClose={() => { setModal(null); setSelected(null) }} />
      )}
      {modal === 'employees' && selected && (
        <DeptEmployeesModal dept={selected} onClose={() => { setModal(null); setSelected(null) }} />
      )}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={confirm?.disabled ? () => setConfirm(null) : confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
        confirmText={confirm?.disabled ? 'OK' : 'Delete'}
        danger={!confirm?.disabled}
      />
    </div>
  )
}
