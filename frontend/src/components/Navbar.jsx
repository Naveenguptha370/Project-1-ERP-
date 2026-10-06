import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/helpers'

const BREADCRUMBS = {
  '/hr':              ['HR', 'Overview'],
  '/hr/employees':    ['HR', 'Employees'],
  '/hr/departments':  ['HR', 'Departments'],
  '/hr/attendance':   ['HR', 'Attendance'],
  '/hr/leaves':       ['HR', 'Leave Management'],
}

export default function Navbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const crumbs = BREADCRUMBS[pathname] || ['HR']

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-slate-400">SmartERP</span>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-slate-300">/</span>
            <span className={i === crumbs.length - 1 ? 'font-semibold text-slate-800' : 'text-slate-500'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
            {getInitials(user?.full_name || 'Admin User')}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.full_name || 'Admin User'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.role || 'ADMIN'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
