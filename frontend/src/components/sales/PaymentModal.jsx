import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { salesService } from '../../services/salesService';
import { useNotify } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/constants';

export const PaymentModal = ({ isOpen, onClose, onSuccess, preselectedInvoice = null }) => {
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);

  const [formData, setFormData] = useState({
    invoice_id: '',
    customer_name: '',
    amount: '',
    payment_method: 'Bank Transfer',
    reference_number: '',
    notes: 'Payment received towards invoice settlement.',
  });

  const loadUnpaidInvoices = async () => {
    try {
      const allInvs = await salesService.getInvoices();
      const pending = allInvs.filter((inv) => inv.balance_due > 0);
      setInvoices(pending);
      if (pending.length > 0) {
        const first = pending[0];
        setFormData((prev) => ({
          ...prev,
          invoice_id: first.id,
          customer_name: first.customer_name,
          amount: first.balance_due,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (preselectedInvoice) {
        setFormData({
          invoice_id: preselectedInvoice.id,
          customer_name: preselectedInvoice.customer_name,
          amount: preselectedInvoice.balance_due || preselectedInvoice.total_amount,
          payment_method: 'Bank Transfer',
          reference_number: '',
          notes: `Settlement for Invoice ${preselectedInvoice.invoice_number}`,
        });
      } else {
        loadUnpaidInvoices();
      }
    }
  }, [isOpen, preselectedInvoice]);

  const handleInvoiceChange = (e) => {
    const invId = parseInt(e.target.value, 10);
    const selected = invoices.find((inv) => inv.id === invId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        invoice_id: selected.id,
        customer_name: selected.customer_name,
        amount: selected.balance_due,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoice_id) {
      notify.error('Please select an invoice to record payment against');
      return;
    }
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      notify.error('Please enter a valid positive payment amount');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        invoice_id: parseInt(formData.invoice_id, 10),
        amount: amt,
      };
      const result = await salesService.recordPayment(payload);
      notify.success(`Payment ${result.payment_number} of ${formatCurrency(result.amount)} successfully recorded!`);
      onSuccess();
      onClose();
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment Receipt"
      subtitle="Receive customer funds and auto-settle outstanding invoice balance"
      size="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Target Commercial Invoice *
          </label>
          {preselectedInvoice ? (
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-bold text-white">
                  {preselectedInvoice.invoice_number}
                </span>
                <span className="text-xs text-slate-400 ml-2">({preselectedInvoice.customer_name})</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Balance Due:</span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {formatCurrency(preselectedInvoice.balance_due)}
                </span>
              </div>
            </div>
          ) : (
            <select
              required
              value={formData.invoice_id}
              onChange={handleInvoiceChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {invoices.length === 0 ? (
                <option value="">No pending unpaid invoices found</option>
              ) : (
                invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} — {inv.customer_name} (Due: {formatCurrency(inv.balance_due)})
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Customer / Payer</label>
          <input
            type="text"
            required
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
          />
        </div>

        {/* Amount & Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="UPI">UPI (Unified Payments Interface)</option>
              <option value="Credit Card">Credit / Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Bank Cheque</option>
            </select>
          </div>
        </div>

        {/* Reference / Transaction ID */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Reference / Transaction / UTR / Cheque #
          </label>
          <input
            type="text"
            placeholder="e.g. UTR-HDFC-99182399 or Cheque #49281"
            value={formData.reference_number}
            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Receipt Notes / Memo</label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Process Payment & Settle</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
