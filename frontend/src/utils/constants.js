export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

export const STATUS_COLORS = {
  // Quotations
  Draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20',

  // Orders
  Confirmed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Processing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',

  // Invoices
  Unpaid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Partially Paid': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',

  // Payments
  Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};
