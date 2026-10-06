import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  Users, 
  UserCheck, 
  ShoppingCart, 
  Briefcase, 
  BarChart3,
  Package,
  FolderTree,
  Warehouse,
  AlertTriangle,
  History,
  FileText,
  CreditCard,
  Receipt,
  Wallet,
} from 'lucide-react';

const mainNavigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, role: 'All' },
  { 
    name: 'Sales Management', 
    path: '/sales', 
    icon: ShoppingCart, 
    highlight: true,
    children: [
      { name: 'Sales Overview', path: '/sales', icon: LayoutDashboard, end: true },
      { name: 'Quotations', path: '/sales/quotations', icon: FileText },
      { name: 'Sales Orders', path: '/sales/orders', icon: ShoppingCart },
      { name: 'Invoices', path: '/sales/invoices', icon: Receipt },
      { name: 'Payments', path: '/sales/payments', icon: CreditCard },
    ]
  },
  { 
    name: 'Inventory', 
    path: '/inventory', 
    icon: Boxes, 
    highlight: true,
    children: [
      { name: 'Overview', path: '/inventory', icon: LayoutDashboard, end: true },
      { name: 'Products', path: '/inventory/products', icon: Package },
      { name: 'Categories', path: '/inventory/categories', icon: FolderTree },
      { name: 'Warehouses', path: '/inventory/warehouses', icon: Warehouse },
      { name: 'Stock Overview', path: '/inventory/stock', icon: Boxes },
      { name: 'Stock Movements', path: '/inventory/movements', icon: History },
      { name: 'Low Stock Alerts', path: '/inventory/low-stock', icon: AlertTriangle, alert: true },
    ]
  },
  { 
    name: 'HR Management', 
    path: '/hr', 
    icon: Users,
    children: [
      { name: 'HR Overview', path: '/hr', icon: LayoutDashboard, end: true },
      { name: 'Employees', path: '/hr/employees', icon: Users },
      { name: 'Departments', path: '/hr/departments', icon: FolderTree },
      { name: 'Attendance', path: '/hr/attendance', icon: History },
      { name: 'Leaves', path: '/hr/leaves', icon: FileText },
    ]
  },
  { name: 'CRM', path: '/crm', icon: UserCheck },
  { name: 'Procurement', path: '/procurement', icon: Briefcase },
  { name: 'Finance', path: '/finance', icon: Wallet },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          SmartERP Platform
        </div>
        <div className="text-xs text-indigo-400 mt-0.5">
          Unified Multi-Module Enterprise
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {mainNavigation.map((item) => {
          const Icon = item.icon;
          if (item.children) {
            return (
              <div key={item.name} className="pt-2">
                <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-100 uppercase tracking-wider bg-slate-800/80 rounded-lg border border-slate-700/50">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="mt-1 pl-2 space-y-1">
                  {item.children.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        end={sub.end}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-500/20'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <div className="flex items-center space-x-2.5">
                          <SubIcon className="w-3.5 h-3.5" />
                          <span>{sub.name}</span>
                        </div>
                        {sub.alert && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="text-[11px] text-slate-400">
          Connected System:
        </div>
        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          SmartERP / Active
        </div>
      </div>
    </aside>
  );
}
