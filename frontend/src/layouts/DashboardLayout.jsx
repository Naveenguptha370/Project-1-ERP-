import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ShoppingBag,
  Receipt,
  CreditCard,
  Users,
  Building2,
  Boxes,
  Truck,
  DollarSign,
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
  Plus,
  ChevronDown,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Sales Overview', path: '/', icon: LayoutDashboard, exact: true },
    { name: 'Quotations', path: '/sales/quotations', icon: FileSpreadsheet },
    { name: 'Sales Orders', path: '/sales/orders', icon: ShoppingBag },
    { name: 'Invoices', path: '/sales/invoices', icon: Receipt },
    { name: 'Payments & Receipts', path: '/sales/payments', icon: CreditCard },
  ];

  const teamModules = [
    { name: 'HR Management', path: '/modules/hr', icon: Users, member: 'Member 2' },
    { name: 'CRM & Leads', path: '/modules/crm', icon: Building2, member: 'Member 3' },
    { name: 'Inventory & Stock', path: '/modules/inventory', icon: Boxes, member: 'Member 4' },
    { name: 'Procurement', path: '/modules/procurement', icon: Truck, member: 'Member 6' },
    { name: 'Finance & Ledger', path: '/modules/finance', icon: DollarSign, member: 'Member 6' },
    { name: 'Reports & Analytics', path: '/modules/reports', icon: BarChart3, member: 'Member 7' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-xl shrink-0 z-20">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-xl font-black text-white tracking-wider">S</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">SmartERP</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-indigo-400/90 font-medium">Enterprise Suite</p>
            </div>
          </div>
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping" />
              Member 5: Sales Active
            </span>
            <span className="text-[10px] text-slate-400">Phase 1</span>
          </div>
        </div>

        {/* Navigation Scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Active Sales Module */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Sales Management
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-medium px-1.5 py-0.2 rounded">
                Active
              </span>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Team Roadmap Modules */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                Team Allocation
              </span>
              <span className="text-[10px] text-slate-500">Upcoming</span>
            </div>
            <nav className="space-y-1">
              {teamModules.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`
                  }
                >
                  <div className="flex items-center space-x-2.5">
                    <item.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                    {item.member}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                    {role}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/70 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">SmartERP</span>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-semibold text-indigo-400 capitalize">
                {location.pathname === '/'
                  ? 'Dashboard'
                  : location.pathname.split('/').filter(Boolean).join(' / ')}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            {/* System Status Pill */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">Local Engine Ready</span>
              <span className="text-slate-500">|</span>
              <span className="text-indigo-400 font-medium">FastAPI + PostgreSQL/SQLite</span>
            </div>

            {/* Quick Action Button */}
            <div className="relative">
              <button
                onClick={() => setQuickActionOpen(!quickActionOpen)}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Transaction</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>

              {quickActionOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <button
                    onClick={() => navigate('/sales/quotations?action=new')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-indigo-600 hover:text-white flex items-center space-x-2 text-slate-300 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                    <span>Create Quotation</span>
                  </button>
                  <button
                    onClick={() => navigate('/sales/orders?action=new')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-indigo-600 hover:text-white flex items-center space-x-2 text-slate-300 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                    <span>New Sales Order</span>
                  </button>
                  <button
                    onClick={() => navigate('/sales/invoices?action=new')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-indigo-600 hover:text-white flex items-center space-x-2 text-slate-300 transition-colors"
                  >
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Generate Invoice</span>
                  </button>
                  <button
                    onClick={() => navigate('/sales/payments?action=new')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-indigo-600 hover:text-white flex items-center space-x-2 text-slate-300 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Record Payment</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Profile Link */}
            <button
              onClick={() => navigate('/profile')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="User Security Profile"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col z-50">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-white">SmartERP Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 flex-1 overflow-y-auto space-y-4">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.exact}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
