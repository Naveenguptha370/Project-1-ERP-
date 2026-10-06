import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { salesService } from '../../services/salesService';
import { useNotify } from '../../context/NotificationContext';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/constants';

export const QuotationModal = ({ isOpen, onClose, onSuccess }) => {
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    valid_until: '',
    notes: 'Thank you for your business. This quotation is valid for 30 days.',
    terms: 'Payment terms: 50% advance, 50% upon delivery. Standard warranties apply.',
    items: [
      {
        product_id: '',
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        tax_rate: 18,
      },
    ],
  });

  const loadMasterData = async () => {
    try {
      const [custList, prodList] = await Promise.all([
        salesService.getCustomers(),
        salesService.getProducts(),
      ]);
      setCustomers(custList);
      setProducts(prodList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMasterData();
    }
  }, [isOpen]);

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setFormData((prev) => ({
        ...prev,
        customer_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
      }));
      return;
    }
    const selected = customers.find((c) => c.id === parseInt(custId, 10));
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        customer_id: selected.id,
        customer_name: selected.name,
        customer_email: selected.email || '',
        customer_phone: selected.phone || '',
        customer_address: selected.address || '',
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill price & tax if product was selected
    if (field === 'product_id') {
      const prod = products.find((p) => p.id === parseInt(value, 10));
      if (prod) {
        newItems[index].product_name = prod.name;
        newItems[index].description = prod.description || '';
        newItems[index].unit_price = prod.unit_price;
        newItems[index].tax_rate = prod.tax_rate;
      }
    }

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: '',
          product_name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount_percent: 0,
          tax_rate: 18,
        },
      ],
    }));
  };

  const removeItemRow = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Live calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    formData.items.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const discPct = parseFloat(item.discount_percent) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;

      const base = qty * price;
      const discount = base * (discPct / 100);
      const afterDiscount = base - discount;
      const tax = afterDiscount * (taxRate / 100);

      subtotal += base;
      totalDiscount += discount;
      totalTax += tax;
    });

    return {
      subtotal,
      totalDiscount,
      totalTax,
      totalAmount: subtotal - totalDiscount + totalTax,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      notify.error('Please enter or select a customer name');
      return;
    }

    for (let i = 0; i < formData.items.length; i++) {
      if (!formData.items[i].product_name.trim()) {
        notify.error(`Item #${i + 1} must have a product name`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        customer_id: formData.customer_id ? parseInt(formData.customer_id, 10) : null,
        items: formData.items.map((it) => ({
          ...it,
          product_id: it.product_id ? parseInt(it.product_id, 10) : null,
          quantity: parseFloat(it.quantity) || 1,
          unit_price: parseFloat(it.unit_price) || 0,
          discount_percent: parseFloat(it.discount_percent) || 0,
          tax_rate: parseFloat(it.tax_rate) || 0,
        })),
      };

      const result = await salesService.createQuotation(payload);
      notify.success(`Quotation ${result.quote_number} generated successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Quotation"
      subtitle="Issue an estimate with calculated line items, taxes and discounts"
      size="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Customer Details
            </h4>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400">Quick Select:</label>
              <select
                value={formData.customer_id}
                onChange={handleCustomerChange}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Choose Existing Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Customer / Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="e.g. Apex Global Tech"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                placeholder="billing@client.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Billing Address</label>
              <input
                type="text"
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                placeholder="City, State, Postal Code"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valid Until Date</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Products & Line Items
            </h4>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item Row</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700/40">
                  <th className="pb-2 font-medium">Catalog / Item</th>
                  <th className="pb-2 font-medium w-20">Qty</th>
                  <th className="pb-2 font-medium w-28">Unit Price</th>
                  <th className="pb-2 font-medium w-20">Disc %</th>
                  <th className="pb-2 font-medium w-20">Tax %</th>
                  <th className="pb-2 font-medium w-28 text-right">Line Total</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {formData.items.map((item, index) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.unit_price) || 0;
                  const disc = parseFloat(item.discount_percent) || 0;
                  const tax = parseFloat(item.tax_rate) || 0;
                  const base = qty * price;
                  const afterDisc = base - base * (disc / 100);
                  const lineTotal = afterDisc + afterDisc * (tax / 100);

                  return (
                    <tr key={index} className="group">
                      <td className="py-2.5 pr-2">
                        <div className="space-y-1">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-slate-300 mb-1"
                          >
                            <option value="">-- Choose from Catalog --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({formatCurrency(p.unit_price)})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Product or service name"
                            value={item.product_name}
                            onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-right"
                        />
                      </td>
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-right"
                        />
                      </td>
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.discount_percent}
                          onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-right"
                        />
                      </td>
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.tax_rate}
                          onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-right"
                        />
                      </td>
                      <td className="py-2.5 pr-2 text-right font-mono font-semibold text-white">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          type="button"
                          disabled={formData.items.length <= 1}
                          onClick={() => removeItemRow(index)}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-3 border-t border-slate-700/60">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Discount:</span>
                <span className="font-mono text-rose-400">-{formatCurrency(totals.totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST / Tax:</span>
                <span className="font-mono text-emerald-400">+{formatCurrency(totals.totalTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-700">
                <span>Grand Total:</span>
                <span className="font-mono text-indigo-400">{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Terms & Conditions</label>
            <textarea
              rows="2"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Generate Quotation</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
