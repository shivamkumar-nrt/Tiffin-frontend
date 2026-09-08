'use client';

import React, { useState, useEffect } from 'react';
import { paymentService, userService, invoiceService } from '@/services/api';
import { Payment, User, PaymentMethod, Invoice } from '@/types';
import {
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Check,
  Search,
  RotateCcw,
  X
} from 'lucide-react';
import { InvoiceModal } from '@/components/InvoiceModal';
import { Pagination } from '@/components/Pagination';
import { Loader } from '@/components/Loader';
import { useToast } from '@/context/ToastContext';

export default function AdminPaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selected Invoice for preview
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Payment Form State
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [markAsSuccess, setMarkAsSuccess] = useState<boolean>(true);

  const loadData = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const [payRes, empRes] = await Promise.all([
        paymentService.getPayments({
          userId: selectedUser ? Number(selectedUser) : undefined,
          status: selectedStatus || undefined,
          page: page - 1,
          size: size,
        }),
        userService.getAllEmployees(),
      ]);

      if (payRes.success && payRes.data) {
        setPayments(payRes.data.content);
        setTotalPages(payRes.data.totalPages || 1);
        setTotalElements(payRes.data.totalElements || 0);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err) {
      toast.error('Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadData(1, pageSize);
  }, [selectedUser, selectedStatus]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadData(1, newSize);
  };

  const handleSelectUserForPayment = (user: User) => {
    setSelectedUserId(String(user.id));
    setAmount(String(user.outstandingBalance || 0));
    setShowModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || Number(amount) <= 0) {
      toast.warning('Please select a customer and enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      const res = await paymentService.recordPayment({
        userId: Number(selectedUserId),
        amount: Number(amount),
        paymentMethod,
        transactionRef,
        notes,
        markAsSuccess,
      });

      if (res.success) {
        toast.success('Payment recorded successfully! Eligible meal records settled and tax invoice generated.');
        setShowModal(false);
        setAmount('');
        setTransactionRef('');
        setNotes('');
        await loadData(currentPage, pageSize);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async (paymentId: number) => {
    try {
      const res = await paymentService.markPaymentSuccess(paymentId);
      if (res.success) {
        toast.success('Payment verified and tax invoice generated!');
        await loadData(currentPage, pageSize);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleViewInvoice = async (invoiceId: number) => {
    try {
      const res = await invoiceService.getInvoiceById(invoiceId);
      if (res.success && res.data) {
        setSelectedInvoice(res.data);
      }
    } catch (err) {
      toast.error('Failed to load invoice details');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionRef?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = !selectedMethod || p.paymentMethod === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const totalOutstanding = employees.reduce((sum, e) => sum + Number(e.outstandingBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            <span>Balances, Payments & Settlement</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record customer payments, verify transactions, and settle meal balances.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedUserId('');
            setAmount('');
            setShowModal(true);
          }}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Customer Balances Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Customer Running Balances
            </h2>
            <p className="text-xs text-slate-500">
              Click &apos;Settle / Pay&apos; to log a payment and generate an official invoice.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Outstanding Dues</span>
            <span className="text-lg font-black text-red-600">Rs. {totalOutstanding.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between hover:bg-slate-50/90 transition"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-xs text-slate-800">{emp.fullName}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{emp.email}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    emp.outstandingBalance > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {emp.outstandingBalance > 0 ? 'DUE' : 'CLEAR'}
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Balance Due</div>
                  <div className="text-base font-black text-slate-800">
                    Rs. {Number(emp.outstandingBalance || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => handleSelectUserForPayment(emp)}
                  className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Settle / Pay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar for Payments Table */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Payment</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, ref #..."
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
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Method</label>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
          >
            <option value="">All Methods</option>
            <option value="UPI">UPI / GPay / PhonePe</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CREDIT_CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS (Verified)</option>
            <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Payment & Settlement Transactions Log
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payment #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verified By</th>
                <th className="py-3 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <Loader text="Loading payment transactions..." />
                  </td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.userName}</div>
                      <div className="text-[10px] text-slate-500">{p.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700">
                      Rs. {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{p.paymentMethod}</div>
                      {p.transactionRef && (
                        <div className="text-[10px] text-slate-400">Ref: {p.transactionRef}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.verifiedBy ? (
                        <div>
                          <div>{p.verifiedBy}</div>
                          {p.verifiedAt && <div className="text-[10px] text-slate-400">{p.verifiedAt}</div>}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVerifyPayment(p.id)}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition"
                        >
                          Verify Now
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.invoiceId ? (
                        <button
                          onClick={() => handleViewInvoice(p.invoiceId!)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No payment records logged yet matching filters.
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

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Record Customer Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Customer</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    const found = employees.find((x) => String(x.id) === e.target.value);
                    if (found) setAmount(String(found.outstandingBalance || 0));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} (Due: Rs. {Number(emp.outstandingBalance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CREDIT_CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Ref #</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI/12345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared monthly dues"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="markSuccess"
                  checked={markAsSuccess}
                  onChange={(e) => setMarkAsSuccess(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="markSuccess" className="text-xs font-semibold text-slate-700">
                  Mark as Verified & Generate Tax Invoice Immediately
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}