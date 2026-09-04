'use client';

import React, { useState, useEffect } from 'react';
import { paymentService, userService } from '@/services/api';
import { Payment, User, PaymentStatus, PaymentMethod } from '@/types';
import { CreditCard, Plus, CheckCircle, Clock, AlertCircle, FileText, Check } from 'lucide-react';
import { InvoiceModal } from '@/components/InvoiceModal';
import { invoiceService } from '@/services/api';
import { Invoice } from '@/types';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Selected Invoice for preview
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Payment Form State
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [markAsSuccess, setMarkAsSuccess] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, empRes] = await Promise.all([
        paymentService.getPayments({ size: 50 }),
        userService.getAllEmployees(),
      ]);

      if (payRes.success && payRes.data) {
        setPayments(payRes.data.content);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err) {
      console.error('Failed to load payments data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectUserForPayment = (user: User) => {
    setSelectedUserId(String(user.id));
    setAmount(String(user.outstandingBalance || 0));
    setShowModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || Number(amount) <= 0) {
      alert('Please select an employee and enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await paymentService.recordPayment({
        userId: Number(selectedUserId),
        amount: Number(amount),
        paymentMethod,
        transactionRef,
        notes,
        markAsSuccess,
      });

      if (res.success) {
        setMessage('Payment recorded successfully! Eligible unpaid meal records settled & tax invoice generated.');
        setShowModal(false);
        setAmount('');
        setTransactionRef('');
        setNotes('');
        await loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async (paymentId: number) => {
    try {
      const res = await paymentService.markPaymentSuccess(paymentId);
      if (res.success) {
        setMessage('Payment verified! Invoice created.');
        await loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleViewInvoice = async (invoiceId: number) => {
    try {
      const res = await invoiceService.getInvoiceById(invoiceId);
      if (res.success && res.data) {
        setSelectedInvoice(res.data);
      }
    } catch (err) {
      alert('Failed to load invoice');
    }
  };

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
            Record employee payments, verify bank/UPI references, and settle outstanding balances.
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

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 font-bold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Employee Balances Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Employee Outstanding Running Balances
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click &apos;Settle / Pay&apos; to record settlement for any employee.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Outstanding Dues</span>
            <span className="text-lg font-black text-red-600">Rs. {totalOutstanding.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between hover:bg-slate-50/90 transition"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-xs text-slate-800">{emp.fullName}</div>
                    <div className="text-[10px] text-slate-500">{emp.email}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    emp.outstandingBalance > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {emp.outstandingBalance > 0 ? 'DUE' : 'CLEAR'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Balance Due</div>
                  <div className="text-base font-black text-slate-800">
                    Rs. {Number(emp.outstandingBalance || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60">
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

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Payment & Settlement Transactions Log
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payment #</th>
                <th className="py-3 px-4">Employee</th>
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
                  <td colSpan={7} className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
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
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold"
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
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No payment records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Record Employee Payment</h2>
            
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Employee</label>
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
                  <option value="">-- Choose Employee --</option>
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
                  Mark as Verified & Generate Invoice Immediately
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
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