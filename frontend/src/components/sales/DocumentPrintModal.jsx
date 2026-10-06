import React from 'react';
import { Modal } from '../common/Modal';
import { Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/constants';

export const DocumentPrintModal = ({ isOpen, onClose, document, docType = 'Quotation' }) => {
  if (!document) return null;

  const handlePrint = () => {
    window.print();
  };

  const isInvoice = docType === 'Invoice';

  const docNumber =
    document.quote_number || document.order_number || document.invoice_number || 'DOC-001';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${docType} Document Preview`}
      subtitle={`Official ${docType} — ${docNumber}`}
      size="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Print Toolbar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 no-print">
          <span className="text-xs text-slate-300 font-medium">
            Review formatted layout or print/save as PDF
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice / Quotation / Order Canvas */}
        <div className="p-8 bg-white text-slate-900 rounded-2xl shadow-xl printable-area font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base">
                  S
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">SmartERP</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Enterprise Cloud Systems Pvt Ltd
              </p>
              <p className="text-xs text-slate-500">Cyber City Tech Park, Tower 4, Phase 2</p>
              <p className="text-xs text-slate-500">GSTIN: 36AABCS9821F1ZX | CIN: U72200TG2026PTC099182</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
                {docType}
              </span>
              <p className="text-lg font-mono font-bold text-slate-900">{docNumber}</p>
              <p className="text-xs text-slate-500 mt-1">
                Date: {formatDate(document.issue_date || document.order_date || document.created_at)}
              </p>
              {document.valid_until && (
                <p className="text-xs text-slate-500">
                  Valid Until: {formatDate(document.valid_until)}
                </p>
              )}
              {document.due_date && (
                <p className="text-xs text-rose-600 font-semibold">
                  Due Date: {formatDate(document.due_date)}
                </p>
              )}
            </div>
          </div>

          {/* Billed To / Shipped To */}
          <div className="grid grid-cols-2 gap-8 my-6 text-xs">
            <div>
              <h5 className="font-bold text-slate-400 uppercase tracking-wider mb-2">
                Customer Details
              </h5>
              <p className="text-sm font-bold text-slate-800">{document.customer_name}</p>
              {document.customer_email && <p className="text-slate-600">{document.customer_email}</p>}
              {document.customer_phone && <p className="text-slate-600">{document.customer_phone}</p>}
              {document.customer_address && (
                <p className="text-slate-600 mt-1">{document.customer_address}</p>
              )}
            </div>

            <div className="text-right">
              <h5 className="font-bold text-slate-400 uppercase tracking-wider mb-2">
                Transaction Status
              </h5>
              <p className="text-sm font-bold capitalize text-slate-800">{document.status}</p>
              {document.payment_terms && (
                <p className="text-slate-600 mt-1">Terms: {document.payment_terms}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="my-6">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Item & Description</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Disc %</th>
                  <th className="p-3 text-right">Tax %</th>
                  <th className="p-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {document.items &&
                  document.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {item.product_name}
                        {item.description && (
                          <span className="block text-[11px] font-normal text-slate-500">
                            {item.description}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-right font-mono">{item.discount_percent || 0}%</td>
                      <td className="p-3 text-right font-mono">{item.tax_rate || 18}%</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.total_amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end my-6">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-800">
                  {formatCurrency(document.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Discount:</span>
                <span className="font-mono text-rose-600">
                  -{formatCurrency(document.discount_amount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST Tax (18%):</span>
                <span className="font-mono text-slate-800">
                  +{formatCurrency(document.tax_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                <span>Total Document Value:</span>
                <span className="font-mono text-indigo-700">
                  {formatCurrency(document.total_amount)}
                </span>
              </div>

              {isInvoice && (
                <>
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold pt-1">
                    <span>Amount Received:</span>
                    <span className="font-mono">
                      {formatCurrency(document.amount_paid || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-600 font-bold pt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span className="font-mono">
                      {formatCurrency(document.balance_due || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes & Terms Footer */}
          {(document.notes || document.terms) && (
            <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 space-y-2">
              {document.notes && (
                <p>
                  <strong className="text-slate-700">Notes:</strong> {document.notes}
                </p>
              )}
              {document.terms && (
                <p>
                  <strong className="text-slate-700">Terms & Conditions:</strong>{' '}
                  {document.terms}
                </p>
              )}
            </div>
          )}

          {/* Signature Box */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400">
            <div>
              <p>Computer generated document. Authorized by SmartERP.</p>
            </div>
            <div className="text-center w-48 border-t border-slate-400 pt-1">
              <p className="font-semibold text-slate-700">Authorized Signatory</p>
              <p className="text-[10px] text-slate-400">For SmartERP Enterprise Systems</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
