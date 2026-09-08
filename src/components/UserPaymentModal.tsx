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
  FileText,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/context/ToastContext';

interface UserPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  outstandingBalance: number;
  onSuccess: () => void;
}

interface UpiAccount {
  id: string;
  name: string;
  bank: string;
  upiId: string;
  logoColor: string;
  badge: string;
}

const UPI_ACCOUNTS: UpiAccount[] = [
  {
    id: 'kotak',
    name: 'Kotak UPI',
    bank: 'Kotak Mahindra Bank',
    upiId: 'shivamstm01@kotak',
    logoColor: 'from-red-600 to-rose-700',
    badge: 'Recommended',
  },
  {
    id: 'phonepe',
    name: 'PhonePe UPI',
    bank: 'PhonePe / YBL',
    upiId: 'shivamstm01@ybl',
    logoColor: 'from-purple-600 to-indigo-700',
    badge: 'Popular',
  },
  {
    id: 'amazon',
    name: 'Amazon Pay UPI',
    bank: 'Amazon Pay / APL',
    upiId: '6201763368@apl',
    logoColor: 'from-amber-500 to-orange-600',
    badge: 'Instant',
  },
  {
    id: 'cred',
    name: 'CRED UPI',
    bank: 'CRED / YES Bank',
    upiId: '6201763368@yescred',
    logoColor: 'from-slate-800 to-slate-950',
    badge: 'Fast',
  },
];

const SENDER_APPS = [
  'Google Pay',
  'PhonePe',
  'Paytm',
  'Amazon Pay',
  'CRED',
  'Kotak Mobile',
  'BHIM UPI',
  'Net Banking',
  'Cash',
  'Other UPI',
];

export default function UserPaymentModal({
  isOpen,
  onClose,
  outstandingBalance,
  onSuccess,
}: UserPaymentModalProps) {
  const { showSuccess, showError, showWarning } = useToast();

  const [selectedUpi, setSelectedUpi] = useState<UpiAccount>(UPI_ACCOUNTS[0]);
  const [amount, setAmount] = useState<string>(
    outstandingBalance > 0 ? String(outstandingBalance) : ''
  );
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [senderApp, setSenderApp] = useState<string>('PhonePe');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  if (!isOpen) return null;

  const payeeName = 'Shivam Kumar';

  // Construct UPI payment URI
  const upiAmountStr = amount && !isNaN(Number(amount)) && Number(amount) > 0 ? Number(amount).toFixed(2) : '';
  const upiPayUri = `upi://pay?pa=${selectedUpi.upiId}&pn=${encodeURIComponent(payeeName)}${
    upiAmountStr ? `&am=${upiAmountStr}` : ''
  }&cu=INR&tn=${encodeURIComponent('Tiffin Meal Settlement')}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(selectedUpi.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showWarning('Please enter a valid payment amount');
      return;
    }

    if (!transactionRef.trim()) {
      showWarning('Please enter the 12-digit UTR Number / Transaction ID');
      return;
    }

    const method: PaymentMethod = senderApp === 'Cash' ? 'CASH' : senderApp === 'Net Banking' ? 'BANK_TRANSFER' : 'UPI';
    const paymentAppCombined = `${senderApp} (to: ${selectedUpi.upiId})`;

    try {
      setSubmitting(true);
      const res = await paymentService.submitPayment({
        amount: numAmount,
        paymentMethod: method,
        paymentApp: paymentAppCombined,
        transactionRef: transactionRef.trim(),
        paymentDate,
        notes: notes.trim(),
      });

      if (res.success) {
        showSuccess(
          'Payment submitted successfully! Admin will verify the UTR and approve your settlement.'
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Scan & Settle Tiffin Payment</h2>
              <p className="text-[11px] text-slate-500">
                Payee: <strong className="text-slate-800">{payeeName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Select Receiver UPI Option */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
            1. Select UPI Option to Pay
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {UPI_ACCOUNTS.map((acc) => {
              const isSelected = selectedUpi.id === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedUpi(acc)}
                  className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white bg-gradient-to-r ${acc.logoColor}`}
                    >
                      {acc.name.split(' ')[0]}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs">{acc.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{acc.upiId}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic QR Code & UPI Card */}
        <div className="bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/50 border border-emerald-200/90 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Live QR Code generated client-side */}
            <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-sm flex flex-col items-center shrink-0">
              <div className="bg-white p-1 rounded-xl">
                <QRCodeSVG
                  value={upiPayUri}
                  size={130}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <span className="text-[9px] font-bold text-emerald-800 mt-1.5 uppercase tracking-wider">
                Scan with any UPI App
              </span>
            </div>

            {/* UPI Details & 1-Click Actions */}
            <div className="flex-1 text-center sm:text-left space-y-2 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {selectedUpi.name}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Verified Receiver
                </span>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">UPI ID:</div>
                <div className="flex items-center justify-center sm:justify-start space-x-2 mt-0.5">
                  <span className="font-mono font-black text-slate-900 text-sm sm:text-base bg-white px-3 py-1 rounded-xl border border-emerald-300 shadow-sm">
                    {selectedUpi.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1"
                    title="Copy UPI ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 flex flex-col gap-0.5">
                <div>Payee Name: <strong className="text-slate-900">{payeeName}</strong></div>
                {amount && Number(amount) > 0 && (
                  <div>Prefilled Amount: <strong className="text-emerald-700">Rs. {Number(amount).toFixed(2)}</strong></div>
                )}
              </div>

              {/* Deep link for mobile users */}
              <div className="pt-1 block sm:hidden">
                <a
                  href={upiPayUri}
                  className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open in UPI App to Pay</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Form for Submitting UTR and Payment Proof */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700 uppercase">
              2. Submit Payment Details for Admin Approval
            </span>
          </div>

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
                  <span className="text-slate-500">Current Balance:</span>
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

          {/* Sender Application */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Which App did you pay from? <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SENDER_APPS.map((app) => {
                const isSelected = senderApp === app;
                return (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setSenderApp(app)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{app}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white shrink-0" />}
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
                placeholder="e.g. 423589123456 (Found in UPI App payment receipt)"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Please enter the exact 12-digit UTR or Transaction ID from your payment confirmation screen.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Remarks / Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Settle meal dues for this month"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Admin Verification Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-[11px] text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Verification:</strong> Admin will verify receipt on <strong>{selectedUpi.name} ({selectedUpi.upiId})</strong> with your UTR. Upon approval, your balance is settled and official tax invoice is generated.
            </div>
          </div>

          {/* Actions */}
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
