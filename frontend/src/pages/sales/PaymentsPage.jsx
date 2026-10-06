import React, { useState, useEffect } from 'react';
import { salesService } from '../../services/salesService';
import { useNotify } from '../../context/NotificationContext';
import { Badge } from '../../components/common/Badge';
import { PaymentModal } from '../../components/sales/PaymentModal';
import { formatCurrency, formatDate } from '../../utils/constants';
import {
  Plus,
  Search,
  CreditCard,
  Printer,
  Loader2,
  Landmark,
  Smartphone,
  Banknote,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const PaymentsPage = () => {
  const notify = useNotify();
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setModalOpen(true);
    }
  }, [searchParams]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await salesService.getPayments(null, search);
      setPayments(data);
    } catch {
      notify.error('Failed to load payment receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPayments();
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Bank Transfer':
        return <Landmark className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Payments & Collections Ledger
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {payments.length} receipts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Accounts receivable payments received, multi-channel payment reconciliation, and audit receipts
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <Landmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bank Transfers</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>UPI</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Cards</span>
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search payment #, ref # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-72"
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

      {/* Payments Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Receipt #</th>
                <th className="py-3.5 px-4 font-semibold">Customer / Payer</th>
                <th className="py-3.5 px-4 font-semibold">Payment Date</th>
                <th className="py-3.5 px-4 font-semibold">Method</th>
                <th className="py-3.5 px-4 font-semibold">Reference ID</th>
                <th className="py-3.5 px-4 font-semibold text-right">Amount Received</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Receipt Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Loading payment receipts...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No payment receipts logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
                      {p.payment_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">{p.customer_name}</td>
                    <td className="py-3.5 px-4 text-slate-300">{formatDate(p.payment_date)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        {getMethodIcon(p.payment_method)}
                        <span>{p.payment_method}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {p.reference_number || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors inline-flex items-center space-x-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>View Voucher</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadPayments}
      />

      {/* Payment Voucher Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Payment Receipt Voucher</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white text-slate-900 rounded-xl space-y-3 font-sans">
              <div className="flex justify-between border-b pb-2">
                <div>
                  <h4 className="font-bold text-indigo-700">SmartERP System</h4>
                  <p className="text-xs text-slate-500">Official Payment Acknowledgement</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {selectedReceipt.payment_number}
                  </span>
                  <p className="text-[10px] text-slate-500">{formatDate(selectedReceipt.payment_date)}</p>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Received From:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-medium text-slate-800">{selectedReceipt.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction / Ref:</span>
                  <span className="font-mono text-slate-800">
                    {selectedReceipt.reference_number || 'Direct Payment'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-700 pt-2 border-t">
                  <span>Amount Settled:</span>
                  <span className="font-mono">{formatCurrency(selectedReceipt.amount)}</span>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border">
                  <strong>Notes:</strong> {selectedReceipt.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
