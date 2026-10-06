import React, { useState, useEffect } from 'react';
import { salesService } from '../../services/salesService';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../utils/constants';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  ShoppingBag,
  FileSpreadsheet,
  ArrowUpRight,
  RefreshCw,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await salesService.getDashboardData();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const kpis = data?.kpis;
  const monthlyMax = Math.max(
    1,
    ...(data?.monthly_trends || []).flatMap((item) => [item.invoiced, item.collected]),
  );
  const hasMonthlySales = (data?.monthly_trends || []).some(
    (item) => item.invoiced > 0 || item.collected > 0,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900/80 to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live sales overview
              </span>
              <span className="text-xs text-slate-400">Figures from saved sales records</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Sales & Receivables
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Review invoiced revenue, customer collections, open receivables, and quotation conversion from your recorded transactions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboard}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/sales/quotations')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <span>Manage Pipeline</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Invoiced Revenue"
          value={formatCurrency(kpis?.total_revenue || 0)}
          icon={Receipt}
          color="indigo"
          subtitle={`${kpis?.invoices_count || 0} commercial invoices issued`}
        />
        <StatCard
          title="Collected Cash"
          value={formatCurrency(kpis?.total_paid || 0)}
          icon={CreditCard}
          color="emerald"
          subtitle={`${kpis?.payments_count || 0} payment receipts settled`}
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(kpis?.total_outstanding || 0)}
          icon={DollarSign}
          color="amber"
          subtitle="Pending customer collections"
        />
        <StatCard
          title="Quotation Win Rate"
          value={`${kpis?.conversion_rate || 0}%`}
          icon={TrendingUp}
          color="cyan"
          subtitle={`${kpis?.quotations_count || 0} quotations recorded`}
        />
      </div>

      {/* Pipeline Stepper Funnel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Commercial Lifecycle Funnel
            </h3>
            <p className="text-xs text-slate-500">End-to-end sales execution stages</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/sales/quotations')}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-indigo-400">Stage 1</span>
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white group-hover:text-indigo-300">
              {kpis?.quotations_count || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Quotations Issued</div>
          </div>

          <div
            onClick={() => navigate('/sales/orders')}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-cyan-400">Stage 2</span>
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white group-hover:text-cyan-300">
              {kpis?.orders_count || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Sales Orders Booked</div>
          </div>

          <div
            onClick={() => navigate('/sales/invoices')}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-emerald-400">Stage 3</span>
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white group-hover:text-emerald-300">
              {kpis?.invoices_count || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Invoices Generated</div>
          </div>

          <div
            onClick={() => navigate('/sales/payments')}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-amber-400">Stage 4</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white group-hover:text-amber-300">
              {kpis?.payments_count || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Payments Settled</div>
          </div>
        </div>
      </div>

      {/* Charts & Top Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Visual */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Monthly Financial Trajectory
              </h3>
              <p className="text-xs text-slate-500">Invoiced and collected totals for the last 6 months</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 mr-1.5" />
                Invoiced
              </span>
              <span className="flex items-center text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 mr-1.5" />
                Collected
              </span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="space-y-4 pt-2">
            {!hasMonthlySales && (
              <p className="py-6 text-center text-sm text-slate-500">
                No invoices or payments recorded in the last 6 months.
              </p>
            )}
            {data?.monthly_trends?.map((item) => {
              const invoicedWidth = Math.round((item.invoiced / monthlyMax) * 100);
              const collectedWidth = Math.round((item.collected / monthlyMax) * 100);

              return (
                <div key={item.month} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{item.month}</span>
                    <span className="font-mono text-slate-400">
                      ₹{item.invoiced.toLocaleString()} / ₹{item.collected.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div
                      style={{ width: `${invoicedWidth}%` }}
                      title={`Invoiced ${formatCurrency(item.invoiced)}`}
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${collectedWidth}%` }}
                      title={`Collected ${formatCurrency(item.collected)}`}
                      className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Top Selling Solutions
            </h3>
            <Package className="w-4 h-4 text-slate-500" />
          </div>

          <div className="divide-y divide-slate-800 space-y-3 pt-2">
            {data?.top_products?.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                No sales order line items recorded yet.
              </p>
            )}
            {data?.top_products?.map((prod, idx) => (
              <div key={idx} className="pt-3 first:pt-0">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-white truncate max-w-[170px]">{prod.name}</span>
                  <span className="text-indigo-400 font-mono font-semibold">
                    {formatCurrency(prod.total_sales)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>{prod.sku}</span>
                  <span>{prod.units_sold} units sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Recent Sales Operations
            </h3>
            <p className="text-xs text-slate-500">Live transaction audit feed</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Reference #</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.recent_activities?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                data?.recent_activities?.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold border border-slate-700">
                        {act.type}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-semibold text-white">{act.number}</td>
                    <td className="py-3 text-slate-300">{act.customer}</td>
                    <td className="py-3 text-slate-400">{act.date}</td>
                    <td className="py-3 font-mono font-semibold text-slate-200">
                      {formatCurrency(act.amount)}
                    </td>
                    <td className="py-3">
                      <Badge status={act.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
