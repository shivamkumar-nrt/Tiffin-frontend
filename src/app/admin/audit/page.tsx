'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { auditLogService } from '@/services/api';
import { AuditLog } from '@/types';
import { History, Shield, Clock, CheckCircle2, Search, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Loader from '@/components/Loader';
import Pagination from '@/components/Pagination';
import { useToast } from '@/context/ToastContext';

export default function AdminAuditPage() {
  const { showError } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await auditLogService.getRecentLogs();
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action))).filter(Boolean);
  }, [logs]);

  const uniqueEntities = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.entityName))).filter(Boolean);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
        (log.performedBy && log.performedBy.toLowerCase().includes(search.toLowerCase())) ||
        (log.action && log.action.toLowerCase().includes(search.toLowerCase())) ||
        (log.entityName && log.entityName.toLowerCase().includes(search.toLowerCase()));

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesEntity = entityFilter === 'ALL' || log.entityName === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, search, actionFilter, entityFilter]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, entityFilter, limit]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredLogs.slice(start, start + limit);
  }, [filteredLogs, page, limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-600" />
            <span>Audit Trail & Activity Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete traceability for administrative approvals, rejections, payment verifications, and invoices.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm font-semibold text-slate-700">
            Total Logs: <span className="text-emerald-600 font-bold">{logs.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit details or user..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Entities</option>
            {uniqueEntities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {loading ? (
          <div className="py-16">
            <Loader text="Loading audit trail..." />
          </div>
        ) : paginatedLogs.length > 0 ? (
          <div className="space-y-3">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start justify-between gap-4 hover:border-emerald-200 transition"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {log.entityName} #{log.entityId || '-'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      by <span className="font-semibold text-slate-600">{log.performedBy}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{log.details || '-'}</p>
                </div>

                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  {log.timestamp ? format(new Date(log.timestamp), 'dd MMM yyyy, hh:mm a') : '-'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            No audit logs found matching criteria.
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredLogs.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <Pagination
              totalItems={filteredLogs.length}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
              pageSizeOptions={[10, 15, 25, 50]}
            />
          </div>
        )}
      </div>
    </div>
  );
}