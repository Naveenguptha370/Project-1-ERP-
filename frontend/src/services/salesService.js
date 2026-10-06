import api from './api';

export const salesService = {
  // Analytics & Dashboard
  async getDashboardData() {
    const response = await api.get('/sales/analytics/dashboard');
    return response.data;
  },

  // Master Data
  async getCustomers(search = '') {
    const response = await api.get(`/master/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    return response.data;
  },

  async createCustomer(data) {
    const response = await api.post('/master/customers', data);
    return response.data;
  },

  async getProducts(search = '') {
    const response = await api.get(`/master/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    return response.data;
  },

  // Quotations
  async getQuotations(status = '', search = '') {
    let url = '/sales/quotations?';
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    const response = await api.get(url);
    return response.data;
  },

  async getQuotation(id) {
    const response = await api.get(`/sales/quotations/${id}`);
    return response.data;
  },

  async createQuotation(data) {
    const response = await api.post('/sales/quotations', data);
    return response.data;
  },

  async updateQuotationStatus(id, status) {
    const response = await api.patch(`/sales/quotations/${id}/status`, { status });
    return response.data;
  },

  async convertQuotationToOrder(id) {
    const response = await api.post(`/sales/quotations/${id}/convert-to-order`);
    return response.data;
  },

  async deleteQuotation(id) {
    const response = await api.delete(`/sales/quotations/${id}`);
    return response.data;
  },

  // Sales Orders
  async getOrders(status = '', search = '') {
    let url = '/sales/orders?';
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    const response = await api.get(url);
    return response.data;
  },

  async getOrder(id) {
    const response = await api.get(`/sales/orders/${id}`);
    return response.data;
  },

  async createOrder(data) {
    const response = await api.post('/sales/orders', data);
    return response.data;
  },

  async updateOrderStatus(id, status) {
    const response = await api.patch(`/sales/orders/${id}/status`, { status });
    return response.data;
  },

  async convertOrderToInvoice(id) {
    const response = await api.post(`/sales/orders/${id}/convert-to-invoice`);
    return response.data;
  },

  async deleteOrder(id) {
    const response = await api.delete(`/sales/orders/${id}`);
    return response.data;
  },

  // Invoices
  async getInvoices(status = '', search = '') {
    let url = '/sales/invoices?';
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    const response = await api.get(url);
    return response.data;
  },

  async getInvoice(id) {
    const response = await api.get(`/sales/invoices/${id}`);
    return response.data;
  },

  async createInvoice(data) {
    const response = await api.post('/sales/invoices', data);
    return response.data;
  },

  async updateInvoiceStatus(id, status) {
    const response = await api.patch(`/sales/invoices/${id}/status`, { status });
    return response.data;
  },

  async deleteInvoice(id) {
    const response = await api.delete(`/sales/invoices/${id}`);
    return response.data;
  },

  // Payments
  async getPayments(invoiceId = null, search = '') {
    let url = '/sales/payments?';
    if (invoiceId) url += `invoice_id=${invoiceId}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    const response = await api.get(url);
    return response.data;
  },

  async recordPayment(data) {
    const response = await api.post('/sales/payments', data);
    return response.data;
  },
};
