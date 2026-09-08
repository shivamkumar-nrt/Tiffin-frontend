'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { invoiceService, paymentService } from '@/services/api';
import { Invoice, Payment } from '@/types';
import { FileText, Download, Eye, CreditCard, CheckCircle2, Search, RefreshCw } from 'lucide-react';
import { InvoiceModal } from '@/components/InvoiceModal';
import { format } from 'date-fns';
import Loader from '@/components/Loader';
import Pagination from '@/components/Pagination';
import { useToast } from '@/context/ToastContext';

export default function UserInvoicesPage() {
  const { showError } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadData = async () => {
    try {
      setLoading(true);
      const invRes = await invoiceService.getMyInvoices();
      if (invRes.success && invRes.data) {
        setInvoices(invRes.data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPdf = (id: number) => {
    window.open(invoiceService.getPdfUrl(id), '_blank');
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
        (inv.billingStartDate && inv.billingStartDate.includes(search)) ||
        (inv.billingEndDate && inv.billingEndDate.includes(search));

      let matchesDate = true;
      if (startDate && inv.billingStartDate < startDate) matchesDate = false;
      if (endDate && inv.billingEndDate > endDate) matchesDate = false;

      return matchesSearch && matchesDate;
    });
  }, [invoices, search, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate, limit]);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredInvoices.slice(start, start + limit);
  }, [filteredInvoices, page, limit]);

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paymentAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>My Invoices & Payment Receipts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View tax invoices with date-wise meals included and download official PDF copies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
          </button>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
            <span className="text-slate-500">Invoiced Amount: </span>
            <span className="font-bold text-emerald-600">Rs. {totalInvoiced.toFixed(2)}</span>
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
              placeholder="Search invoice number..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="From Date"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="To Date"
            />
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Tax Invoices ({filteredInvoices.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-16">
            <Loader text="Loading your tax invoices..." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Billing Period</th>
                    <th className="py-3 px-4">Items Included</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Generated Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedInvoices.length > 0 ? (
                    paginatedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {inv.billingStartDate} to {inv.billingEndDate}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {inv.items?.length || 0} meals
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-700">
                          Rs. {Number(inv.paymentAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {inv.generatedAt ? format(new Date(inv.generatedAt), 'dd MMM yyyy') : '-'}
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
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        No invoices found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredInvoices.length > 0 && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  totalItems={filteredInvoices.length}
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

      {/* Invoice Modal */}
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}