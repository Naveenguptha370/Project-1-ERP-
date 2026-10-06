import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, Boxes, BriefcaseBusiness, CircleDollarSign, CreditCard, FileText, RefreshCw, ShoppingBag, Users } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { salesService } from '../../services/salesService';
import { formatCurrency } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';

const chartOptions = [
  { key: 'invoiced', label: 'Invoiced', color: 'bg-indigo-500', format: formatCurrency },
  { key: 'collected', label: 'Collected', color: 'bg-emerald-500', format: formatCurrency },
  { key: 'orders', label: 'Orders', color: 'bg-amber-500', format: formatCurrency },
  { key: 'quotations', label: 'Quotations', color: 'bg-sky-500', format: formatCurrency },
];

const activityLinks = {
  Payment: '/sales/payments',
  Invoice: '/sales/invoices',
  Order: '/sales/orders',
  Quotation: '/sales/quotations',
};

const kpis = [
  { key: 'revenue', title: 'Invoiced revenue', path: '/sales', icon: CircleDollarSign, format: formatCurrency },
  { key: 'customers', title: 'CRM customers', path: '/crm', icon: Users, format: (value) => value },
  { key: 'products', title: 'Active products', path: '/inventory', icon: Boxes, format: (value) => value },
  { key: 'open_purchase_orders', title: 'Open purchase orders', path: '/procurement', icon: BriefcaseBusiness, format: (value) => value },
  { key: 'approved_expenses', title: 'Approved expenses', path: '/finance', icon: CircleDollarSign, format: formatCurrency },
  { key: 'employees', title: 'Employees', path: '/hr', icon: Activity, format: (value) => value },
];

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [chartMetric, setChartMetric] = useState('invoiced');
  const [loading, setLoading] = useState(true);
  const { notifyError } = useNotification();

  const load = useCallback(async () => {
    setLoading(true);
    const [reportResult, salesResult] = await Promise.allSettled([
      businessService.getDashboardReport(),
      salesService.getDashboardData(),
    ]);

    if (reportResult.status === 'fulfilled') {
      setData(reportResult.value);
    } else {
      const error = reportResult.reason;
      notifyError(error.response?.data?.detail || 'Could not load the executive dashboard');
    }

    setSalesData(salesResult.status === 'fulfilled' ? salesResult.value : null);
    setLoading(false);
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);
  const selectedChart = chartOptions.find((option) => option.key === chartMetric) || chartOptions[0];
  const trends = salesData?.monthly_trends || [];
  const chartMax = Math.max(1, ...trends.map((month) => month[chartMetric] || 0));
  const latestActivities = salesData?.recent_activities || [];
  const values = data && {
    revenue: data.sales.revenue,
    customers: data.crm.customers,
    products: data.inventory.products,
    open_purchase_orders: data.procurement.open_purchase_orders,
    approved_expenses: data.finance.approved_expenses,
    employees: data.hr.employees,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">SmartERP overview</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Executive dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live operational metrics aggregated from your ERP records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data?.as_of && (
            <span className="text-xs text-slate-500">
              Updated {new Date(data.as_of).toLocaleString()}
            </span>
          )}
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {loading && !data ? <div className="rounded-xl bg-white p-8 text-sm text-slate-500 shadow-sm">Loading dashboard…</div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map(({ key, title, path, icon: Icon, format }) => (
              <Link key={key} to={path} className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                  {title}
                  <span className="flex items-center gap-2 text-indigo-600">
                    <Icon size={19} />
                    <ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">{format(values?.[key] ?? 0)}</div>
                <div className="mt-2 text-xs font-medium text-slate-500">Open module</div>
              </Link>
            ))}
          </div>
          {data && (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl bg-white p-5 text-slate-900 shadow-sm ring-1 ring-slate-200">
                <h2 className="font-semibold text-slate-800">Sales & receivables</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-slate-500">Collected</dt><dd className="mt-1 font-semibold text-slate-900">{formatCurrency(data.sales.paid)}</dd></div>
                  <div><dt className="text-slate-500">Outstanding</dt><dd className="mt-1 font-semibold text-slate-900">{formatCurrency(data.sales.outstanding)}</dd></div>
                  <div><dt className="text-slate-500">Revenue this month</dt><dd className="mt-1 font-semibold text-slate-900">{formatCurrency(data.sales.revenue_this_month)}</dd></div>
                  <div><dt className="text-slate-500">Sales orders</dt><dd className="mt-1 font-semibold text-slate-900">{data.sales.orders}</dd></div>
                </dl>
              </section>
              <section className="rounded-xl bg-white p-5 text-slate-900 shadow-sm ring-1 ring-slate-200">
                <h2 className="font-semibold text-slate-800">Operations</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-slate-500">Units on hand</dt><dd className="mt-1 font-semibold text-slate-900">{data.inventory.units_on_hand}</dd></div>
                  <div><dt className="text-slate-500">Inventory value</dt><dd className="mt-1 font-semibold text-slate-900">{formatCurrency(data.inventory.stock_value)}</dd></div>
                  <div><dt className="text-slate-500">Open leads</dt><dd className="mt-1 font-semibold text-slate-900">{data.crm.open_leads}</dd></div>
                  <div><dt className="text-slate-500">Expenses awaiting review</dt><dd className="mt-1 font-semibold text-slate-900">{data.finance.pending_expenses}</dd></div>
                </dl>
              </section>
            </div>
          )}
          {data && (
            <>
              <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-800">Sales activity</h2>
                    <p className="mt-1 text-sm text-slate-500">Monthly totals from recorded sales transactions.</p>
                  </div>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Select sales chart metric">
                    {chartOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={chartMetric === option.key}
                        onClick={() => setChartMetric(option.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          chartMetric === option.key
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {trends.map((month) => {
                    const amount = month[chartMetric] || 0;
                    const width = amount > 0 ? Math.max(3, Math.round((amount / chartMax) * 100)) : 0;
                    return (
                      <div key={month.month} className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                        <span className="text-slate-600">{month.month}</span>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${selectedChart.color}`}
                            style={{ width: `${width}%` }}
                            title={`${selectedChart.label}: ${selectedChart.format(amount)}`}
                          />
                        </div>
                        <span className="min-w-24 text-right font-semibold text-slate-800">{selectedChart.format(amount)}</span>
                      </div>
                    );
                  })}
                  {trends.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-500">Sales analytics are not available yet.</p>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-slate-800">Recent sales activity</h2>
                    <p className="mt-1 text-sm text-slate-500">Latest recorded orders, invoices, and payments.</p>
                  </div>
                  <Link to="/sales" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View sales</Link>
                </div>
                {latestActivities.length ? (
                  <div className="divide-y divide-slate-100">
                    {latestActivities.slice(0, 5).map((activity) => (
                      <Link
                        key={activity.id}
                        to={activityLinks[activity.type] || '/sales'}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50 focus:outline-none focus-visible:bg-indigo-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                            {activity.type === 'Payment' ? <CreditCard size={16} /> : activity.type === 'Order' ? <ShoppingBag size={16} /> : <FileText size={16} />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-800">{activity.number} · {activity.customer}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{activity.type} · {activity.date} · {activity.status}</span>
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(activity.amount)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">No sales transactions have been recorded yet.</p>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
