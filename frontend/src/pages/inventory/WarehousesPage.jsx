import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import { useNotification } from '../../context/NotificationContext';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Warehouse, Plus, Edit3, Trash2, Eye, MapPin, Phone, Mail, Boxes, AlertTriangle } from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialForm = {
    warehouse_code: '',
    warehouse_name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    contact_person: '',
    phone: '',
    email: '',
    is_active: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const { notifySuccess, notifyError } = useNotification();

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getWarehouses({
        search: search || undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      });
      setWarehouses(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      notifyError(err.message || 'Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [search, page]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setAddModalOpen(true);
  };

  const handleOpenEdit = (wh) => {
    setSelectedWarehouse(wh);
    setFormData({
      warehouse_code: wh.warehouse_code,
      warehouse_name: wh.warehouse_name,
      description: wh.description || '',
      address: wh.address || '',
      city: wh.city || '',
      state: wh.state || '',
      postal_code: wh.postal_code || '',
      contact_person: wh.contact_person || '',
      phone: wh.phone || '',
      email: wh.email || '',
      is_active: wh.is_active,
    });
    setEditModalOpen(true);
  };

  const handleOpenView = async (wh) => {
    try {
      const fullWh = await inventoryApi.getWarehouse(wh.id);
      setSelectedWarehouse(fullWh);
      setViewModalOpen(true);
    } catch (err) {
      notifyError(err.message || 'Could not load warehouse details');
    }
  };

  const handleOpenDelete = (wh) => {
    setSelectedWarehouse(wh);
    setDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.warehouse_code || !formData.warehouse_name) {
      notifyError('Warehouse Code and Name are required');
      return;
    }
    setFormSubmitting(true);
    try {
      await inventoryApi.createWarehouse(formData);
      notifySuccess(`Warehouse '${formData.warehouse_name}' created successfully.`);
      setAddModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      notifyError(err.message || 'Failed to create warehouse');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await inventoryApi.updateWarehouse(selectedWarehouse.id, formData);
      notifySuccess(`Warehouse '${formData.warehouse_name}' updated successfully.`);
      setEditModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      notifyError(err.message || 'Failed to update warehouse');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormSubmitting(true);
    try {
      await inventoryApi.deleteWarehouse(selectedWarehouse.id, false);
      notifySuccess(`Warehouse '${selectedWarehouse.warehouse_name}' deleted successfully.`);
      setDeleteModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      if (err.message && err.message.includes('holds stock')) {
        const deactivate = window.confirm(
          `${err.message}\n\nWould you like to SAFELY DEACTIVATE this warehouse instead?`
        );
        if (deactivate) {
          try {
            await inventoryApi.deleteWarehouse(selectedWarehouse.id, true);
            notifySuccess(`Warehouse '${selectedWarehouse.warehouse_name}' safely deactivated.`);
            setDeleteModalOpen(false);
            fetchWarehouses();
          } catch (deactErr) {
            notifyError(deactErr.message);
          }
        }
      } else {
        notifyError(err.message || 'Failed to delete warehouse');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Code / Name',
      accessor: 'warehouse_code',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 font-mono">{row.warehouse_code}</span>
          <div className="text-xs font-semibold text-slate-800">{row.warehouse_name}</div>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: 'city',
      render: (row) => (
        <div className="flex items-center space-x-1 text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>{[row.city, row.state].filter(Boolean).join(', ') || 'Unspecified'}</span>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: 'contact_person',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{row.contact_person || '—'}</div>
          {row.phone && <div className="text-[11px] text-slate-400">{row.phone}</div>}
        </div>
      ),
    },
    {
      header: 'Stocked Items',
      accessor: 'total_products_count',
      render: (row) => (
        <span className="font-semibold text-slate-700">
          {row.total_products_count} <span className="text-[11px] font-normal text-slate-400">products</span>
        </span>
      ),
    },
    {
      header: 'Total Units',
      accessor: 'total_units_in_stock',
      render: (row) => (
        <div className="font-bold text-slate-900 font-mono">
          {row.total_units_in_stock.toLocaleString()}{' '}
          <span className="text-[10px] font-normal text-slate-400">units</span>
        </div>
      ),
    },
    {
      header: 'Low Stock Items',
      accessor: 'low_stock_products_count',
      render: (row) =>
        row.low_stock_products_count > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {row.low_stock_products_count} alert
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
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
            title="View Stock Breakdown"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Edit Warehouse"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Warehouse"
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
          placeholder="Search warehouse code, name, city, contact..."
          className="w-full sm:w-80"
        />

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Warehouse</span>
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={warehouses}
        loading={loading}
        emptyMessage="No warehouses recorded. Click 'Add New Warehouse' to register one."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
      />

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={addModalOpen || editModalOpen}
        onClose={() => { setAddModalOpen(false); setEditModalOpen(false); }}
        title={addModalOpen ? 'Register Logistics Warehouse' : `Edit Warehouse: ${formData.warehouse_name}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={addModalOpen ? handleSubmitAdd : handleSubmitEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Code *</label>
              <input
                type="text"
                name="warehouse_code"
                value={formData.warehouse_code}
                onChange={handleChange}
                placeholder="e.g. WH-NORTH"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Name *</label>
              <input
                type="text"
                name="warehouse_name"
                value={formData.warehouse_name}
                onChange={handleChange}
                placeholder="e.g. Northern Regional Logistics"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. 500 Freight Way, Bay 4"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Chicago"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">State / Province</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="IL"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Postal Code</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="60601"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Warehouse Management & Contact
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="Manager Name"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1-555-0100"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="warehouse@smarterp.local"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="wh_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="wh_active" className="text-xs font-semibold text-slate-700">
              Warehouse is active and available for storage
            </label>
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/20 transition flex items-center gap-2"
            >
              {formSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>{addModalOpen ? 'Create Warehouse' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW WAREHOUSE DETAILS & STOCK BREAKDOWN MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Warehouse Inventory: ${selectedWarehouse?.warehouse_name || ''}`}
        maxWidth="max-w-4xl"
      >
        {selectedWarehouse && (
          <div className="space-y-5">
            {/* Warehouse Overview Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Code</span>
                <span className="font-bold text-slate-800 font-mono">{selectedWarehouse.warehouse_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Manager</span>
                <span className="font-semibold text-slate-800">{selectedWarehouse.contact_person || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Stocked Products</span>
                <span className="font-bold text-indigo-600">{selectedWarehouse.total_products_count} items</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Total Physical Units</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {selectedWarehouse.total_units_in_stock.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Inventory table in this warehouse */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span>Stocked Products In This Facility</span>
              </h4>

              {selectedWarehouse.stock_items && selectedWarehouse.stock_items.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Code / SKU</th>
                        <th className="px-3 py-2">Product Name</th>
                        <th className="px-3 py-2">On Hand</th>
                        <th className="px-3 py-2">Available</th>
                        <th className="px-3 py-2">Reorder Lvl</th>
                        <th className="px-3 py-2">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedWarehouse.stock_items.map((item) => (
                        <tr key={item.product_id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono text-[11px]">
                            {item.product_code}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-800">
                            {item.product_name}
                          </td>
                          <td className="px-3 py-2 font-mono font-medium">{item.quantity_on_hand}</td>
                          <td className="px-3 py-2 font-mono font-bold text-indigo-600">
                            {item.available_quantity} {item.unit}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-500">{item.reorder_level}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={item.stock_status} type="stock" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  This warehouse currently holds zero inventory units.
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

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Warehouse Deletion"
        message={`Are you sure you want to delete '${selectedWarehouse?.warehouse_name}' (${selectedWarehouse?.warehouse_code})? A warehouse containing physical stock cannot be deleted; the system will offer safe deactivation.`}
        confirmText="Delete Warehouse"
        type="danger"
        loading={formSubmitting}
      />
    </div>
  );
}
