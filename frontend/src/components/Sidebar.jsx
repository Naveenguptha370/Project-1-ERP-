import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, Clock, CalendarOff,
  ShoppingCart, Package, TrendingUp, DollarSign, BarChart3,
  ChevronRight, Briefcase,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'HR Management',
    items: [
      { to: '/hr',              icon: LayoutDashboard, label: 'HR Overview'  },
      { to: '/hr/employees',    icon: Users,           label: 'Employees'    },
      { to: '/hr/departments',  icon: Building2,        label: 'Departments'  },
      { to: '/hr/attendance',   icon: Clock,           label: 'Attendance'   },
      { to: '/hr/leaves',       icon: CalendarOff,     label: 'Leave Mgmt'   },
    ],
  },
  {
    label: 'Other Modules',
    items: [
      { to: '/crm',         icon: Briefcase,      label: 'CRM',                  soon: true },
      { to: '/inventory',   icon: Package,        label: 'Inventory',            soon: true },
      { to: '/sales',       icon: ShoppingCart,   label: 'Sales',                soon: true },
      { to: '/procurement', icon: DollarSign,     label: 'Procurement',          soon: true },
      { to: '/reports',     icon: BarChart3,      label: 'Dashboard & Reports',  soon: true },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar text-white flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight">SmartERP</span>
            <div className="text-[10px] text-white/40 -mt-0.5 uppercase tracking-widest">Enterprise</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <div className="px-3 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label, soon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/hr'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                      ${isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                        : 'text-white/60 hover:text-white hover:bg-white/8'
                      }
                      ${soon ? 'opacity-50 cursor-default pointer-events-none' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {soon && (
                      <span className="text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                        Soon
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/25 text-center">SmartERP v1.0 · Member 2</p>
      </div>
    </aside>
  )
}
