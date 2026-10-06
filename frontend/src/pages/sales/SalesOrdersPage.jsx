import React, { useState, useEffect } from 'react';
import { salesService } from '../../services/salesService';
import { useNotify } from '../../context/NotificationContext';
import { Badge } from '../../components/common/Badge';
import { SalesOrderModal } from '../../components/sales/SalesOrderModal';
import { DocumentPrintModal } from '../../components/sales/DocumentPrintModal';
import { formatCurrency, formatDate } from '../../utils/constants';
import {
  Plus,
  Search,
  Printer,
  Trash2,
  Loader2,
  Receipt,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const SalesOrdersPage = () => {
  const notify = useNotify();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Print Preview
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setModalOpen(true);
    }
  }, [searchParams]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await salesService.getOrders(statusFilter, search);
      setOrders(data);
    } catch {
      notify.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await salesService.updateOrderStatus(id, newStatus);
      notify.success(`Order status updated to ${newStatus}`);
      loadOrders();
    } catch {
      notify.error('Failed to update status');
    }
  };

  const handleConvertToInvoice = async (order) => {
    if (!window.confirm(`Generate commercial Invoice for Order ${order.order_number}?`)) {
      return;
    }
    try {
      const inv = await salesService.convertOrderToInvoice(order.id);
      notify.success(`Commercial Invoice ${inv.invoice_number} created successfully!`);
      loadOrders();
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to convert order to invoice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sales order?')) return;
    try {
      await salesService.deleteOrder(id);
      notify.success('Sales order deleted successfully');
      loadOrders();
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to delete order');
    }
  };

  const openPrint = (order) => {
    setSelectedOrder(order);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Sales Orders Management
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {orders.length} orders
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Confirmed customer purchase bookings, delivery fulfilment, and commercial invoice billing
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {st === '' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search order # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Order #</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Order Date</th>
                <th className="py-3.5 px-4 font-semibold">Delivery Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Total Value</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500 mb-2" />
                    <span>Loading sales orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No sales orders found matching your search.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                      {o.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{o.customer_name}</div>
                      {o.shipping_address && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {o.shipping_address}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{formatDate(o.order_date)}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(o.expected_delivery_date)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={o.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Convert to Invoice */}
                        {!o.invoice_id ? (
                          <button
                            onClick={() => handleConvertToInvoice(o)}
                            title="Generate Invoice"
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Invoice</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Invoiced
                          </span>
                        )}

                        {/* Print Slip */}
                        <button
                          onClick={() => openPrint(o)}
                          title="Print Order Slip"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Lifecycle Stepper Select */}
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-[11px] rounded-lg px-2 py-1 text-slate-300 hover:text-white focus:outline-none"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        {/* Delete */}
                        {!o.invoice_id && (
                          <button
                            onClick={() => handleDelete(o.id)}
                            title="Delete Order"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      <SalesOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadOrders}
      />

      {/* Document Print Modal */}
      <DocumentPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        document={selectedOrder}
        docType="Sales Order"
      />
    </div>
  );
};
