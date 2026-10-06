import React from 'react';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { Layers, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ModuleStubPage({ category = 'Upcoming Subsystem', moduleName, description, icon: Icon, color = 'indigo' }) {
  return (
    <div>
      <Breadcrumb items={[{ label: moduleName, url: '#' }]} />

      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl mx-auto text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-700">
          {Icon ? <Icon className="w-8 h-8 text-indigo-600" /> : <Layers className="w-8 h-8 text-indigo-600" />}
        </div>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
          {category}
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-4">{moduleName}</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600">
          <div className="font-semibold text-slate-800 mb-1">Architecture Integration Notice:</div>
          <div>This module integrates with the core ERP bus. The Inventory Management subsystem provides dedicated service hooks (<code className="text-indigo-600 font-mono">deduct_stock</code>, <code className="text-indigo-600 font-mono">add_stock</code>, and reporting feeds) ready for transactional operations.</div>
        </div>

        <div className="mt-6">
          <Link
            to="/inventory"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Inventory Subsystem</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
