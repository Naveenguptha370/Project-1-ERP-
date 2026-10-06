import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { inventoryApi } from '../../api/inventoryApi';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Warehouse, 
  Boxes, 
  History, 
  AlertTriangle 
} from 'lucide-react';

export default function InventoryLayout() {
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    async function fetchAlertCount() {
      try {
        const items = await inventoryApi.getLowStock();
        setLowStockCount(items.length);
      } catch (e) {
        // silent fallback
      }
    }
    fetchAlertCount();
  }, []);

  const navTabs = [
    { name: 'Overview', path: '/inventory', end: true, icon: LayoutDashboard },
    { name: 'Products', path: '/inventory/products', icon: Package },
    { name: 'Categories', path: '/inventory/categories', icon: FolderTree },
    { name: 'Warehouses', path: '/inventory/warehouses', icon: Warehouse },
    { name: 'Stock Overview', path: '/inventory/stock', icon: Boxes },
    { name: 'Stock Movements', path: '/inventory/movements', icon: History },
    { 
      name: 'Low Stock Alerts', 
      path: '/inventory/low-stock', 
      icon: AlertTriangle,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
  ];

  return (
    <div>
      <Breadcrumb />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 mb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Inventory Management Subsystem
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Module
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise stock control, multi-warehouse distribution, movements audit trail, and valuation.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 mb-6 overflow-x-auto pb-px">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white font-bold shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
              {tab.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${tab.badgeColor || 'bg-slate-200 text-slate-800'}`}>
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Active Tab Page Content */}
      <Outlet />
    </div>
  );
}
