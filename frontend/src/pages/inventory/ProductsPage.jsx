import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import { useNotification } from '../../context/NotificationContext';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterPanel from '../../components/common/FilterPanel';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { 
  Package, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Warehouse,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const initialForm = {
    product_code: '',
    sku: '',
    barcode: '',
    product_name: '',
    description: '',
    category_id: '',
    unit: 'pcs',
    cost_price: '0.00',
    selling_price: '0.00',
    tax_percentage: '0.00',
    reorder_level: 10,
    minimum_stock_level: 5,
    maximum_stock_level: 1000,
    is_active: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const { notifySuccess, notifyError } = useNotification();

  // Load Categories for dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await inventoryApi.getCategories({ limit: 100 });
        setCategories(res.items || []);
      } catch (err) {
        // fallback
      }
    }
    loadCategories();
  }, []);

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getProducts({
        search: search || undefined,
        category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
        stock_status: stockStatus || undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      });
      setProducts(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      notifyError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, stockStatus, page]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      ...initialForm,
      category_id: categories.length > 0 ? categories[0].id : '',
    });
    setAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setFormData({
      product_code: prod.product_code,
      sku: prod.sku,
      barcode: prod.barcode || '',
      product_name: prod.product_name,
      description: prod.description || '',
      category_id: prod.category_id,
      unit: prod.unit,
      cost_price: prod.cost_price,
      selling_price: prod.selling_price,
      tax_percentage: prod.tax_percentage,
      reorder_level: prod.reorder_level,
      minimum_stock_level: prod.minimum_stock_level,
      maximum_stock_level: prod.maximum_stock_level,
      is_active: prod.is_active,
    });
    setEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenView = async (prod) => {
    try {
      const fullProd = await inventoryApi.getProduct(prod.id);
      setSelectedProduct(fullProd);
      setViewModalOpen(true);
    } catch (err) {
      notifyError(err.message || 'Could not load product details');
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (prod) => {
    setSelectedProduct(prod);
    setDeleteModalOpen(true);
  };

  // Submit Create Product
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.product_name || !formData.product_code || !formData.sku || !formData.category_id) {
      notifyError('Please fill in all required fields (Name, Code, SKU, Category)');
      return;
    }
    setFormSubmitting(true);
    try {
      await inventoryApi.createProduct({
        ...formData,
        category_id: parseInt(formData.category_id),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        tax_percentage: parseFloat(formData.tax_percentage),
        reorder_level: parseInt(formData.reorder_level),
        minimum_stock_level: parseInt(formData.minimum_stock_level),
        maximum_stock_level: parseInt(formData.maximum_stock_level),
      });
      notifySuccess(`Product '${formData.product_name}' created successfully.`);
      setAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      notifyError(err.message || 'Failed to create product');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Update Product
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await inventoryApi.updateProduct(selectedProduct.id, {
        ...formData,
        category_id: parseInt(formData.category_id),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        tax_percentage: parseFloat(formData.tax_percentage),
        reorder_level: parseInt(formData.reorder_level),
        minimum_stock_level: parseInt(formData.minimum_stock_level),
        maximum_stock_level: parseInt(formData.maximum_stock_level),
      });
      notifySuccess(`Product '${formData.product_name}' updated successfully.`);
      setEditModalOpen(false);
      fetchProducts();
    } catch (err) {
      notifyError(err.message || 'Failed to update product');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Safe Deletion
  const handleConfirmDelete = async () => {
    setFormSubmitting(true);
    try {
      await inventoryApi.deleteProduct(selectedProduct.id, false);
      notifySuccess(`Product '${selectedProduct.product_name}' deleted successfully.`);
      setDeleteModalOpen(false);
      fetchProducts();
    } catch (err) {
      // If error indicates inventory/movements exist, offer safe deactivation
      if (err.message && err.message.includes('inventory records or movements')) {
        const deactivateConfirm = window.confirm(
          `${err.message}\n\nWould you like to SAFELY DEACTIVATE this product instead?`
        );
        if (deactivateConfirm) {
          try {
            await inventoryApi.deleteProduct(selectedProduct.id, true);
            notifySuccess(`Product '${selectedProduct.product_name}' safely deactivated.`);
            setDeleteModalOpen(false);
            fetchProducts();
          } catch (deactErr) {
            notifyError(deactErr.message);
          }
        }
      } else {
        notifyError(err.message || 'Failed to delete product');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Code / SKU',
      accessor: 'product_code',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 font-mono">{row.product_code}</span>
          <div className="text-[11px] text-slate-400 font-mono">SKU: {row.sku}</div>
        </div>
      ),
    },
    {
      header: 'Product Name',
      accessor: 'product_name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.product_name}</div>
          {row.description && (
            <div className="text-[11px] text-slate-400 truncate max-w-xs">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category_name',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200">
          {row.category_name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Unit',
      accessor: 'unit',
      className: 'text-center',
    },
    {
      header: 'Cost / Sell',
      accessor: 'cost_price',
      render: (row) => (
        <div className="text-xs">
          <div className="text-slate-500 font-mono">${parseFloat(row.cost_price).toFixed(2)}</div>
          <div className="font-bold text-slate-900 font-mono">${parseFloat(row.selling_price).toFixed(2)}</div>
        </div>
      ),
    },
    {
      header: 'Available Stock',
      accessor: 'total_stock',
      render: (row) => (
        <div className="font-bold text-slate-900 text-sm">
          {row.total_stock} <span className="text-xs font-normal text-slate-400">{row.unit}</span>
        </div>
      ),
    },
    {
      header: 'Stock Status',
      accessor: 'stock_status',
      render: (row) => <StatusBadge status={row.stock_status} type="stock" />,
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => <StatusBadge status={row.is_active} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenView(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Edit Product"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={(val) => { setSearch(val); setPage(1); }}
          onClear={() => setSearch('')}
          placeholder="Search by product name, code, SKU..."
          className="w-full sm:w-80"
        />

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Options */}
      <FilterPanel
        onReset={() => {
          setSelectedCategory('');
          setStockStatus('');
          setSearch('');
          setPage(1);
        }}
        activeCount={(selectedCategory ? 1 : 0) + (stockStatus ? 1 : 0)}
      >
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stock Status</label>
          <select
            value={stockStatus}
            onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </FilterPanel>

      {/* Product Data Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products match your criteria. Click 'Add New Product' to create one."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
      />

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={addModalOpen || editModalOpen}
        onClose={() => { setAddModalOpen(false); setEditModalOpen(false); }}
        title={addModalOpen ? 'Create New Catalog Product' : `Edit Product: ${formData.product_name}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={addModalOpen ? handleSubmitAdd : handleSubmitEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Code *</label>
              <input
                type="text"
                name="product_code"
                value={formData.product_code}
                onChange={handleChange}
                placeholder="e.g. PRD-001"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. SKU-ELEC-01"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode (UPC/EAN)</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="e.g. 8901234567890"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="e.g. Wireless Ergonomic Mouse"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Detailed specifications, warranty information, features..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Pricing & Unit */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Financial & Unit Configuration
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unit of Measure</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="pcs, kg, box..."
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cost Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Selling Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tax (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="tax_percentage"
                  value={formData.tax_percentage}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Stock Thresholds */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Stock Control & Reorder Rules
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reorder Level *</label>
                <input
                  type="number"
                  min="0"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Triggers Low Stock Alert</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Min Stock Level</label>
                <input
                  type="number"
                  min="0"
                  name="minimum_stock_level"
                  value={formData.minimum_stock_level}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Stock Level</label>
                <input
                  type="number"
                  min="0"
                  name="maximum_stock_level"
                  value={formData.maximum_stock_level}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-slate-700">
              Product is active and available for transactions
            </label>
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/20 transition flex items-center gap-2"
            >
              {formSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>{addModalOpen ? 'Create Product' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW PRODUCT DETAILS MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Product Details: ${selectedProduct?.product_name || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedProduct && (
          <div className="space-y-5">
            {/* General Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Product Code</span>
                <span className="font-bold text-slate-800 font-mono">{selectedProduct.product_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">SKU</span>
                <span className="font-bold text-slate-800 font-mono">{selectedProduct.sku}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Category</span>
                <span className="font-bold text-slate-800">{selectedProduct.category_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Status</span>
                <StatusBadge status={selectedProduct.is_active} />
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-3 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block">Unit Cost Price</span>
                <span className="text-lg font-bold text-slate-800 font-mono">
                  ${parseFloat(selectedProduct.cost_price).toFixed(2)}
                </span>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block">Selling Price</span>
                <span className="text-lg font-bold text-indigo-600 font-mono">
                  ${parseFloat(selectedProduct.selling_price).toFixed(2)}
                </span>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block">Reorder Threshold</span>
                <span className="text-lg font-bold text-amber-600 font-mono">
                  {selectedProduct.reorder_level} {selectedProduct.unit}
                </span>
              </div>
            </div>

            {/* Warehouse-wise Stock Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4 text-indigo-600" />
                  <span>Warehouse-Wise Stock Distribution</span>
                </h4>
                <span className="text-xs font-bold text-slate-900">
                  Total Available: {selectedProduct.total_stock} {selectedProduct.unit}
                </span>
              </div>

              {selectedProduct.warehouses_stock && selectedProduct.warehouses_stock.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Warehouse</th>
                        <th className="px-3 py-2">On Hand</th>
                        <th className="px-3 py-2">Reserved</th>
                        <th className="px-3 py-2 font-bold">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProduct.warehouses_stock.map((ws) => (
                        <tr key={ws.warehouse_id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 font-medium text-slate-800">
                            {ws.warehouse_name} ({ws.warehouse_code})
                          </td>
                          <td className="px-3 py-2.5 font-mono">{ws.quantity_on_hand}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-400">{ws.reserved_quantity}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-indigo-600">
                            {ws.available_quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No stock records in any warehouse yet. Perform a <strong>Stock In</strong> transaction to initialize inventory.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRMATION MODAL FOR DELETE */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Product Deletion"
        message={`Are you sure you want to delete '${selectedProduct?.product_name}' (${selectedProduct?.product_code})? If this product has recorded stock movements or transactions, the system will prevent accidental deletion and allow safe deactivation.`}
        confirmText="Delete Product"
        type="danger"
        loading={formSubmitting}
      />
    </div>
  );
}
