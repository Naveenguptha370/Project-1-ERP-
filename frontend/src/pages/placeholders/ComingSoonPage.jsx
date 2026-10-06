import React from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { Clock, ArrowLeft, Boxes } from 'lucide-react';

export default function ComingSoonPage({ category = 'Enterprise', moduleName, description, icon: Icon }) {
  return (
    <div>
      <Breadcrumb items={[{ label: moduleName, url: '#' }]} />

      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-xl mx-auto text-center shadow-sm">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {Icon ? <Icon className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
        </div>
        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
          {category} Module
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-3">{moduleName}</h2>
        <div className="inline-block mt-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
          Coming Soon
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600">
          <div className="font-semibold text-slate-800 mb-1">Module Status:</div>
          <div>This module is slated for upcoming release. The core Inventory and Supply Chain Subsystems are currently live and operational.</div>
        </div>

        <div className="mt-6">
          <Link
            to="/inventory"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <Boxes className="w-4 h-4" />
            <span>Open Inventory Module</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
