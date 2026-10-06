import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../../api/inventoryApi';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Package, 
  FolderTree, 
  Warehouse, 
  Boxes, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function InventoryOverview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.getInventorySummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load inventory summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Loading inventory analytics & valuation...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-900 mb-1">Failed to Load Overview</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'An error occurred'}</p>
        <button
          onClick={fetchSummary}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Format currency
  const valuationFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(summary.inventory_valuation || 0);

  const pieData = (summary.categories_breakdown || []).map((cat) => ({
    name: cat.category_name,
    value: cat.product_count,
  }));

  const barData = (summary.warehouses_breakdown || []).map((wh) => ({
    name: wh.warehouse_code,
    fullName: wh.warehouse_name,
    units: wh.total_units,
  }));

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Real-time PostgreSQL inventory status and calculated valuation
        </div>
        <button
          onClick={fetchSummary}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={summary.total_products}
          subtitle="Catalog active items"
          icon={Package}
          color="indigo"
        />
        <StatCard
          title="Total Warehouses"
          value={summary.total_warehouses}
          subtitle="Active logistics facilities"
          icon={Warehouse}
          color="sky"
        />
        <StatCard
          title="Total Units in Stock"
          value={summary.total_units_in_stock.toLocaleString()}
          subtitle="Across all warehouses"
          icon={Boxes}
          color="emerald"
        />
        <StatCard
          title="Inventory Valuation"
          value={valuationFormatted}
          subtitle="Σ (Stock × Unit Cost)"
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Secondary Alerts & Stock Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Categories</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{summary.total_categories}</div>
          </div>
          <FolderTree className="w-8 h-8 text-indigo-500/30" />
        </div>

        <Link
          to="/inventory/low-stock"
          className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between hover:bg-amber-50 transition shadow-sm"
        >
          <div>
            <div className="text-xs text-amber-800 font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              Low Stock Alerts
            </div>
            <div className="text-xl font-bold text-amber-900 mt-1">
              {summary.low_stock_products_count} Items
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Click to view & restock</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </Link>

        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-rose-800 font-bold uppercase">Out of Stock</div>
            <div className="text-xl font-bold text-rose-900 mt-1">
              {summary.out_of_stock_products_count} Items
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5">Requires immediate PO</div>
          </div>
          <Boxes className="w-8 h-8 text-rose-500" />
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Quick Operations
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/inventory/stock?action=stock-in"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm shadow-emerald-600/20"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Stock In (Receive)</span>
          </Link>
          <Link
            to="/inventory/stock?action=stock-out"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-sm shadow-rose-600/20"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Stock Out (Dispatch)</span>
          </Link>
          <Link
            to="/inventory/stock?action=transfer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm shadow-indigo-600/20"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer Warehouses</span>
          </Link>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BarChart: Warehouse Stock Levels */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Stock Units by Warehouse</h3>
          <p className="text-xs text-slate-500 mb-4">Quantity on hand distributed across regional hubs</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="units" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart: Products by Category */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Products Distribution by Category</h3>
          <p className="text-xs text-slate-500 mb-4">Categorical breakdown of catalog items</p>
          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No categories recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Movements Audit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Inventory Movements</h3>
            <p className="text-xs text-slate-500">Live immutable transaction audit ledger</p>
          </div>
          <Link
            to="/inventory/movements"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            View Complete Audit Log &rarr;
          </Link>
        </div>

        {summary.recent_movements && summary.recent_movements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Warehouse</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Balance</th>
                  <th className="pb-2">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.recent_movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.movement_type.includes('IN')
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.movement_type.includes('OUT')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-900">{m.product_name}</td>
                    <td className="py-2.5 text-slate-600">{m.warehouse_name}</td>
                    <td className="py-2.5 font-bold">
                      {m.movement_type.includes('OUT') ? `-${m.quantity}` : `+${m.quantity}`}
                    </td>
                    <td className="py-2.5 text-slate-600">{m.quantity_before} &rarr; {m.quantity_after}</td>
                    <td className="py-2.5 text-slate-500 font-mono text-[11px]">{m.reference_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-6">No stock movements recorded yet.</p>
        )}
      </div>
    </div>
  );
}
