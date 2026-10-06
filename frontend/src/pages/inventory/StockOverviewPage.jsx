import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inventoryApi } from '../../api/inventoryApi';
import { useNotification } from '../../context/NotificationContext';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterPanel from '../../components/common/FilterPanel';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  ArrowLeftRight, 
  History,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function StockOverviewPage() {
  const [searchParams] = useSearchParams();
  const [stockItems, setStockItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Transaction Modals
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Transaction Forms
  const [stockInForm, setStockInForm] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 10,
    reference_type: 'MANUAL',
    reference_number: '',
    notes: '',
  });

  const [stockOutForm, setStockOutForm] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 1,
    reference_type: 'MANUAL',
    reference_number: '',
    notes: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    product_id: '',
    warehouse_id: '',
    adjustment_type: 'INCREASE',
    quantity: 1,
    reason: 'Physical Count Correction',
    notes: '',
  });

  const [transferForm, setTransferForm] = useState({
    product_id: '',
    source_warehouse_id: '',
    destination_warehouse_id: '',
    quantity: 1,
    reference_number: '',
    notes: '',
  });

  const { notifySuccess, notifyError } = useNotification();

  // Load dropdown catalogs
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [prodRes, whRes, catRes] = await Promise.all([
          inventoryApi.getProducts({ limit: 100 }),
          inventoryApi.getWarehouses({ limit: 100 }),
          inventoryApi.getCategories({ limit: 100 }),
        ]);
        setProducts(prodRes.items || []);
        setWarehouses(whRes.items || []);
        setCategories(catRes.items || []);
      } catch (err) {
        // fallback
      }
    }
    loadCatalogs();
  }, []);

  // Check URL query parameters for quick actions
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'stock-in') setStockInOpen(true);
    else if (action === 'stock-out') setStockOutOpen(true);
    else if (action === 'transfer') setTransferOpen(true);
    else if (action === 'adjust') setAdjustOpen(true);
  }, [searchParams]);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getInventory({
        search: search || undefined,
        warehouse_id: selectedWarehouse ? parseInt(selectedWarehouse) : undefined,
        category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
        stock_status: stockStatus || undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      });
      setStockItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      notifyError(err.message || 'Failed to fetch inventory records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [search, selectedWarehouse, selectedCategory, stockStatus, page]);

  // Quick Open Modal with pre-filled row
  const openActionForRow = (action, row) => {
    if (action === 'in') {
      setStockInForm({
        product_id: row.product_id,
        warehouse_id: row.warehouse_id,
        quantity: 10,
        reference_type: 'MANUAL',
        reference_number: '',
        notes: '',
      });
      setStockInOpen(true);
    } else if (action === 'out') {
      setStockOutForm({
        product_id: row.product_id,
        warehouse_id: row.warehouse_id,
        quantity: 1,
        reference_type: 'MANUAL',
        reference_number: '',
        notes: '',
      });
      setStockOutOpen(true);
    } else if (action === 'adjust') {
      setAdjustForm({
        product_id: row.product_id,
        warehouse_id: row.warehouse_id,
        adjustment_type: 'INCREASE',
        quantity: 1,
        reason: 'Physical Count Correction',
        notes: '',
      });
      setAdjustOpen(true);
    } else if (action === 'transfer') {
      setTransferForm({
        product_id: row.product_id,
        source_warehouse_id: row.warehouse_id,
        destination_warehouse_id: '',
        quantity: 1,
        reference_number: '',
        notes: '',
      });
      setTransferOpen(true);
    }
  };

  // Submit Handlers
  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!stockInForm.product_id || !stockInForm.warehouse_id || stockInForm.quantity <= 0) {
      notifyError('Please specify Product, Warehouse, and positive Quantity');
      return;
    }
    setSubmitting(true);
    try {
      await inventoryApi.stockIn({
        ...stockInForm,
        product_id: parseInt(stockInForm.product_id),
        warehouse_id: parseInt(stockInForm.warehouse_id),
        quantity: parseInt(stockInForm.quantity),
      });
      notifySuccess(`Successfully stocked in ${stockInForm.quantity} units.`);
      setStockInOpen(false);
      fetchStock();
    } catch (err) {
      notifyError(err.message || 'Failed to process Stock In');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    if (!stockOutForm.product_id || !stockOutForm.warehouse_id || stockOutForm.quantity <= 0) {
      notifyError('Please specify Product, Warehouse, and positive Quantity');
      return;
    }
    setSubmitting(true);
    try {
      await inventoryApi.stockOut({
        ...stockOutForm,
        product_id: parseInt(stockOutForm.product_id),
        warehouse_id: parseInt(stockOutForm.warehouse_id),
        quantity: parseInt(stockOutForm.quantity),
      });
      notifySuccess(`Successfully dispatched ${stockOutForm.quantity} units.`);
      setStockOutOpen(false);
      fetchStock();
    } catch (err) {
      notifyError(err.message || 'Failed to process Stock Out');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.product_id || !adjustForm.warehouse_id || adjustForm.quantity <= 0 || !adjustForm.reason) {
      notifyError('Please provide Product, Warehouse, Quantity and Reason');
      return;
    }
    setSubmitting(true);
    try {
      await inventoryApi.stockAdjust({
        ...adjustForm,
        product_id: parseInt(adjustForm.product_id),
        warehouse_id: parseInt(adjustForm.warehouse_id),
        quantity: parseInt(adjustForm.quantity),
      });
      notifySuccess(`Stock adjusted (${adjustForm.adjustment_type} by ${adjustForm.quantity}).`);
      setAdjustOpen(false);
      fetchStock();
    } catch (err) {
      notifyError(err.message || 'Failed to process Stock Adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (
      !transferForm.product_id ||
      !transferForm.source_warehouse_id ||
      !transferForm.destination_warehouse_id ||
      transferForm.quantity <= 0
    ) {
      notifyError('Please fill in Product, Source Warehouse, Destination Warehouse, and Quantity');
      return;
    }
    if (transferForm.source_warehouse_id === transferForm.destination_warehouse_id) {
      notifyError('Source and Destination warehouses must be different.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await inventoryApi.stockTransfer({
        ...transferForm,
        product_id: parseInt(transferForm.product_id),
        source_warehouse_id: parseInt(transferForm.source_warehouse_id),
        destination_warehouse_id: parseInt(transferForm.destination_warehouse_id),
        quantity: parseInt(transferForm.quantity),
      });
      notifySuccess(res.message || 'Transfer completed successfully.');
      setTransferOpen(false);
      fetchStock();
    } catch (err) {
      notifyError(err.message || 'Transfer failed and was rolled back');
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
      header: 'Category',
      accessor: 'category_name',
      render: (row) => (
        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.category_name || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse_name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800">{row.warehouse_name}</span>
          <div className="text-[11px] text-slate-400 font-mono">{row.warehouse_code}</div>
        </div>
      ),
    },
    {
      header: 'Physical On-Hand',
      accessor: 'quantity_on_hand',
      render: (row) => (
        <span className="font-bold font-mono text-slate-800 text-sm">
          {row.quantity_on_hand}
        </span>
      ),
    },
    {
      header: 'Reserved',
      accessor: 'reserved_quantity',
      render: (row) => (
        <span className="font-mono text-slate-400 text-xs">
          {row.reserved_quantity}
        </span>
      ),
    },
    {
      header: 'Available Stock',
      accessor: 'available_quantity',
      render: (row) => (
        <span className="font-extrabold font-mono text-indigo-600 text-sm">
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
      header: 'Condition',
      accessor: 'stock_status',
      render: (row) => <StatusBadge status={row.stock_status} type="stock" />,
    },
    {
      header: 'Quick Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => openActionForRow('in', row)}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            title="Stock In to this Warehouse"
          >
            <ArrowDownLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => openActionForRow('out', row)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Stock Out from this Warehouse"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => openActionForRow('adjust', row)}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Stock Adjustment"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => openActionForRow('transfer', row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Transfer to another Warehouse"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={(val) => { setSearch(val); setPage(1); }}
          onClear={() => setSearch('')}
          placeholder="Search product name, SKU, or warehouse..."
          className="w-full sm:w-80"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStockInOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Stock In</span>
          </button>
          <button
            onClick={() => setStockOutOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Stock Out</span>
          </button>
          <button
            onClick={() => setAdjustOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjustment</span>
          </button>
          <button
            onClick={() => setTransferOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        onReset={() => {
          setSelectedWarehouse('');
          setSelectedCategory('');
          setStockStatus('');
          setSearch('');
          setPage(1);
        }}
        activeCount={(selectedWarehouse ? 1 : 0) + (selectedCategory ? 1 : 0) + (stockStatus ? 1 : 0)}
      >
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Warehouse</label>
          <select
            value={selectedWarehouse}
            onChange={(e) => { setSelectedWarehouse(e.target.value); setPage(1); }}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.warehouse_name} ({w.warehouse_code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stock Condition</label>
          <select
            value={stockStatus}
            onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </FilterPanel>

      {/* Stock Table */}
      <DataTable
        columns={columns}
        data={stockItems}
        loading={loading}
        emptyMessage="No stock records found matching your filters."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
      />

      {/* STOCK IN MODAL */}
      <Modal
        isOpen={stockInOpen}
        onClose={() => setStockInOpen(false)}
        title="Stock In — Receive Inventory"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleStockInSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product *</label>
            <select
              value={stockInForm.product_id}
              onChange={(e) => setStockInForm({ ...stockInForm, product_id: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Product to Receive</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} ({p.product_code} / SKU: {p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Warehouse *</label>
            <select
              value={stockInForm.warehouse_id}
              onChange={(e) => setStockInForm({ ...stockInForm, warehouse_id: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Target Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouse_name} ({w.warehouse_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={stockInForm.quantity}
                onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Type</label>
              <select
                value={stockInForm.reference_type}
                onChange={(e) => setStockInForm({ ...stockInForm, reference_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="PURCHASE">Purchase Order (Procurement)</option>
                <option value="MANUAL">Manual Stock In</option>
                <option value="RETURN">Customer Return</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Number / PO</label>
            <input
              type="text"
              placeholder="e.g. PO-2026-088"
              value={stockInForm.reference_number}
              onChange={(e) => setStockInForm({ ...stockInForm, reference_number: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Shipment tracking, supplier notes, inspector ID..."
              value={stockInForm.notes}
              onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
              {submitting ? 'Processing...' : 'Confirm Stock In'}
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK OUT MODAL */}
      <Modal
        isOpen={stockOutOpen}
        onClose={() => setStockOutOpen(false)}
        title="Stock Out — Dispatch Inventory"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleStockOutSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product *</label>
            <select
              value={stockOutForm.product_id}
              onChange={(e) => setStockOutForm({ ...stockOutForm, product_id: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Product to Dispatch</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} ({p.product_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Source *</label>
            <select
              value={stockOutForm.warehouse_id}
              onChange={(e) => setStockOutForm({ ...stockOutForm, warehouse_id: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouse_name} ({w.warehouse_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={stockOutForm.quantity}
                onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Type</label>
              <select
                value={stockOutForm.reference_type}
                onChange={(e) => setStockOutForm({ ...stockOutForm, reference_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="SALE">Sales Order (Sales)</option>
                <option value="MANUAL">Manual Stock Out</option>
                <option value="DAMAGE">Damaged / Written-Off</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Number / Invoice</label>
            <input
              type="text"
              placeholder="e.g. INV-2026-904"
              value={stockOutForm.reference_number}
              onChange={(e) => setStockOutForm({ ...stockOutForm, reference_number: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Dispatch destination, carrier, customer name..."
              value={stockOutForm.notes}
              onChange={(e) => setStockOutForm({ ...stockOutForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStockOutOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Processing...' : 'Confirm Stock Out'}
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Stock Adjustment — Audit Correction"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              All stock adjustments are logged permanently to the audit ledger with reason, before/after balances, and user ID.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product *</label>
              <select
                value={adjustForm.product_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse *</label>
              <select
                value={adjustForm.warehouse_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, warehouse_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouse_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type *</label>
              <select
                value={adjustForm.adjustment_type}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="INCREASE">INCREASE (+ Units)</option>
                <option value="DECREASE">DECREASE (- Units)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Adjustment *</label>
            <select
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Physical Count Correction">Physical Count Correction</option>
              <option value="Damaged Goods">Damaged Goods</option>
              <option value="Expired Goods">Expired Goods</option>
              <option value="Lost Goods">Lost Goods</option>
              <option value="Data Correction">Data Correction</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Explanation / Notes</label>
            <textarea
              rows={2}
              placeholder="Reason details, physical stock count reference..."
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setAdjustOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Applying...' : 'Apply Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK TRANSFER MODAL */}
      <Modal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Warehouse Stock Transfer — Atomic Relocation"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800">
            Stock transfers execute inside an <strong>atomic database transaction</strong>. If source quantity is insufficient or destination write fails, the entire transaction rolls back cleanly.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product to Transfer *</label>
            <select
              value={transferForm.product_id}
              onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} ({p.product_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Warehouse *</label>
              <select
                value={transferForm.source_warehouse_id}
                onChange={(e) => setTransferForm({ ...transferForm, source_warehouse_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">From Facility</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouse_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Warehouse *</label>
              <select
                value={transferForm.destination_warehouse_id}
                onChange={(e) => setTransferForm({ ...transferForm, destination_warehouse_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">To Facility</option>
                {warehouses
                  .filter((w) => w.id !== parseInt(transferForm.source_warehouse_id))
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouse_name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Transfer *</label>
              <input
                type="number"
                min="1"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Reference</label>
              <input
                type="text"
                placeholder="e.g. TRF-2026-001"
                value={transferForm.reference_number}
                onChange={(e) => setTransferForm({ ...transferForm, reference_number: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch / Logistics Notes</label>
            <textarea
              rows={2}
              placeholder="Truck shipment ID, driver name, expected arrival date..."
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setTransferOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Transferring...' : 'Execute Stock Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
