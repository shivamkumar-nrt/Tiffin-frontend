'use client';

import React, { useState, useEffect } from 'react';
import { tiffinRecordService } from '@/services/api';
import { TiffinRecord } from '@/types';
import { CalendarCheck, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UserRecordsPage() {
  const [records, setRecords] = useState<TiffinRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        const res = await tiffinRecordService.getMyRecords();
        if (res.success && res.data) {
          setRecords(res.data);
        }
      } catch (err) {
        console.error('Failed to load records', err);
      } finally {
        setLoading(false);
      }
    };
    loadRecords();
  }, []);

  const totalCharged = records.reduce((sum, r) => sum + Number(r.chargedAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-orange-600" />
            <span>My Tiffin Consumption History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete date-wise log of meals received, food details, and charged rates.
          </p>
        </div>

        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
          <span className="text-slate-500">Total Consumption: </span>
          <span className="font-bold text-orange-600">Rs. {totalCharged.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Tiffin Type</th>
                <th className="py-3 px-4">Menu Items</th>
                <th className="py-3 px-4">Charged Amount</th>
                <th className="py-3 px-4">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.serviceDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.tiffinType === 'FULL' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.tiffinType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm">
                      {rec.menuSnapshot || 'Standard Daily Thali'}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      Rs. {Number(rec.chargedAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'BILLED_PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status === 'BILLED_PAID' ? 'PAID & INVOICED' : 'UNPAID'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No consumption records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}