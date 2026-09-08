'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { invoiceService, paymentService, userService } from '@/services/api';
import { Invoice, Payment, ReminderStatus } from '@/types';
import {
  FileText,
  Download,
  Eye,
  CreditCard,
  CheckCircle2,
  Search,
  RefreshCw,
  Plus,
  Clock,
  AlertCircle,
  QrCode,
  Bell,
  XCircle,
  Hash
} from 'lucide-react';
import { InvoiceModal } from '@/components/InvoiceModal';
import { format } from 'date-fns';
import Loader from '@/components/Loader';
import Pagination from '@/components/Pagination';
import { useToast } from '@/context/ToastContext';
import UserPaymentModal from '@/components/UserPaymentModal';
import UpiPaymentCard from '@/components/UpiPaymentCard';

export default function UserInvoicesPage() {
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
      const [invRes, payRes, meRes, reminderRes] = await Promise.all([
        invoiceService.getMyInvoices(),
        paymentService.getMyPayments(),
        userService.getAllEmployees().catch(() => null),
        paymentService.getReminderStatus().catch(() => null),
      ]);

      if (invRes.success && invRes.data) {
        setInvoices(invRes.data);
      }
      if (payRes.success && payRes.data) {
        setPayments(payRes.data);
      }
      if (reminderRes && reminderRes.success && reminderRes.data) {
        setReminderStatus(reminderRes.data);
      }

      // Read current balance from local user or API
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('tiffin_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setBalance(parsed.outstandingBalance || 0);
          } catch (e) {}
        }
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load invoices & payments');
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

  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const matchesSearch =
        !search.trim() ||
        (pay.paymentNumber && pay.paymentNumber.toLowerCase().includes(search.toLowerCase())) ||
        (pay.transactionRef && pay.transactionRef.toLowerCase().includes(search.toLowerCase())) ||
        (pay.paymentApp && pay.paymentApp.toLowerCase().includes(search.toLowerCase()));

      let matchesDate = true;
      if (startDate && pay.paymentDate && pay.paymentDate < startDate) matchesDate = false;
      if (endDate && pay.paymentDate && pay.paymentDate > endDate) matchesDate = false;

      return matchesSearch && matchesDate;
    });
  }, [payments, search, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate, limit, activeTab]);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredInvoices.slice(start, start + limit);
  }, [filteredInvoices, page, limit]);

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredPayments.slice(start, start + limit);
  }, [filteredPayments, page, limit]);

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paymentAmount || 0), 0);
  const totalPaid = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const dayOfMonth = new Date().getDate();
  const isReminderPeriod = reminderStatus?.active || (dayOfMonth >= 25 && dayOfMonth <= 31);

  return (
    <div className="space-y-6">
      {/* Monthly Settlement Banner (25th - 30th) */}
      {isReminderPeriod && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-orange-100">
                Monthly Billing Settlement Window (25th - 30th)
              </div>
              <p className="text-xs font-semibold mt-0.5">
                Scan the QR code below or enter UTR Number to settle your balance and generate your GST Tax Invoice.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-700 rounded-xl text-xs font-bold transition shadow-sm shrink-0 flex items-center justify-center space-x-1.5"
          >
            <QrCode className="w-4 h-4 text-orange-600" />
            <span>Open Settlement Modal</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Invoices & Payment Settlements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit payment settlements, track approval status, and view official tax invoices.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Payment / UTR</span>
          </button>
        </div>
      </div>

      {/* Prominent Inline UPI QR Payment Box */}
      <UpiPaymentCard
        outstandingBalance={balance}
        onPaymentSuccess={loadData}
        title="Live UPI QR Code Payment (Payee: Shivam Kumar)"
      />

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'INVOICES'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tax Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'PAYMENTS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Settlements Log ({payments.length})</span>
        </button>
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
              placeholder={activeTab === 'INVOICES' ? 'Search invoice number...' : 'Search payment #, UTR, app...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

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

      {/* Content depending on Active Tab */}
      {activeTab === 'INVOICES' ? (
        /* Invoices List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Tax Invoices ({filteredInvoices.length})
            </h2>
            <div className="text-xs text-slate-500">
              Total Invoiced: <span className="font-bold text-emerald-600">Rs. {totalInvoiced.toFixed(2)}</span>
            </div>
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
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm"
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
      ) : (
        /* Payments List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Payment Settlements ({filteredPayments.length})
            </h2>
            <div className="text-xs text-slate-500">
              Total Verified Paid: <span className="font-bold text-emerald-600">Rs. {totalPaid.toFixed(2)}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16">
              <Loader text="Loading your payments..." />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Payment #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">App & UTR No.</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Admin Status / Remarks</th>
                      <th className="py-3 px-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPayments.length > 0 ? (
                      paginatedPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{p.paymentNumber}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {p.paymentDate ? p.paymentDate : format(new Date(p.createdAt), 'yyyy-MM-dd')}
                          </td>
                          <td className="py-3 px-4 font-black text-emerald-700">
                            Rs. {Number(p.amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">
                              {p.paymentApp || p.paymentMethod}
                            </div>
                            {p.transactionRef && (
                              <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                                <Hash className="w-3 h-3 text-slate-400" />
                                <span>{p.transactionRef}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                              p.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {p.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                              {p.status === 'PENDING_VERIFICATION' && <Clock className="w-3 h-3" />}
                              {p.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                              <span>
                                {p.status === 'SUCCESS' ? 'Verified & Approved' :
                                 p.status === 'PENDING_VERIFICATION' ? 'Verification Pending' : 'Rejected'}
                              </span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {p.status === 'FAILED' && p.rejectionReason ? (
                              <span className="text-red-600 font-medium">Reason: {p.rejectionReason}</span>
                            ) : p.status === 'SUCCESS' && p.verifiedBy ? (
                              <span className="text-slate-500 text-[11px]">Approved by Admin</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Awaiting Admin Approval</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {p.invoiceId ? (
                              <button
                                onClick={async () => {
                                  try {
                                    const inv = await invoiceService.getInvoiceById(p.invoiceId!);
                                    if (inv.success) setSelectedInvoice(inv.data);
                                  } catch (e) {}
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center space-x-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No payment settlements logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredPayments.length > 0 && (
                <div className="p-4 border-t border-slate-100">
                  <Pagination
                    totalItems={filteredPayments.length}
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
      )}

      {/* Invoice Modal */}
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />

      {/* User Payment Settlement Modal */}
      <UserPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        outstandingBalance={balance}
        onSuccess={loadData}
      />
    </div>
  );
}