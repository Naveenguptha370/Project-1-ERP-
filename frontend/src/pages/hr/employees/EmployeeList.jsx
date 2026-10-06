import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Users, X, ChevronDown } from 'lucide-react'
import { hrService } from '../../../services/hrService'
import { Spinner, EmptyState, StatusBadge, Alert, ConfirmDialog, Toast } from '../../../components/ui'
import { useToast } from '../../../hooks/useToast'
import { getErrorMessage, formatDate, formatCurrency, getInitials, EMPLOYEE_STATUSES, GENDERS } from '../../../utils/helpers'

// ── Employee Form Modal ────────────────────────────────────────────────────────
function EmployeeModal({ employee, departments, onSave, onClose }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    job_title: '', department_id: '', hire_date: '', salary: '',
    status: 'ACTIVE', gender: '', date_of_birth: '', address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    ...(employee || {}),
    department_id: employee?.department?.id ?? employee?.department_id ?? '',
    salary: employee?.salary ?? '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim())  e.last_name  = 'Required'
    if (!form.email.trim())      e.email      = 'Required'
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.job_title.trim()) e.job_title = 'Required'
    if (!form.hire_date)        e.hire_date = 'Required'
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
        department_id: form.department_id ? Number(form.department_id) : null,
        salary: form.salary ? Number(form.salary) : null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
      }
      if (employee) {
        await hrService.updateEmployee(employee.id, payload)
      } else {
        await hrService.createEmployee(payload)
      }
      onSave()
    } catch (err) {
      setErrors({ _global: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const F = ({ label, name, type = 'text', required, children, className = '' }) => (
    <div className={className}>
      <label className="form-label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children || (
        <input
          type={type}
          value={form[name] ?? ''}
          onChange={e => set(name, e.target.value)}
          className={errors[name] ? 'form-input-error' : 'form-input'}
        />
      )}
      {errors[name] && <p className="form-error">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-slate-800">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {errors._global && <Alert type="error" message={errors._global} />}

            <div className="grid grid-cols-2 gap-4">
              <F label="First Name" name="first_name" required />
              <F label="Last Name"  name="last_name"  required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <F label="Email" name="email" type="email" required />
              <F label="Phone" name="phone" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <F label="Job Title" name="job_title" required />
              <F label="Department" name="department_id">
                <select value={form.department_id} onChange={e => set('department_id', e.target.value)} className="form-select">
                  <option value="">— No Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </F>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <F label="Hire Date" name="hire_date" type="date" required />
              <F label="Salary (USD)" name="salary" type="number" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <F label="Status" name="status">
                <select value={form.status} onChange={e => set('status', e.target.value)} className="form-select">
                  {EMPLOYEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
              <F label="Gender" name="gender">
                <select value={form.gender || ''} onChange={e => set('gender', e.target.value)} className="form-select">
                  <option value="">— Select —</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}
                </select>
              </F>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <F label="Date of Birth" name="date_of_birth" type="date" />
              <F label="Address" name="address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <F label="Emergency Contact Name"  name="emergency_contact_name" />
              <F label="Emergency Contact Phone" name="emergency_contact_phone" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving…' : employee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Employee Detail Modal ──────────────────────────────────────────────────────
function EmployeeDetailModal({ employee, onClose }) {
  const Row = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value || '—'}</span>
    </div>
  )
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold">
              {getInitials(employee.full_name)}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{employee.full_name}</h2>
              <p className="text-xs text-slate-500">{employee.employee_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <div className="modal-body space-y-1">
          <Row label="Email"      value={employee.email} />
          <Row label="Phone"      value={employee.phone} />
          <Row label="Job Title"  value={employee.job_title} />
          <Row label="Department" value={employee.department?.name} />
          <Row label="Hire Date"  value={formatDate(employee.hire_date)} />
          <Row label="Salary"     value={formatCurrency(employee.salary)} />
          <Row label="Status">
            <StatusBadge status={employee.status} />
          </Row>
          <Row label="Gender"     value={employee.gender?.replace(/_/g, ' ')} />
          <Row label="DOB"        value={formatDate(employee.date_of_birth)} />
          <Row label="Address"    value={employee.address} />
          <Row label="Emergency"  value={employee.emergency_contact_name
            ? `${employee.emergency_contact_name} · ${employee.emergency_contact_phone || ''}`
            : null}
          />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Employee List Page ───────────────────────────────────────────────────
export default function EmployeeList() {
  const toast = useToast()
  const [employees, setEmployees]   = useState([])
  const [departments, setDepts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal]           = useState(null)   // null | 'add' | 'edit' | 'view'
  const [selected, setSelected]     = useState(null)
  const [confirm, setConfirm]       = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 200 }
      if (search)      params.search        = search
      if (deptFilter)  params.department_id = deptFilter
      if (statusFilter) params.status       = statusFilter
      const [empRes, deptRes] = await Promise.all([
        hrService.getEmployees(params),
        hrService.getDepartments({ active_only: true }),
      ])
      setEmployees(empRes.data)
      setDepts(deptRes.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, deptFilter, statusFilter])

  useEffect(() => { load() }, [load])

  function handleSaved() {
    setModal(null)
    setSelected(null)
    load()
    toast.success('Employee saved successfully')
  }

  function handleDeactivate(emp) {
    setConfirm({
      title: 'Deactivate Employee',
      message: `Are you sure you want to deactivate ${emp.full_name}? Their records will be preserved.`,
      onConfirm: async () => {
        try {
          await hrService.deactivateEmployee(emp.id)
          setConfirm(null)
          load()
          toast.success('Employee deactivated')
        } catch (err) {
          toast.error(getErrorMessage(err))
        }
      },
    })
  }

  return (
    <div className="animate-fade-in space-y-4">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} employee{employees.length !== 1 ? 's' : ''} found</p>
        </div>
        <button id="add-employee-btn" className="btn-primary" onClick={() => { setSelected(null); setModal('add') }}>
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="form-input pl-9"
            placeholder="Search by name, email, ID, title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select w-44" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-select w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {EMPLOYEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || deptFilter || statusFilter) && (
          <button className="btn-ghost" onClick={() => { setSearch(''); setDeptFilter(''); setStatusFilter('') }}>
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : employees.length === 0 ? (
          <EmptyState icon={Users} title="No employees found" description="Add your first employee to get started."
            action={<button className="btn-primary" onClick={() => setModal('add')}><Plus className="w-4 h-4" /> Add Employee</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Job Title</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                          {getInitials(emp.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{emp.full_name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{emp.employee_id}</span></td>
                    <td>{emp.department?.name || <span className="text-slate-400">—</span>}</td>
                    <td>{emp.job_title}</td>
                    <td className="text-slate-500">{formatDate(emp.hire_date)}</td>
                    <td><StatusBadge status={emp.status} /></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button id={`view-emp-${emp.id}`} title="View" className="btn-ghost p-1.5"
                          onClick={() => { setSelected(emp); setModal('view') }}>
                          <Users className="w-4 h-4" />
                        </button>
                        <button id={`edit-emp-${emp.id}`} title="Edit" className="btn-ghost p-1.5"
                          onClick={() => { setSelected(emp); setModal('edit') }}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {emp.status !== 'TERMINATED' && (
                          <button id={`deact-emp-${emp.id}`} title="Deactivate" className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                            onClick={() => handleDeactivate(emp)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <EmployeeModal
          employee={modal === 'edit' ? selected : null}
          departments={departments}
          onSave={handleSaved}
          onClose={() => { setModal(null); setSelected(null) }}
        />
      )}
      {modal === 'view' && selected && (
        <EmployeeDetailModal employee={selected} onClose={() => { setModal(null); setSelected(null) }} />
      )}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
        confirmText="Deactivate"
        danger
      />
    </div>
  )
}
