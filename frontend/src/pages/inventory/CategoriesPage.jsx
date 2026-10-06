import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import { useNotification } from '../../context/NotificationContext';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { FolderTree, Plus, Edit3, Trash2, Package } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialForm = {
    category_code: '',
    category_name: '',
    description: '',
    parent_category_id: null,
    is_active: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const { notifySuccess, notifyError } = useNotification();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getCategories({
        search: search || undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      });
      setCategories(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      notifyError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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

  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat);
    setFormData({
      category_code: cat.category_code,
      category_name: cat.category_name,
      description: cat.description || '',
      parent_category_id: cat.parent_category_id,
      is_active: cat.is_active,
    });
    setEditModalOpen(true);
  };

  const handleOpenDelete = (cat) => {
    setSelectedCategory(cat);
    setDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.category_code || !formData.category_name) {
      notifyError('Category Code and Name are required');
      return;
    }
    setFormSubmitting(true);
    try {
      await inventoryApi.createCategory(formData);
      notifySuccess(`Category '${formData.category_name}' created successfully.`);
      setAddModalOpen(false);
      fetchCategories();
    } catch (err) {
      notifyError(err.message || 'Failed to create category');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await inventoryApi.updateCategory(selectedCategory.id, formData);
      notifySuccess(`Category '${formData.category_name}' updated successfully.`);
      setEditModalOpen(false);
      fetchCategories();
    } catch (err) {
      notifyError(err.message || 'Failed to update category');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setFormSubmitting(true);
    try {
      await inventoryApi.deleteCategory(selectedCategory.id, false);
      notifySuccess(`Category '${selectedCategory.category_name}' deleted successfully.`);
      setDeleteModalOpen(false);
      fetchCategories();
    } catch (err) {
      if (err.message && err.message.includes('products are assigned to it')) {
        const deactivate = window.confirm(
          `${err.message}\n\nWould you like to SAFELY DEACTIVATE this category instead?`
        );
        if (deactivate) {
          try {
            await inventoryApi.deleteCategory(selectedCategory.id, true);
            notifySuccess(`Category '${selectedCategory.category_name}' safely deactivated.`);
            setDeleteModalOpen(false);
            fetchCategories();
          } catch (deactErr) {
            notifyError(deactErr.message);
          }
        }
      } else {
        notifyError(err.message || 'Failed to delete category');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Category Code',
      accessor: 'category_code',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono">{row.category_code}</span>
      ),
    },
    {
      header: 'Category Name',
      accessor: 'category_name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.category_name}</div>
          {row.description && (
            <div className="text-[11px] text-slate-400 truncate max-w-sm">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Products Assigned',
      accessor: 'product_count',
      render: (row) => (
        <div className="flex items-center space-x-1.5">
          <Package className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">{row.product_count}</span>
          <span className="text-slate-400 text-[11px]">items</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => <StatusBadge status={row.is_active} />,
    },
    {
      header: 'Created Date',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-slate-500 font-mono text-[11px]">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Edit Category"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={(val) => { setSearch(val); setPage(1); }}
          onClear={() => setSearch('')}
          placeholder="Search by category name or code..."
          className="w-full sm:w-80"
        />

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        emptyMessage="No categories found. Click 'Add New Category' to create one."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={addModalOpen || editModalOpen}
        onClose={() => { setAddModalOpen(false); setEditModalOpen(false); }}
        title={addModalOpen ? 'Create Product Category' : `Edit Category: ${formData.category_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={addModalOpen ? handleSubmitAdd : handleSubmitEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Code *</label>
            <input
              type="text"
              name="category_code"
              value={formData.category_code}
              onChange={handleChange}
              placeholder="e.g. CAT-HARDWARE"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              name="category_name"
              value={formData.category_name}
              onChange={handleChange}
              placeholder="e.g. Hardware Components"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Classification details and description..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="cat_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="cat_active" className="text-xs font-semibold text-slate-700">
              Category is active
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
              <span>{addModalOpen ? 'Create Category' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Category Deletion"
        message={`Are you sure you want to delete category '${selectedCategory?.category_name}' (${selectedCategory?.category_code})? Categories containing assigned products cannot be deleted and will trigger a safe deactivation option.`}
        confirmText="Delete Category"
        type="danger"
        loading={formSubmitting}
      />
    </div>
  );
}
