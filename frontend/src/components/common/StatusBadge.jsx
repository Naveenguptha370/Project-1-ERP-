import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  if (type === 'stock') {
    if (status === 'OUT OF STOCK' || status === 'OUT_OF_STOCK') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5"></span>
          OUT OF STOCK
        </span>
      );
    }
    if (status === 'LOW STOCK' || status === 'LOW_STOCK') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5"></span>
          LOW STOCK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
        IN STOCK
      </span>
    );
  }

  // Active / Inactive
  const isActive = status === true || status === 'active' || status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
