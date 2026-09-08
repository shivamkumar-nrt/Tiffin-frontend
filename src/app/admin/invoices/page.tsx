'use client';

import React, { useState, useEffect } from 'react';
import { invoiceService, userService } from '@/services/api';
import { Invoice, User } from '@/types';
import { FileText, Download, Eye, Calendar, Search, RotateCcw } from 'lucide-react';
import { InvoiceModal } from '@/components/InvoiceModal';
import { Pagination } from '@/components/Pagination';
import { Loader } from '@/components/Loader';
import { useToast } from '@/context/ToastContext';
import { format, subDays, startOfMonth } from 'date-fns';

export default function AdminInvoicesPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
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
      const [invRes, empRes] = await Promise.all([
        invoiceService.getInvoices({
          userId: selectedUser ? Number(selectedUser) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: page - 1,
          size: size,
        }),
        userService.getAllEmployees(),
      ]);

      if (invRes.success && invRes.data) {
        setInvoices(invRes.data.content);
        setTotalPages(invRes.data.totalPages || 1);
        setTotalElements(invRes.data.totalElements || 0);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err) {
      toast.error('Failed to load invoices from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadData(1, pageSize);
  }, [selectedUser, startDate, endDate]);

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
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    toast.info('Filters reset to default');
  };

  const handleDownloadPdf = (id: number) => {
    toast.info('Opening PDF invoice document...');
    window.open(invoiceService.getPdfUrl(id), '_blank');
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.userName?.toLowerCase().includes(q) ||
      inv.userEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>Invoices Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View generated tax invoices, line-item food breakdowns, and download server-side PDFs.
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Invoice</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Invoice #, customer..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Billing From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Billing To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
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
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 font-medium text-[11px] transition"
            >
              {preset === 'ALL' ? 'All Dates' : preset === 'TODAY' ? 'Today' : preset === 'YESTERDAY' ? 'Yesterday' : preset === 'WEEK' ? 'Last 7 Days' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4">Line Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <Loader text="Loading tax invoices..." />
                  </td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{inv.userName}</div>
                      <div className="text-[10px] text-slate-500">{inv.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.billingStartDate} to {inv.billingEndDate}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {inv.items?.length || 0} meals included
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      Rs. {Number(inv.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        PAID
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(inv.id)}
                          className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No invoices recorded matching filters.
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

      {/* Invoice Modal */}
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}