'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { tiffinRecordService } from '@/services/api';
import { TiffinRecord } from '@/types';
import { CalendarCheck, Utensils, CheckCircle2, AlertCircle, Search, Filter, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Loader from '@/components/Loader';
import Pagination from '@/components/Pagination';
import { useToast } from '@/context/ToastContext';
import { format, parseISO } from 'date-fns';

export default function UserRecordsPage() {
  const { showError } = useToast();
  const [records, setRecords] = useState<TiffinRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortAsc, setSortAsc] = useState(true); // Default to Ascending by Date

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await tiffinRecordService.getMyRecords();
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        const matchesSearch =
          (rec.menuSnapshot && rec.menuSnapshot.toLowerCase().includes(search.toLowerCase())) ||
          (rec.serviceDate && rec.serviceDate.includes(search));

        const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || rec.tiffinType === typeFilter;

        let matchesDate = true;
        if (startDate && rec.serviceDate < startDate) matchesDate = false;
        if (endDate && rec.serviceDate > endDate) matchesDate = false;

        return matchesSearch && matchesStatus && matchesType && matchesDate;
      })
      .sort((a, b) => {
        const dateA = a.serviceDate || '';
        const dateB = b.serviceDate || '';
        return sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      });
  }, [records, search, statusFilter, typeFilter, startDate, endDate, sortAsc]);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, startDate, endDate, sortAsc, limit]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRecords.slice(start, start + limit);
  }, [filteredRecords, page, limit]);

  const totalCharged = filteredRecords.reduce((sum, r) => sum + Number(r.chargedAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            <span>My Tiffin Consumption History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete date-wise log of meals received, food details, and charged rates.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            title="Toggle Date Order"
          >
            {sortAsc ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />}
            <span>Date: {sortAsc ? 'Ascending (1st → 30th)' : 'Descending (Newest First)'}</span>
          </button>
          <button
            onClick={loadRecords}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
            <span className="text-slate-500">Filtered Total: </span>
            <span className="font-bold text-emerald-600">Rs. {totalCharged.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes or date..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="BILLED_PAID">Paid / Invoiced</option>
            <option value="PENDING_BILLING">Unpaid / Pending</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Meal Types</option>
            <option value="FULL">Full Thali</option>
            <option value="HALF">Half Thali</option>
            <option value="CUSTOM">Custom</option>
          </select>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="From Date"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="To Date"
            />
          </div>
        </div>
      </div>

      {/* Consumption Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <Loader text="Loading your consumption history..." />
          </div>
        ) : (
          <>
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
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {rec.serviceDate ? format(parseISO(rec.serviceDate), 'dd MMM yyyy') : ''}
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
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        No consumption records found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredRecords.length > 0 && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  totalItems={filteredRecords.length}
                  page={page}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                  pageSizeOptions={[10, 20, 30, 50]}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}