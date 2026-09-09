'use client';

import React, { useState, useEffect } from 'react';
import { paymentService, userService, invoiceService } from '@/services/api';
import { Payment, User, PaymentMethod, Invoice, ReminderStatus } from '@/types';
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
  X,
  Bell,
  Send,
  XCircle,
  Hash,
  Calendar,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { InvoiceModal } from '@/components/InvoiceModal';
import { Pagination } from '@/components/Pagination';
import { Loader } from '@/components/Loader';
import { useToast } from '@/context/ToastContext';
import { openWhatsApp, whatsappTemplates } from '@/utils/whatsapp';
import { showLocalPushNotification } from '@/utils/pushNotification';

export default function AdminPaymentsPage() {
  const { showSuccess, showError, showWarning } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Rejection Modal State
  const [rejectingPayment, setRejectingPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Selected Invoice for preview
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Reminder status
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null);

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
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentApp, setPaymentApp] = useState<string>('Google Pay');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [markAsSuccess, setMarkAsSuccess] = useState<boolean>(true);

  const loadData = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const [payRes, empRes, reminderRes] = await Promise.all([
        paymentService.getPayments({
          userId: selectedUser ? Number(selectedUser) : undefined,
          status: selectedStatus || undefined,
          page: page - 1,
          size: size,
        }),
        userService.getAllEmployees(),
        paymentService.getReminderStatus().catch(() => null),
      ]);

      if (payRes.success && payRes.data) {
        setPayments(payRes.data.content);
        setTotalPages(payRes.data.totalPages || 1);
        setTotalElements(payRes.data.totalElements || 0);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
      if (reminderRes && reminderRes.success && reminderRes.data) {
        setReminderStatus(reminderRes.data);
      }
    } catch (err: any) {
      showError('Failed to load payments data');
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
      showWarning('Please select a customer and enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      const res = await paymentService.recordPayment({
        userId: Number(selectedUserId),
        amount: Number(amount),
        paymentMethod,
        paymentApp,
        paymentDate,
        transactionRef,
        notes,
        markAsSuccess,
      });

      if (res.success) {
        showSuccess('Payment recorded successfully! Meal records settled and tax invoice generated.');
        setShowModal(false);
        setAmount('');
        setTransactionRef('');
        setNotes('');
        await loadData(currentPage, pageSize);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async (paymentId: number) => {
    try {
      const res = await paymentService.markPaymentSuccess(paymentId);
      if (res.success) {
        showSuccess('Payment approved & verified! Tax invoice generated and meal records marked paid.');
        await loadData(currentPage, pageSize);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleRejectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;

    try {
      setRejectSubmitting(true);
      const res = await paymentService.rejectPayment(rejectingPayment.id, rejectionReason);
      if (res.success) {
        showSuccess(`Payment #${rejectingPayment.paymentNumber} rejected.`);
        setRejectingPayment(null);
        setRejectionReason('');
        await loadData(currentPage, pageSize);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleSendBulkReminders = async () => {
    try {
      setSendingReminders(true);
      const res = await paymentService.sendBulkReminders();
      if (res.success) {
        showSuccess(res.message || 'Payment reminders dispatched successfully to all customers with pending dues!');
        await loadData(currentPage, pageSize);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleViewInvoice = async (invoiceId: number) => {
    try {
      const res = await invoiceService.getInvoiceById(invoiceId);
      if (res.success && res.data) {
        setSelectedInvoice(res.data);
      }
    } catch (err) {
      showError('Failed to load invoice details');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionRef?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentApp?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = !selectedMethod || p.paymentMethod === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const totalOutstanding = employees.reduce((sum, e) => sum + Number(e.outstandingBalance || 0), 0);
  const pendingApprovalCount = payments.filter((p) => p.status === 'PENDING_VERIFICATION').length;

  const dayOfMonth = new Date().getDate();
  const isReminderWindow = reminderStatus?.active || (dayOfMonth >= 25 && dayOfMonth <= 31);

  return (
    <div className="space-y-6">
      {/* Monthly Settlement Reminder Widget (25th - 30th) */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl shrink-0">
            <Bell className="w-6 h-6 text-emerald-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isReminderWindow ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500/30 text-emerald-200'
              }`}>
                {isReminderWindow ? '⚡ 25th-30th Reminder Active' : 'Monthly Reminder Schedule'}
              </span>
              <span className="text-xs text-emerald-200">
                {reminderStatus?.daysLeftInMonth ? `${reminderStatus.daysLeftInMonth} days remaining in month` : 'Auto-triggers on 25th-31st'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-1">
              Total Outstanding Balance: Rs. {totalOutstanding.toFixed(2)} ({employees.filter(e => e.outstandingBalance > 0).length} customers due)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Automatic cron scheduler triggers payment reminders daily at 9:00 AM between the 25th and 30th of every month.
            </p>
          </div>
        </div>

        <button
          onClick={handleSendBulkReminders}
          disabled={sendingReminders}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition shrink-0 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Send className={`w-4 h-4 ${sendingReminders ? 'animate-spin' : ''}`} />
          <span>{sendingReminders ? 'Sending...' : 'Send Reminders Now'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Balances, Customer Payments & Settlement</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review customer self-service UTR submissions, approve settlements, and record admin payments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadData(currentPage, pageSize)}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              setSelectedUserId('');
              setAmount('');
              setShowModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Manual Payment</span>
          </button>
        </div>
      </div>

      {/* Customer Balances Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Customer Running Balances ({employees.length})
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

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
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
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
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
              placeholder="Search user, ref #, app..."
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
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Method</label>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
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
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_VERIFICATION">⏳ PENDING VERIFICATION (Awaiting Approval)</option>
            <option value="SUCCESS">✓ SUCCESS (Approved & Settled)</option>
            <option value="FAILED">✕ FAILED / REJECTED</option>
          </select>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Payment & Settlement Transactions Log
          </h2>
          {pendingApprovalCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {pendingApprovalCount} Awaiting Admin Approval
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payment #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">App & UTR Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Approval / Actions</th>
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
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{p.paymentNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {p.paymentDate || (p.createdAt ? p.createdAt.split('T')[0] : '')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.userName}</div>
                      <div className="text-[10px] text-slate-500">{p.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700">
                      Rs. {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{p.paymentApp || p.paymentMethod}</div>
                      {p.transactionRef && (
                        <div className="text-[10px] font-mono text-slate-600 flex items-center space-x-1">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span>{p.transactionRef}</span>
                        </div>
                      )}
                      {p.notes && <div className="text-[10px] text-slate-400 italic">&ldquo;{p.notes}&rdquo;</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status === 'PENDING_VERIFICATION' ? 'Awaiting Approval' : p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const matchedEmp = employees.find(e => e.id === p.userId || e.email === p.userEmail);
                        const empPhone = matchedEmp?.phone;

                        if (p.status === 'PENDING_VERIFICATION') {
                          return (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleVerifyPayment(p.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center space-x-1"
                                title="Approve and settle customer dues"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingPayment(p);
                                  setRejectionReason('');
                                }}
                                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                                title="Reject payment"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                              {empPhone && (
                                <button
                                  onClick={() => openWhatsApp(empPhone, whatsappTemplates.paymentReminder(p.userName || 'Customer', p.amount))}
                                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition"
                                  title="Chat / Send Reminder on WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        }

                        if (p.status === 'SUCCESS') {
                          return (
                            <div className="flex items-center space-x-2">
                              <div className="text-slate-500 text-[11px]">
                                <span className="font-semibold text-emerald-700">✓ Approved</span>
                                {p.verifiedBy && <div className="text-[10px] text-slate-400">by {p.verifiedBy}</div>}
                              </div>
                              {empPhone && (
                                <button
                                  onClick={() => openWhatsApp(empPhone, whatsappTemplates.paymentVerified(p.userName || 'Customer', p.amount, p.transactionRef))}
                                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition"
                                  title="Send Approval Receipt on WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="text-red-600 text-[11px]">
                            <span className="font-bold">✕ Rejected</span>
                            {p.rejectionReason && <div className="text-[10px] text-slate-500">{p.rejectionReason}</div>}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.invoiceId ? (
                        <button
                          onClick={() => handleViewInvoice(p.invoiceId!)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
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

      {/* Rejection Modal */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-red-600 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Reject Payment Settlement</span>
              </h2>
              <button onClick={() => setRejectingPayment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are rejecting payment <strong>#{rejectingPayment.paymentNumber}</strong> of <strong>Rs. {Number(rejectingPayment.amount).toFixed(2)}</strong> from <strong>{rejectingPayment.userName}</strong>.
            </p>

            <form onSubmit={handleRejectPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Rejection Reason / Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR not matched in bank statement / Incorrect payment amount"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {rejectSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} (Due: Rs. {Number(emp.outstandingBalance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CREDIT_CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment App</label>
                  <input
                    type="text"
                    value={paymentApp}
                    onChange={(e) => setPaymentApp(e.target.value)}
                    placeholder="e.g. GPay, PhonePe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Ref / UTR #</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. 423589123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared monthly dues"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="markSuccess"
                  checked={markAsSuccess}
                  onChange={(e) => setMarkAsSuccess(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="markSuccess" className="text-xs font-semibold text-slate-700">
                  Mark as Verified & Settle Invoices Immediately
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
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