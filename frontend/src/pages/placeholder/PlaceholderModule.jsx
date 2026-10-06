import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Users, Building2, Boxes, Truck, DollarSign, BarChart3, CheckCircle2 } from 'lucide-react';

export const PlaceholderModule = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const moduleConfig = {
    '/modules/hr': {
      title: 'Human Resource Management',
      member: 'Member 2',
      icon: Users,
      description: 'Employee directory, department hierarchies, daily attendance, and leave management.',
      entities: ['employees', 'departments', 'attendance', 'leaves', 'payroll_records'],
      integrationWithSales: 'Sales representative commissions, sales team structure, and target allocations.',
    },
    '/modules/crm': {
      title: 'Customer Relationship Management',
      member: 'Member 3',
      icon: Building2,
      description: 'Lead generation, sales pipeline opportunities, contact history, and customer lifecycle.',
      entities: ['customers', 'leads', 'customer_history', 'communication_logs'],
      integrationWithSales: 'Member 5 imports customers directly from CRM to create quotations and orders.',
    },
    '/modules/inventory': {
      title: 'Inventory & Warehouse Management',
      member: 'Member 4',
      icon: Boxes,
      description: 'Multi-warehouse stock tracking, SKU categories, stock in/out movements, and low stock alerts.',
      entities: ['products', 'categories', 'warehouses', 'inventory', 'stock_movements'],
      integrationWithSales: 'Member 5 reserves and decrements product inventory upon order fulfillment.',
    },
    '/modules/procurement': {
      title: 'Procurement Management',
      member: 'Member 6',
      icon: Truck,
      description: 'Vendor & supplier management, purchase orders, goods receipt notes, and supplier bills.',
      entities: ['suppliers', 'purchase_orders', 'purchase_invoices', 'vendor_evaluations'],
      integrationWithSales: 'Back-to-back purchase ordering when sales order items are out of stock.',
    },
    '/modules/finance': {
      title: 'Financial Accounting & General Ledger',
      member: 'Member 6',
      icon: DollarSign,
      description: 'Chart of accounts, general ledger, expense tracking, and financial reconciliation.',
      entities: ['expenses', 'expense_categories', 'financial_transactions', 'journal_entries'],
      integrationWithSales: 'Sales invoices and payments automatically post debits/credits to Accounts Receivable.',
    },
    '/modules/reports': {
      title: 'Reports & Executive Analytics',
      member: 'Member 7',
      icon: BarChart3,
      description: 'Cross-module analytics, comprehensive financial reporting, sales metrics, and PDF exports.',
      entities: ['sales_reports', 'purchase_reports', 'inventory_reports', 'financial_reports'],
      integrationWithSales: 'Consumes Member 5 sales dashboard KPIs and transaction pipelines.',
    },
  };

  const current = moduleConfig[location.pathname] || {
    title: 'SmartERP Module Roadmap',
    member: 'Team Member',
    icon: Sparkles,
    description: 'Upcoming operational module within the unified SmartERP system.',
    entities: [],
    integrationWithSales: 'Unified database and shared RESTful API fabric.',
  };

  const Icon = current.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl mb-4 text-indigo-400">
          <Icon className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 mb-3">
          Assigned to: <span className="text-indigo-400 font-bold">{current.member}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {current.title}
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
          {current.description}
        </p>

        {/* Integration Callout */}
        <div className="mt-8 text-left bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            SmartERP System Integration Architecture
          </h4>
          <p className="text-xs text-slate-300">
            <strong>Sales Module (Member 5) Hook:</strong> {current.integrationWithSales}
          </p>

          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              Target Relational Tables:
            </span>
            <div className="flex flex-wrap gap-2">
              {current.entities.map((ent) => (
                <span
                  key={ent}
                  className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {ent}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
              Member 5: Sales (Quotations, Orders, Invoices, Payments) is currently live & active
            </span>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Active Sales Module</span>
          </button>
        </div>
      </div>
    </div>
  );
};
