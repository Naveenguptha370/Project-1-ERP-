import React, { useState, useEffect } from 'react';
import { salesService } from '../../services/salesService';
import { useNotify } from '../../context/NotificationContext';
import { Badge } from '../../components/common/Badge';
import { InvoiceModal } from '../../components/sales/InvoiceModal';
import { PaymentModal } from '../../components/sales/PaymentModal';
import { DocumentPrintModal } from '../../components/sales/DocumentPrintModal';
import { formatCurrency, formatDate } from '../../utils/constants';
import {
  Plus,
  Search,
  CreditCard,
  Printer,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const InvoicesPage = () => {
  const notify = useNotify();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState(null);

  // Print Preview
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setInvoiceModalOpen(true);
    }
  }, [searchParams]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await salesService.getInvoices(statusFilter, search);
      setInvoices(data);
    } catch {
      notify.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInvoices();
  };

  const handleRecordPayment = (inv) => {
    setTargetInvoiceForPayment(inv);
    setPaymentModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this commercial invoice?')) return;
    try {
      await salesService.deleteInvoice(id);
      notify.success('Invoice deleted successfully');
      loadInvoices();
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to delete invoice');
    }
  };

  const openPrint = (inv) => {
    setSelectedInvoice(inv);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Commercial Invoices & Receivables
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {invoices.length} invoices
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Accounts receivable billing ledger, payment balance tracking, and auto-settlements
          </p>
        </div>

        <button
          onClick={() => setInvoiceModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {st === '' ? 'All Invoices' : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Invoice #</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Issue Date</th>
                <th className="py-3.5 px-4 font-semibold">Due Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Total</th>
                <th className="py-3.5 px-4 font-semibold text-right">Amount Paid</th>
                <th className="py-3.5 px-4 font-semibold text-right">Balance Due</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span>Loading invoices...</span>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    No commercial invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{inv.customer_name}</div>
                      {inv.customer_email && (
                        <div className="text-[11px] text-slate-400">{inv.customer_email}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{formatDate(inv.issue_date)}</td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(inv.due_date)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                      {formatCurrency(inv.amount_paid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                      {formatCurrency(inv.balance_due)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Record Payment Button */}
                        {inv.balance_due > 0 && (
                          <button
                            onClick={() => handleRecordPayment(inv)}
                            title="Collect Payment"
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect</span>
                          </button>
                        )}

                        {/* View & Print */}
                        <button
                          onClick={() => openPrint(inv)}
                          title="Print Commercial Invoice"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Delete if unpaid */}
                        {inv.amount_paid <= 0 && (
                          <button
                            onClick={() => handleDelete(inv.id)}
                            title="Delete Invoice"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        onSuccess={loadInvoices}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setTargetInvoiceForPayment(null);
        }}
        preselectedInvoice={targetInvoiceForPayment}
        onSuccess={loadInvoices}
      />

      {/* Document Print Modal */}
      <DocumentPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        document={selectedInvoice}
        docType="Invoice"
      />
    </div>
  );
};
