import React, { useCallback, useEffect, useState } from 'react';
import { Check, Receipt, X } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800';

export default function FinancePage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { notifyError, notifySuccess } = useNotification();
  const roles = (user?.roles || []).map((role) => typeof role === 'string' ? role : role.name);
  const canReview = user?.is_superuser || roles.some((role) => ['ADMIN', 'MANAGER'].includes(role));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setExpenses(await businessService.getExpenses());
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not load expenses');
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const createExpense = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    data.amount = Number(data.amount);
    data.expense_date = data.expense_date ? new Date(data.expense_date).toISOString() : null;
    for (const key of ['vendor', 'payment_method', 'reference_number', 'notes']) data[key] ||= null;
    try {
      await businessService.createExpense(data);
      form.reset();
      notifySuccess('Expense submitted for approval');
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not submit expense');
    }
  };

  const review = async (expense, status) => {
    const review_note = window.prompt(`Optional note for ${status.toLowerCase()} this expense:`) || null;
    try {
      await businessService.reviewExpense(expense.id, { status, review_note });
      notifySuccess(`Expense ${status.toLowerCase()}`);
      await load();
    } catch (error) {
      notifyError(error.response?.data?.detail || 'Could not review expense');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Accounting operations</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Finance</h1>
        <p className="mt-1 text-sm text-slate-500">Submit expenses and track manager/admin approval decisions.</p>
      </header>

      <form onSubmit={createExpense} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
        <h2 className="md:col-span-3 font-semibold text-slate-800">Submit expense</h2>
        <input name="category" required minLength={2} placeholder="Category (e.g. Travel)" className={inputClass} />
        <input name="description" required minLength={2} placeholder="Description" className={inputClass} />
        <input name="amount" required type="number" min="0.01" step="0.01" placeholder="Amount" className={inputClass} />
        <input name="vendor" placeholder="Vendor" className={inputClass} />
        <input name="expense_date" type="datetime-local" className={inputClass} />
        <select name="payment_method" className={inputClass} defaultValue=""><option value="">Payment method</option>{['Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'Other'].map((item) => <option key={item}>{item}</option>)}</select>
        <input name="reference_number" placeholder="Reference number" className={inputClass} />
        <input name="notes" placeholder="Notes" className={inputClass} />
        <button className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Receipt size={16} /> Submit expense
        </button>
      </form>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 p-4 font-semibold text-slate-800">Expense register</div>
        {loading ? <p className="p-5 text-sm text-slate-500">Loading expenses…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Expense</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Review</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 font-medium">{expense.expense_number}</td>
                    <td className="px-4 py-3">{expense.category}</td>
                    <td className="px-4 py-3">{expense.description}{expense.review_note && <p className="mt-1 text-xs text-slate-500">{expense.review_note}</p>}</td>
                    <td className="px-4 py-3">₹{Number(expense.amount).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${expense.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : expense.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{expense.status}</span></td>
                    <td className="px-4 py-3">
                      {canReview && expense.status === 'Submitted' ? (
                        <div className="flex gap-3">
                          <button onClick={() => review(expense, 'Approved')} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check size={14} /> Approve</button>
                          <button onClick={() => review(expense, 'Rejected')} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700"><X size={14} /> Reject</button>
                        </div>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
                {!expenses.length && <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">No expenses have been submitted.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
