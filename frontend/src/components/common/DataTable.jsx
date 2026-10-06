import React from 'react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  rowKey = 'id',
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium text-slate-500">Loading data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-12 text-center">
        <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {data.map((row, rIdx) => {
              const key = row[rowKey] ?? rIdx;
              return (
                <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-4 py-3.5 align-middle ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
