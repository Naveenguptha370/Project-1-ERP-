import React, { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { formatCurrency } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notifyError } = useNotification();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, sales, inventory, finance] = await Promise.all([
        businessService.getDashboardReport(),
        businessService.getSalesReport(),
        businessService.getInventoryReport(),
        businessService.getFinanceReport(),
      ]);
      setReports({ dashboard, sales, inventory, finance });
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not load reports');
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const exportSummary = () => {
    if (!reports) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total invoiced revenue', reports.sales.revenue],
      ['Payments collected', reports.sales.paid],
      ['Outstanding receivables', reports.sales.outstanding],
      ['Active products', reports.inventory.products],
      ['Units on hand', reports.inventory.units_on_hand],
      ['Inventory value', reports.inventory.stock_value],
      ['Approved expenses', reports.finance.approved_expenses],
      ['Pending expenses', reports.finance.pending_expenses],
      ['CRM customers', reports.dashboard.crm.customers],
      ['Open leads', reports.dashboard.crm.open_leads],
    ];
    const csv = rows.map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'smarterp-report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Business intelligence</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Reports are calculated from current sales, inventory, finance, and CRM records.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} /> Refresh</button>
          <button disabled={!reports} onClick={exportSummary} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Download size={15} /> Export CSV</button>
        </div>
      </header>

      {loading && !reports ? <div className="rounded-xl bg-white p-8 text-sm text-slate-500 shadow-sm">Loading reports…</div> : reports && (
        <div className="grid gap-5 xl:grid-cols-2">
          <ReportPanel title="Sales report">
            <Metric label="Invoiced revenue" value={formatCurrency(reports.sales.revenue)} />
            <Metric label="Collected" value={formatCurrency(reports.sales.paid)} />
            <Metric label="Outstanding" value={formatCurrency(reports.sales.outstanding)} />
            <div className="col-span-2 mt-2 border-t pt-3"><h3 className="mb-2 text-sm font-semibold text-slate-700">Orders by status</h3>
              {reports.sales.orders_by_status.length ? reports.sales.orders_by_status.map((item) => <p key={item.status} className="flex justify-between py-1 text-sm text-slate-600"><span>{item.status}</span><span>{item.count}</span></p>) : <p className="text-sm text-slate-500">No sales orders yet.</p>}
            </div>
          </ReportPanel>
          <ReportPanel title="Inventory valuation">
            <Metric label="Active products" value={reports.inventory.products} />
            <Metric label="Units on hand" value={reports.inventory.units_on_hand} />
            <Metric label="Stock value at cost" value={formatCurrency(reports.inventory.stock_value)} />
            <div className="col-span-2 mt-2 border-t pt-3"><h3 className="mb-2 text-sm font-semibold text-slate-700">Stock by warehouse</h3>
              {reports.inventory.stock_by_warehouse.length ? reports.inventory.stock_by_warehouse.map((item) => <p key={item.warehouse_id} className="flex justify-between gap-3 py-1 text-sm text-slate-600"><span>{item.warehouse}</span><span>{item.units_on_hand} units · {formatCurrency(item.stock_value)}</span></p>) : <p className="text-sm text-slate-500">No inventory balances recorded.</p>}
            </div>
          </ReportPanel>
          <ReportPanel title="Finance report">
            <Metric label="Approved expenses" value={formatCurrency(reports.finance.approved_expenses)} />
            <Metric label="Pending expenses" value={formatCurrency(reports.finance.pending_expenses)} />
            <Metric label="Rejected expenses" value={formatCurrency(reports.finance.rejected_expenses)} />
            <div className="col-span-2 mt-2 border-t pt-3"><h3 className="mb-2 text-sm font-semibold text-slate-700">Approved spending by category</h3>
              {reports.finance.expenses_by_category.length ? reports.finance.expenses_by_category.map((item) => <p key={item.category} className="flex justify-between py-1 text-sm text-slate-600"><span>{item.category}</span><span>{formatCurrency(item.amount)}</span></p>) : <p className="text-sm text-slate-500">No approved expenses yet.</p>}
            </div>
          </ReportPanel>
          <ReportPanel title="CRM & operations">
            <Metric label="Customers" value={reports.dashboard.crm.customers} />
            <Metric label="Open leads" value={reports.dashboard.crm.open_leads} />
            <Metric label="Suppliers" value={reports.dashboard.procurement.suppliers} />
            <Metric label="Open purchase orders" value={reports.dashboard.procurement.open_purchase_orders} />
            <p className="col-span-2 mt-2 text-xs text-slate-400">Data as of {new Date(reports.dashboard.as_of).toLocaleString()}</p>
          </ReportPanel>
        </div>
      )}
    </div>
  );
}

function ReportPanel({ title, children }) {
  return <section className="grid grid-cols-2 gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="col-span-2 font-semibold text-slate-800">{title}</h2>{children}</section>;
}

function Metric({ label, value }) {
  return <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-900">{value}</p></div>;
}
