import React from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/layout/Breadcrumb';
import { 
  Boxes, 
  Users, 
  UserCheck, 
  ShoppingCart, 
  Briefcase, 
  BarChart3, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard() {
  const teamModules = [
    {
      category: 'Operations',
      title: 'Inventory Management',
      desc: 'Products, Categories, Warehouses, Stock Operations, Stock Movements, Low Stock Alerts.',
      path: '/inventory',
      icon: Boxes,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      active: true,
      tag: 'Fully Implemented'
    },
    {
      category: 'Security',
      title: 'Authentication & Security',
      desc: 'JWT Authentication, Roles, Permissions, User Management.',
      path: '/login',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      active: true,
      tag: 'Operational'
    },
    {
      category: 'Workforce',
      title: 'HR Management',
      desc: 'Employees, Departments, Attendance, Leave Management.',
      path: '/hr',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      active: false,
      tag: 'Upcoming'
    },
    {
      category: 'Customer',
      title: 'CRM',
      desc: 'Customers, Leads, Customer Interactions, Pipeline.',
      path: '/crm',
      icon: UserCheck,
      color: 'bg-violet-50 text-violet-600 border-violet-200',
      active: false,
      tag: 'Upcoming'
    },
    {
      category: 'Commerce',
      title: 'Sales Management',
      desc: 'Quotations, Orders, Invoices, Payments (integrates with Inventory deduct_stock).',
      path: '/sales',
      icon: ShoppingCart,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      active: false,
      tag: 'Upcoming'
    },
    {
      category: 'Finance',
      title: 'Procurement & Finance',
      desc: 'Suppliers, Purchase Orders, Invoices, Expenses (integrates with Inventory add_stock).',
      path: '/procurement',
      icon: Briefcase,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      active: false,
      tag: 'Upcoming'
    },
    {
      category: 'Intelligence',
      title: 'Dashboard, Reports & Integration',
      desc: 'Executive Dashboards, Inventory Valuation, Movement Reports, Cross-module Analytics.',
      path: '/reports',
      icon: BarChart3,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      active: false,
      tag: 'Upcoming'
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'SmartERP Executive Overview', url: '/' }]} />

      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 lg:p-8 text-white mb-8 shadow-xl border border-indigo-900/50">
        <div className="max-w-3xl">
          <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
            Enterprise System
          </span>
          <h1 className="text-2xl lg:text-3xl font-extrabold mt-3 tracking-tight">
            Welcome to SmartERP
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Integrated Enterprise Resource Planning platform. The complete <strong className="text-white">Inventory, Warehousing, and Stock Operations</strong> subsystem is active and fully functional.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/inventory"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <Boxes className="w-4 h-4" />
              <span>Open Inventory Subsystem</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Enterprise ERP Modules
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamModules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                m.active ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${m.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.active 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {m.tag}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                  {m.category}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{m.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.desc}</p>
              </div>
              <Link
                to={m.path}
                className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition pt-2 border-t border-slate-100"
              >
                <span>Access Module</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
