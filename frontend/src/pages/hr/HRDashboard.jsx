import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2, Clock, CalendarOff, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react'
import { hrService } from '../../services/hrService'
import { Spinner } from '../../components/ui'
import { getErrorMessage } from '../../utils/helpers'

export default function HRDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await hrService.getHRSummary()
      setSummary(response.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSummary() }, [loadSummary])

  const stats = [
    { label: 'Total Employees',    value: summary?.total_employees,  icon: Users,       color: 'bg-indigo-100 text-indigo-600',  link: '/hr/employees'   },
    { label: 'Departments',        value: summary?.total_departments, icon: Building2,   color: 'bg-emerald-100 text-emerald-600', link: '/hr/departments' },
    { label: 'Present Today',      value: summary?.present_today,     icon: Clock,       color: 'bg-blue-100 text-blue-600',      link: '/hr/attendance'  },
    { label: 'Pending Leaves',     value: summary?.pending_leaves,    icon: CalendarOff, color: 'bg-amber-100 text-amber-600',    link: '/hr/leaves'      },
  ]

  const quickLinks = [
    { label: 'Add Employee',      to: '/hr/employees',   desc: 'Register a new team member' },
    { label: 'Manage Departments', to: '/hr/departments', desc: 'View and edit departments'  },
    { label: 'Record Attendance', to: '/hr/attendance',  desc: 'Mark today\'s attendance'   },
    { label: 'Review Leaves',     to: '/hr/leaves',      desc: 'Approve pending requests'   },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary-600" />
            HR Management
          </h1>
          <p className="page-subtitle">Employee, department, attendance, and leave activity.</p>
        </div>
        <button onClick={loadSummary} disabled={loading} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>Could not load HR summary: {error}</span>
          <button onClick={loadSummary} className="font-semibold underline">Try again</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="stat-card group hover:shadow-md transition-shadow">
            <div className={`stat-icon ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
              {loading
                ? <Spinner size="sm" className="mt-1" />
                : <p className="text-2xl font-bold text-slate-900 mt-0.5">{error ? '—' : value ?? 0}</p>
              }
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(({ label, to, desc }) => (
            <Link key={label} to={to}
              className="card p-4 hover:shadow-md hover:border-primary-200 transition-all group cursor-pointer">
              <p className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">{label}</p>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 mt-2 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Module info */}
      <div className="card p-5 border-primary-200 bg-primary-50">
        <p className="text-sm font-semibold text-primary-800 mb-1">✅ Module 2 — HR Management (Member 2)</p>
        <p className="text-xs text-primary-700">
        Employees · Departments · Attendance · Leave Management — connected to the SmartERP SQLite database through FastAPI.
        </p>
      </div>
    </div>
  )
}
