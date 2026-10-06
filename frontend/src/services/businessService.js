import api from './api';

export const businessService = {
  getCustomers: async () => (await api.get('/crm/customers')).data,
  createCustomer: async (data) => (await api.post('/crm/customers', data)).data,
  updateCustomer: async (id, data) => (await api.patch(`/crm/customers/${id}`, data)).data,
  deleteCustomer: async (id) => api.delete(`/crm/customers/${id}`),
  getLeads: async () => (await api.get('/crm/leads')).data,
  createLead: async (data) => (await api.post('/crm/leads', data)).data,
  updateLead: async (id, data) => (await api.patch(`/crm/leads/${id}`, data)).data,
  convertLead: async (id) => (await api.post(`/crm/leads/${id}/convert`)).data,
  getActivities: async (params) => (await api.get('/crm/activities', { params })).data,
  createActivity: async (data) => (await api.post('/crm/activities', data)).data,
  getSuppliers: async () => (await api.get('/procurement/suppliers')).data,
  createSupplier: async (data) => (await api.post('/procurement/suppliers', data)).data,
  getPurchaseOrders: async () => (await api.get('/procurement/purchase-orders')).data,
  createPurchaseOrder: async (data) => (await api.post('/procurement/purchase-orders', data)).data,
  updatePurchaseOrderStatus: async (id, status) =>
    (await api.patch(`/procurement/purchase-orders/${id}/status`, { status })).data,
  getExpenses: async () => (await api.get('/finance/expenses')).data,
  createExpense: async (data) => (await api.post('/finance/expenses', data)).data,
  reviewExpense: async (id, data) => (await api.patch(`/finance/expenses/${id}/review`, data)).data,
  getDashboardReport: async () => (await api.get('/reports/dashboard')).data,
  getSalesReport: async () => (await api.get('/reports/sales')).data,
  getInventoryReport: async () => (await api.get('/reports/inventory')).data,
  getFinanceReport: async () => (await api.get('/reports/finance')).data,
};
