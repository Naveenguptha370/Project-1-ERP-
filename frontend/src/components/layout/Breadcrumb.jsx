import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  const location = useLocation();

  let breadcrumbItems = items;
  if (!breadcrumbItems.length) {
    const paths = location.pathname.split('/').filter(Boolean);
    breadcrumbItems = paths.map((path, idx) => {
      const url = `/${paths.slice(0, idx + 1).join('/')}`;
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
      return { label, url };
    });
  }

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-4">
      <Link to="/" className="hover:text-indigo-600 flex items-center gap-1 transition">
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{item.label}</span>
            ) : (
              <Link to={item.url} className="hover:text-indigo-600 transition">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
