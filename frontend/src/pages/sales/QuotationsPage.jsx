import React, { useState, useEffect } from 'react';
import { salesService } from '../../services/salesService';
import { useNotify } from '../../context/NotificationContext';
import { Badge } from '../../components/common/Badge';
import { QuotationModal } from '../../components/sales/QuotationModal';
import { DocumentPrintModal } from '../../components/sales/DocumentPrintModal';
import { formatCurrency, formatDate } from '../../utils/constants';
import {
  Plus,
  Search,
  ArrowRight,
  Printer,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const QuotationsPage = () => {
  const notify = useNotify();
  const [searchParams] = useSearchParams();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Print Preview
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setModalOpen(true);
    }
  }, [searchParams]);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const data = await salesService.getQuotations(statusFilter, search);
      setQuotations(data);
    } catch {
      notify.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadQuotations();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await salesService.updateQuotationStatus(id, newStatus);
      notify.success(`Status updated to ${newStatus}`);
      loadQuotations();
    } catch {
      notify.error('Failed to update status');
    }
  };

  const handleConvertToOrder = async (quote) => {
    if (!window.confirm(`Convert Quotation ${quote.quote_number} into a confirmed Sales Order?`)) {
      return;
    }
    try {
      const order = await salesService.convertQuotationToOrder(quote.id);
      notify.success(`Successfully converted to Sales Order ${order.order_number}!`);
      loadQuotations();
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to convert quotation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await salesService.deleteQuotation(id);
      notify.success('Quotation deleted successfully');
      loadQuotations();
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to delete quotation');
    }
  };

  const openPrint = (quote) => {
    setSelectedQuote(quote);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Quotations & Proposals
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {quotations.length} records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, send, and convert price estimates into active customer orders
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quotation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['', 'Draft', 'Sent', 'Accepted', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {st === '' ? 'All Status' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search quote # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Quote #</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Issue Date</th>
                <th className="py-3.5 px-4 font-semibold">Valid Until</th>
                <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    <span>Loading quotations...</span>
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No quotations found matching your criteria.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">
                      {q.quote_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{q.customer_name}</div>
                      {q.customer_email && (
                        <div className="text-[11px] text-slate-400">{q.customer_email}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{formatDate(q.issue_date)}</td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(q.valid_until)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(q.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={q.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Convert to Sales Order */}
                        {!q.sales_order_id && q.status !== 'Rejected' && (
                          <button
                            onClick={() => handleConvertToOrder(q)}
                            title="Convert to Sales Order"
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                          >
                            <span>To Order</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {q.sales_order_id && (
                          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            Ordered
                          </span>
                        )}

                        {/* View & Print */}
                        <button
                          onClick={() => openPrint(q)}
                          title="Print Document"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Status Toggle Dropdown */}
                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(q.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-[11px] rounded-lg px-2 py-1 text-slate-300 hover:text-white focus:outline-none"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                        </select>

                        {/* Delete */}
                        {!q.sales_order_id && (
                          <button
                            onClick={() => handleDelete(q.id)}
                            title="Delete Quotation"
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

      {/* Creation Modal */}
      <QuotationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadQuotations}
      />

      {/* Document Print Modal */}
      <DocumentPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        document={selectedQuote}
        docType="Quotation"
      />
    </div>
  );
};
