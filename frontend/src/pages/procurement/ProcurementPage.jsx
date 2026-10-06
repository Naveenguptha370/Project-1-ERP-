import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { inventoryApi } from '../../api/inventoryApi';
import { useNotification } from '../../context/NotificationContext';

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800';
const buttonClass = 'inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700';

export default function ProcurementPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [tab, setTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const { notifyError, notifySuccess } = useNotification();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [supplierRows, orderRows, productResult, warehouseResult] = await Promise.all([
        businessService.getSuppliers(),
        businessService.getPurchaseOrders(),
        inventoryApi.getProducts({ is_active: true, limit: 500 }),
        inventoryApi.getWarehouses({ is_active: true, limit: 500 }),
      ]);
      setSuppliers(supplierRows);
      setOrders(orderRows);
      setProducts(productResult.items || []);
      setWarehouses(warehouseResult.items || []);
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || 'Could not load procurement data');
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const createSupplier = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    for (const key of ['contact_name', 'email', 'phone', 'address', 'tax_id']) data[key] ||= null;
    try {
      await businessService.createSupplier(data);
      form.reset();
      notifySuccess('Supplier added');
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not add supplier');
    }
  };

  const createOrder = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    data.supplier_id = Number(data.supplier_id);
    data.warehouse_id = Number(data.warehouse_id);
    data.items = [{
      product_id: Number(data.product_id),
      quantity: Number(data.quantity),
      unit_cost: data.unit_cost ? Number(data.unit_cost) : null,
      tax_rate: Number(data.tax_rate || 0),
    }];
    data.expected_date = data.expected_date ? new Date(`${data.expected_date}T00:00:00`).toISOString() : null;
    try {
      await businessService.createPurchaseOrder(data);
      form.reset();
      notifySuccess('Purchase order created');
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not create purchase order');
    }
  };

  const changeStatus = async (order, nextStatus) => {
    try {
      await businessService.updatePurchaseOrderStatus(order.id, nextStatus);
      notifySuccess(`Purchase order ${nextStatus.toLowerCase()}`);
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not update purchase order');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Supply chain</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Procurement</h1>
        <p className="mt-1 text-sm text-slate-500">Manage suppliers and purchase orders. Receiving an order updates inventory and records a stock movement.</p>
      </header>
      <div className="flex gap-2">
        {[
          ['orders', 'Purchase orders'],
          ['suppliers', 'Suppliers'],
        ].map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{label}</button>)}
      </div>

      {tab === 'suppliers' ? (
        <div className="space-y-5">
          <form onSubmit={createSupplier} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
            <h2 className="md:col-span-3 font-semibold text-slate-800">Add supplier</h2>
            <input name="supplier_code" required placeholder="Supplier code" className={inputClass} />
            <input name="company_name" required placeholder="Company name" className={inputClass} />
            <input name="contact_name" placeholder="Contact person" className={inputClass} />
            <input name="email" type="email" placeholder="Email" className={inputClass} />
            <input name="phone" placeholder="Phone" className={inputClass} />
            <input name="tax_id" placeholder="Tax ID" className={inputClass} />
            <textarea name="address" placeholder="Address" className={inputClass} />
            <button className={`${buttonClass} self-start`}><Plus size={16} /> Add supplier</button>
          </form>
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 p-4 font-semibold text-slate-800">Active suppliers</div>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Email</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{suppliers.map((item) => <tr key={item.id}><td className="px-4 py-3">{item.supplier_code}</td><td className="px-4 py-3 font-medium">{item.company_name}</td><td className="px-4 py-3">{item.contact_name || '—'}</td><td className="px-4 py-3">{item.email || '—'}</td></tr>)}
                {!suppliers.length && <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No suppliers yet.</td></tr>}</tbody>
            </table></div>
          </section>
        </div>
      ) : (
        <div className="space-y-5">
          <form onSubmit={createOrder} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
            <h2 className="md:col-span-3 font-semibold text-slate-800">Create purchase order</h2>
            <select name="supplier_id" required className={inputClass} defaultValue=""><option value="" disabled>Select supplier</option>{suppliers.map((row) => <option key={row.id} value={row.id}>{row.company_name}</option>)}</select>
            <select name="warehouse_id" required className={inputClass} defaultValue=""><option value="" disabled>Select receiving warehouse</option>{warehouses.map((row) => <option key={row.id} value={row.id}>{row.warehouse_name}</option>)}</select>
            <input name="expected_date" type="date" className={inputClass} />
            <select name="product_id" required className={inputClass} defaultValue=""><option value="" disabled>Select product</option>{products.map((row) => <option key={row.id} value={row.id}>{row.product_name} ({row.sku})</option>)}</select>
            <input name="quantity" required type="number" min="1" defaultValue="1" placeholder="Quantity" className={inputClass} />
            <input name="unit_cost" type="number" min="0" step="0.01" placeholder="Unit cost (defaults to product cost)" className={inputClass} />
            <input name="tax_rate" type="number" min="0" max="100" step="0.01" defaultValue="0" placeholder="Tax rate %" className={inputClass} />
            <input name="notes" placeholder="Notes" className={inputClass} />
            <button className={`${buttonClass} self-start`}><Plus size={16} /> Create order</button>
          </form>
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 p-4 font-semibold text-slate-800">Purchase orders</div>
            {loading ? <p className="p-5 text-sm text-slate-500">Loading orders…</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium">{order.order_number}</td>
                  <td className="px-4 py-3">{suppliers.find((supplier) => supplier.id === order.supplier_id)?.company_name || `Supplier #${order.supplier_id}`}</td>
                  <td className="px-4 py-3">{order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}</td>
                  <td className="px-4 py-3">₹{Number(order.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">
                    {order.status === 'Draft' && <button onClick={() => changeStatus(order, 'Ordered')} className="mr-3 text-xs font-semibold text-indigo-600">Mark ordered</button>}
                    {order.status === 'Ordered' && <button onClick={() => changeStatus(order, 'Received')} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Truck size={14} /> Receive</button>}
                    {['Draft', 'Ordered'].includes(order.status) && <button onClick={() => changeStatus(order, 'Cancelled')} className="ml-3 text-xs font-semibold text-rose-600">Cancel</button>}
                  </td>
                </tr>
              ))}{!orders.length && <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">No purchase orders yet.</td></tr>}</tbody>
            </table></div>}
          </section>
        </div>
      )}
    </div>
  );
}
