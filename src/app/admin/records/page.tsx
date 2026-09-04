'use client';

import React, { useState, useEffect } from 'react';
import { tiffinRecordService, userService } from '@/services/api';
import { TiffinRecord, User, RecordStatus } from '@/types';
import { CalendarCheck, Search, Filter, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminRecordsPage() {
  const [records, setRecords] = useState<TiffinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, empRes] = await Promise.all([
        tiffinRecordService.getRecords({
          userId: selectedUser ? Number(selectedUser) : undefined,
          status: selectedStatus || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          size: 50,
        }),
        userService.getAllEmployees(),
      ]);

      if (recRes.success && recRes.data) {
        setRecords(recRes.data.content);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err) {
      console.error('Failed to load records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedUser, selectedStatus, startDate, endDate]);

  const totalAmount = records.reduce((sum, r) => sum + Number(r.chargedAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-orange-600" />
            <span>Daily Tiffin Consumption Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable records of approved tiffins with frozen pricing and menu snapshots.
          </p>
        </div>
        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
          <span className="text-slate-500">Filtered Total Value: </span>
          <span className="font-bold text-orange-600">Rs. {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Records</option>
            <option value="UNPAID">UNPAID (Pending Settlement)</option>
            <option value="BILLED_PAID">BILLED_PAID (Invoiced)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Menu Items Snapshot</th>
                <th className="py-3 px-4">Charged Price</th>
                <th className="py-3 px-4">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.serviceDate}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{rec.userName}</div>
                      <div className="text-[10px] text-slate-500">{rec.userEmail}</div>
                    </td>
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
                    <td className="py-3 px-4 font-bold text-slate-900">
                      Rs. {Number(rec.chargedAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'BILLED_PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status === 'BILLED_PAID' ? 'BILLED & SETTLED' : 'UNPAID'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
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