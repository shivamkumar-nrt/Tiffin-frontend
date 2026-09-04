'use client';

import React, { useState, useEffect } from 'react';
import { auditLogService } from '@/services/api';
import { AuditLog } from '@/types';
import { History, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await auditLogService.getRecentLogs();
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <History className="w-5 h-5 text-orange-600" />
          <span>Audit Trail & Activity Log</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Complete traceability for administrative approvals, rejections, payment verifications, and invoices.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
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
                  {format(new Date(log.timestamp), 'dd MMM yyyy, hh:mm a')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No audit logs captured yet.
          </div>
        )}
      </div>
    </div>
  );
}