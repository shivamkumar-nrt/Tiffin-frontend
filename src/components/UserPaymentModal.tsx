'use client';

import React, { useState } from 'react';
import { paymentService } from '@/services/api';
import { PaymentMethod } from '@/types';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Calendar,
  Smartphone,
  Hash,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/context/ToastContext';

interface UserPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  outstandingBalance: number;
  onSuccess: () => void;
}

const PAYMENT_APPS = [
  { id: 'Google Pay', name: 'Google Pay (GPay)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'PhonePe', name: 'PhonePe', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Paytm', name: 'Paytm', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'BHIM UPI', name: 'BHIM UPI', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'Net Banking', name: 'Net Banking / NEFT', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Cash', name: 'Cash', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { id: 'Other', name: 'Other UPI / App', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export default function UserPaymentModal({
  isOpen,
  onClose,
  outstandingBalance,
  onSuccess,
}: UserPaymentModalProps) {
  const { showSuccess, showError, showWarning } = useToast();

  const [amount, setAmount] = useState<string>(
    outstandingBalance > 0 ? String(outstandingBalance) : ''
  );
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentApp, setPaymentApp] = useState<string>('Google Pay');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  if (!isOpen) return null;

  const upiId = 'shivamstm01@okhdfcbank';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleAppSelect = (appId: string) => {
    setPaymentApp(appId);
    if (appId === 'Cash') {
      setPaymentMethod('CASH');
    } else if (appId === 'Net Banking') {
      setPaymentMethod('BANK_TRANSFER');
    } else {
      setPaymentMethod('UPI');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showWarning('Please enter a valid payment amount');
      return;
    }

    if (!transactionRef.trim()) {
      showWarning('Please enter the UTR Number / Transaction Reference ID');
      return;
    }

    try {
      setSubmitting(true);
      const res = await paymentService.submitPayment({
        amount: numAmount,
        paymentMethod,
        paymentApp,
        transactionRef: transactionRef.trim(),
        paymentDate,
        notes: notes.trim(),
      });

      if (res.success) {
        showSuccess(
          'Payment submitted successfully! Admin will verify and approve your settlement.'
        );
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to submit payment settlement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Submit Payment Settlement</h2>
              <p className="text-[11px] text-slate-500">Pay via UPI and enter UTR / Transaction ID</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* UPI Payment Info Card */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-200/80 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-sm flex flex-col items-center">
              <QrCode className="w-16 h-16 text-emerald-800" />
              <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Scan to Pay</span>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Official UPI Payment ID
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                  {upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center space-x-1"
                  title="Copy UPI ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-600">
                Pay using GPay, PhonePe, Paytm or BHIM UPI, then submit transaction details below.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Amount (Rs.) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {outstandingBalance > 0 && (
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Current Balance Due:</span>
                  <button
                    type="button"
                    onClick={() => setAmount(String(outstandingBalance))}
                    className="font-bold text-emerald-600 hover:underline"
                  >
                    Set Full (Rs. {Number(outstandingBalance).toFixed(2)})
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Application / Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Payment Application / Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_APPS.map((app) => {
                const isSelected = paymentApp === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleAppSelect(app.id)}
                    className={`p-2 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{app.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* UTR No / Transaction ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              UTR Number / Transaction ID / Ref # <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 423589123456 or UPI/42358912"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Found in your UPI App payment receipt (12-digit UTR or Transaction ID).
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Remarks / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared dues for this month"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notice info */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-[11px] text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Verification Step:</strong> Once submitted, the Admin will verify receipt with the UTR number. Upon confirmation, your meal records will be settled and a tax invoice generated.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <span>{submitting ? 'Submitting...' : 'Submit Payment Settlement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
