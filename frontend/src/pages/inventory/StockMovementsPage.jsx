import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import { useNotification } from '../../context/NotificationContext';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterPanel from '../../components/common/FilterPanel';
import Pagination from '../../components/common/Pagination';
import { History, ShieldCheck, ArrowRight } from 'lucide-react';

const MOVEMENT_TYPES = [
  'STOCK_IN',
  'STOCK_OUT',
  'PURCHASE',
  'SALE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'RETURN_IN',
  'RETURN_OUT',
];

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { notifyError } = useNotification();

  useEffect(() => {
    async function loadWarehouses() {
      try {
        const res = await inventoryApi.getWarehouses({ limit: 100 });
        setWarehouses(res.items || []);
      } catch (err) {
        // fallback
      }
    }
    loadWarehouses();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getMovements({
        movement_type: selectedType || undefined,
        warehouse_id: selectedWarehouse ? parseInt(selectedWarehouse) : undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      });
      setMovements(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      notifyError(err.message || 'Failed to fetch movement history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [selectedType, selectedWarehouse, page]);

  const getMovementColor = (type) => {
    if (type.includes('IN') || type === 'PURCHASE') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (type.includes('OUT') || type === 'SALE') {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (type.includes('TRANSFER')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
          {new Date(row.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      header: 'Movement Type',
      accessor: 'movement_type',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getMovementColor(row.movement_type)}`}>
          {row.movement_type}
        </span>
      ),
    },
    {
      header: 'Product',
      accessor: 'product_name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.product_name}</span>
          <div className="text-[10px] text-slate-400 font-mono">{row.product_code}</div>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse_name',
      render: (row) => (
        <div>
          <span className="text-slate-800">{row.warehouse_name}</span>
          {row.source_warehouse_name && row.destination_warehouse_name && (
            <div className="text-[10px] text-indigo-600 flex items-center gap-1">
              <span>{row.source_warehouse_name}</span>
              <ArrowRight className="w-2.5 h-2.5" />
              <span>{row.destination_warehouse_name}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Qty Changed',
      accessor: 'quantity',
      render: (row) => (
        <span className={`font-mono font-bold text-xs ${
          row.movement_type.includes('OUT') || row.movement_type === 'SALE'
            ? 'text-rose-600'
            : 'text-emerald-600'
        }`}>
          {row.movement_type.includes('OUT') || row.movement_type === 'SALE' ? `-${row.quantity}` : `+${row.quantity}`}
        </span>
      ),
    },
    {
      header: 'Stock Delta',
      accessor: 'quantity_before',
      render: (row) => (
        <span className="font-mono text-slate-600 text-[11px]">
          {row.quantity_before} &rarr; <strong className="text-slate-900">{row.quantity_after}</strong>
        </span>
      ),
    },
    {
      header: 'Reference',
      accessor: 'reference_id',
      render: (row) => (
        <div className="text-[11px] font-mono text-slate-600">
          <span className="font-semibold text-slate-800">{row.reference_type || 'MANUAL'}</span>
          {row.reference_id && <div className="text-slate-400">{row.reference_id}</div>}
        </div>
      ),
    },
    {
      header: 'Performed By',
      accessor: 'creator_name',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.creator_name || 'System / Staff'}
        </span>
      ),
    },
    {
      header: 'Audit Notes',
      accessor: 'notes',
      render: (row) => (
        <span className="text-[11px] text-slate-500 truncate max-w-xs block">
          {row.notes || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Immutable audit trail. Every stock-changing transaction creates an indelible record.</span>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        onReset={() => {
          setSelectedType('');
          setSelectedWarehouse('');
          setPage(1);
        }}
        activeCount={(selectedType ? 1 : 0) + (selectedWarehouse ? 1 : 0)}
      >
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Movement Type</label>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Movement Types</option>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Facility Warehouse</label>
          <select
            value={selectedWarehouse}
            onChange={(e) => { setSelectedWarehouse(e.target.value); setPage(1); }}
            className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.warehouse_name} ({w.warehouse_code})
              </option>
            ))}
          </select>
        </div>
      </FilterPanel>

      {/* Movements Table */}
      <DataTable
        columns={columns}
        data={movements}
        loading={loading}
        emptyMessage="No stock movements recorded matching your filters."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
