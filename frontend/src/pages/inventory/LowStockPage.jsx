import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import { useNotification } from '../../context/NotificationContext';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { AlertTriangle, ArrowDownLeft, ShieldAlert } from 'lucide-react';

export default function LowStockPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [quantity, setQuantity] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  const { notifySuccess, notifyError } = useNotification();

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getLowStock();
      setAlerts(data || []);
    } catch (err) {
      notifyError(err.message || 'Failed to fetch low stock alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleOpenRestock = (item) => {
    setSelectedItem(item);
    setQuantity(item.shortage > 0 ? item.shortage * 2 : 20);
    setStockInOpen(true);
  };

  const handleSubmitRestock = async (e) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;
    setSubmitting(true);
    try {
      await inventoryApi.stockIn({
        product_id: selectedItem.product_id,
        warehouse_id: selectedItem.warehouse_id,
        quantity: parseInt(quantity),
        reference_type: 'PURCHASE',
        reference_number: `RESTOCK-${Date.now().toString().slice(-4)}`,
        notes: `Urgent reorder to resolve stock shortage of ${selectedItem.shortage} units`,
      });
      notifySuccess(`Restocked ${quantity} units for '${selectedItem.product_name}'.`);
      setStockInOpen(false);
      fetchLowStock();
    } catch (err) {
      notifyError(err.message || 'Failed to restock product');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Product / SKU',
      accessor: 'product_name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.product_name}</span>
          <div className="text-[11px] font-mono text-slate-400">
            {row.product_code} &bull; SKU: {row.sku}
          </div>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse_name',
      render: (row) => (
        <span className="font-medium text-slate-800">
          {row.warehouse_name} ({row.warehouse_code})
        </span>
      ),
    },
    {
      header: 'Available Stock',
      accessor: 'available_quantity',
      render: (row) => (
        <span className="font-mono font-bold text-sm text-rose-600">
          {row.available_quantity}
        </span>
      ),
    },
    {
      header: 'Reorder Level',
      accessor: 'reorder_level',
      render: (row) => (
        <span className="font-mono text-slate-600 text-xs">
          {row.reorder_level}
        </span>
      ),
    },
    {
      header: 'Shortage Units',
      accessor: 'shortage',
      render: (row) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
          -{row.shortage}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'stock_status',
      render: (row) => <StatusBadge status={row.stock_status} type="stock" />,
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenRestock(row)}
          className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Quick Restock</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Low Stock & Out of Stock Monitoring
            </h3>
            <p className="text-xs text-amber-700">
              Triggered automatically whenever available warehouse quantity is less than or equal to the defined reorder threshold.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-900 font-mono">{alerts.length}</div>
          <div className="text-[11px] font-semibold text-amber-700 uppercase">Active Alerts</div>
        </div>
      </div>

      {/* Alerts Table */}
      <DataTable
        columns={columns}
        data={alerts}
        loading={loading}
        emptyMessage="All stock levels are currently healthy! No items are at or below reorder levels."
      />

      {/* QUICK RESTOCK MODAL */}
      <Modal
        isOpen={stockInOpen}
        onClose={() => setStockInOpen(false)}
        title={`Restock Item: ${selectedItem?.product_name || ''}`}
        maxWidth="max-w-md"
      >
        {selectedItem && (
          <form onSubmit={handleSubmitRestock} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div>
                Warehouse: <strong>{selectedItem.warehouse_name}</strong>
              </div>
              <div>
                Current Available: <strong className="text-rose-600">{selectedItem.available_quantity}</strong> (Reorder Level: {selectedItem.reorder_level})
              </div>
              <div>
                Recommended Shortage Offset: <strong className="text-emerald-600">+{selectedItem.shortage} units</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Restock Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStockInOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                {submitting ? 'Restocking...' : 'Receive Stock Now'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
