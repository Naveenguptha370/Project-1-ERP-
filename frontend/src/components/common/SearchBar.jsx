import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
