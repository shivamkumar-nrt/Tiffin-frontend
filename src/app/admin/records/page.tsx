'use client';

import React, { useState, useEffect } from 'react';
import { tiffinRecordService, userService } from '@/services/api';
import { TiffinRecord, User } from '@/types';
import {
  CalendarCheck,
  Search,
  Filter,
  Utensils,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { Loader } from '@/components/Loader';
import { useToast } from '@/context/ToastContext';
import { format, subDays, startOfMonth } from 'date-fns';

export default function AdminRecordsPage() {
  const toast = useToast();
  const [records, setRecords] = useState<TiffinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<User[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const loadData = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const [recRes, empRes] = await Promise.all([
        tiffinRecordService.getRecords({
          userId: selectedUser ? Number(selectedUser) : undefined,
          status: selectedStatus || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: page - 1,
          size: size,
        }),
        userService.getAllEmployees(),
      ]);

      if (recRes.success && recRes.data) {
        setRecords(recRes.data.content);
        setTotalPages(recRes.data.totalPages || 1);
        setTotalElements(recRes.data.totalElements || 0);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err) {
      toast.error('Failed to load consumption records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadData(1, pageSize);
  }, [selectedUser, selectedStatus, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadData(1, newSize);
  };

  const setQuickDate = (preset: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL') => {
    const today = new Date();
    if (preset === 'TODAY') {
      const d = format(today, 'yyyy-MM-dd');
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'YESTERDAY') {
      const d = format(subDays(today, 1), 'yyyy-MM-dd');
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'WEEK') {
      setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else if (preset === 'MONTH') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedUser('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    toast.info('Filters reset to default view');
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.userName?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q) ||
      r.menuSnapshot?.toLowerCase().includes(q)
    );
  });

  const totalAmount = filteredRecords.reduce((sum, r) => sum + Number(r.chargedAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            <span>Daily Tiffin Consumption Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable records of approved meals with frozen pricing and menu snapshots.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
            <span className="text-slate-500">Page Total: </span>
            <span className="font-black text-emerald-600">Rs. {totalAmount.toFixed(2)}</span>
          </div>

          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Record</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, food..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Customers</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Settlement Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="">All Records</option>
              <option value="UNPAID">UNPAID (Pending Settlement)</option>
              <option value="BILLED_PAID">BILLED_PAID (Invoiced & Settled)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Quick Date:</span>
          {(['ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setQuickDate(preset)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium text-[11px] transition"
            >
              {preset === 'ALL' ? 'All Dates' : preset === 'TODAY' ? 'Today' : preset === 'YESTERDAY' ? 'Yesterday' : preset === 'WEEK' ? 'Last 7 Days' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Menu Items Snapshot</th>
                <th className="py-3 px-4">Charged Price</th>
                <th className="py-3 px-4">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Loader text="Loading consumption log..." />
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.serviceDate}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{rec.userName}</div>
                      <div className="text-[10px] text-slate-500">{rec.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.tiffinType === 'FULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
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
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No consumption records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}