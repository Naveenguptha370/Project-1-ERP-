import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export default function FilterPanel({ children, onReset, activeCount = 0 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Filter Options
          </span>
          {activeCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-indigo-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}
