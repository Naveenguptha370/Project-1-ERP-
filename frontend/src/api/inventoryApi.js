import apiRequest from './client';

export const inventoryApi = {
  // Categories
  getCategories: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.is_active !== undefined) query.append('is_active', params.is_active);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return apiRequest(`/categories?${query.toString()}`);
  },

  getCategory: async (id) => {
    return apiRequest(`/categories/${id}`);
  },

  createCategory: async (data) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory: async (id, data) => {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCategory: async (id, forceDeactivate = false) => {
    return apiRequest(`/categories/${id}?deactivate_if_has_products=${forceDeactivate}`, {
      method: 'DELETE',
    });
  },

  // Products
  getProducts: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.stock_status) query.append('stock_status', params.stock_status);
    if (params.is_active !== undefined) query.append('is_active', params.is_active);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return apiRequest(`/products?${query.toString()}`);
  },

  getProduct: async (id) => {
    return apiRequest(`/products/${id}`);
  },

  createProduct: async (data) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct: async (id, data) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteProduct: async (id, forceDeactivate = false) => {
    return apiRequest(`/products/${id}?force_deactivate=${forceDeactivate}`, {
      method: 'DELETE',
    });
  },

  // Warehouses
  getWarehouses: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.is_active !== undefined) query.append('is_active', params.is_active);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return apiRequest(`/warehouses?${query.toString()}`);
  },

  getWarehouse: async (id) => {
    return apiRequest(`/warehouses/${id}`);
  },

  createWarehouse: async (data) => {
    return apiRequest('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateWarehouse: async (id, data) => {
    return apiRequest(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteWarehouse: async (id, forceDeactivate = false) => {
    return apiRequest(`/warehouses/${id}?force_deactivate=${forceDeactivate}`, {
      method: 'DELETE',
    });
  },

  // Stock / Inventory Operations
  getInventory: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.product_id) query.append('product_id', params.product_id);
    if (params.warehouse_id) query.append('warehouse_id', params.warehouse_id);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.stock_status) query.append('stock_status', params.stock_status);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return apiRequest(`/inventory?${query.toString()}`);
  },

  stockIn: async (data) => {
    return apiRequest('/inventory/stock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  stockOut: async (data) => {
    return apiRequest('/inventory/stock-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  stockAdjust: async (data) => {
    return apiRequest('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  stockTransfer: async (data) => {
    return apiRequest('/inventory/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMovements: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.product_id) query.append('product_id', params.product_id);
    if (params.warehouse_id) query.append('warehouse_id', params.warehouse_id);
    if (params.movement_type) query.append('movement_type', params.movement_type);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return apiRequest(`/inventory/movements?${query.toString()}`);
  },

  getLowStock: async (warehouseId = null) => {
    const query = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    return apiRequest(`/inventory/low-stock${query}`);
  },

  getInventorySummary: async () => {
    return apiRequest('/inventory/summary');
  },
};
