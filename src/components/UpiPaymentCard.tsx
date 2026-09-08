'use client';

import React, { useState } from 'react';
import { paymentService } from '@/services/api';
import { PaymentMethod } from '@/types';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Calendar,
  Smartphone,
  Hash,
  FileText,
  ShieldCheck,
  CreditCard,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/context/ToastContext';

interface UpiAccount {
  id: string;
  name: string;
  bank: string;
  upiId: string;
  badge: string;
  color: string;
  textColor: string;
}

const UPI_ACCOUNTS: UpiAccount[] = [
  {
    id: 'kotak',
    name: 'Kotak UPI',
    bank: 'Kotak Mahindra Bank',
    upiId: 'shivamstm01@kotak',
    badge: 'Recommended',
    color: 'bg-red-600',
    textColor: 'text-red-700',
  },
  {
    id: 'phonepe',
    name: 'PhonePe UPI',
    bank: 'PhonePe / YBL',
    upiId: 'shivamstm01@ybl',
    badge: 'Popular',
    color: 'bg-purple-600',
    textColor: 'text-purple-700',
  },
  {
    id: 'amazon',
    name: 'Amazon Pay UPI',
    bank: 'Amazon Pay / APL',
    upiId: '6201763368@apl',
    badge: 'Fast',
    color: 'bg-amber-600',
    textColor: 'text-amber-700',
  },
  {
    id: 'cred',
    name: 'CRED UPI',
    bank: 'CRED / YES Bank',
    upiId: '6201763368@yescred',
    badge: 'Instant',
    color: 'bg-slate-900',
    textColor: 'text-slate-900',
  },
];

const SENDER_APPS = [
  'PhonePe',
  'Google Pay',
  'Paytm',
  'Amazon Pay',
  'CRED',
  'Kotak Mobile',
  'BHIM UPI',
  'Net Banking',
  'Cash',
];

interface UpiPaymentCardProps {
  outstandingBalance: number;
  onPaymentSuccess?: () => void;
  title?: string;
}

export default function UpiPaymentCard({
  outstandingBalance,
  onPaymentSuccess,
  title = 'Scan & Pay via UPI (Payee: Shivam Kumar)',
}: UpiPaymentCardProps) {
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

  const payeeName = 'Shivam Kumar';

  // Construct UPI payment URI
  const upiAmountStr =
    amount && !isNaN(Number(amount)) && Number(amount) > 0 ? Number(amount).toFixed(2) : '';
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

    const method: PaymentMethod =
      senderApp === 'Cash' ? 'CASH' : senderApp === 'Net Banking' ? 'BANK_TRANSFER' : 'UPI';
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
        setTransactionRef('');
        setNotes('');
        if (onPaymentSuccess) onPaymentSuccess();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to submit payment settlement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-500/30 shadow-lg p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">
              Select UPI, scan the QR code to pay, then enter the UTR / Transaction ID below.
            </p>
          </div>
        </div>

        {outstandingBalance > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-left sm:text-right shrink-0">
            <div className="text-[10px] uppercase font-bold text-emerald-800">Outstanding Due</div>
            <div className="text-base font-black text-emerald-950">
              Rs. {Number(outstandingBalance).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* 4 UPI Option Buttons */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Step 1: Choose Receiver UPI Account
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {UPI_ACCOUNTS.map((acc) => {
            const isSelected = selectedUpi.id === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setSelectedUpi(acc)}
                className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white ${acc.color}`}>
                    {acc.name.split(' ')[0]}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="mt-2.5">
                  <div className="font-bold text-xs">{acc.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">{acc.upiId}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Live QR Code (Left) + Submission Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* Left Column: Big QR Code & Copy Info */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-emerald-50/30 border border-emerald-200/80 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3">
          <div className="w-full flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
              {selectedUpi.name}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Payee: Shivam Kumar
            </span>
          </div>

          {/* High-Resolution QR Code */}
          <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-300 shadow-md flex flex-col items-center">
            <QRCodeSVG
              value={upiPayUri}
              size={175}
              level="H"
              includeMargin={false}
            />
            <span className="text-[10px] font-black text-emerald-800 mt-2 uppercase tracking-wider">
              Scan with any UPI Scanner
            </span>
          </div>

          {/* UPI ID display & 1-Click Copy */}
          <div className="w-full space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500">Selected UPI ID:</div>
            <div className="flex items-center justify-center space-x-2">
              <span className="font-mono font-black text-slate-900 text-xs sm:text-sm bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-sm truncate">
                {selectedUpi.upiId}
              </span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1 shrink-0"
                title="Copy UPI ID"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Mobile Deep link */}
          <div className="w-full pt-1 block sm:hidden">
            <a
              href={upiPayUri}
              className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Tap to Open in UPI App</span>
            </a>
          </div>
        </div>

        {/* Right Column: UTR & Payment Proof Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Step 2: Enter Paid Amount & UTR Number
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
                    <span className="text-slate-500">Balance Due:</span>
                    <button
                      type="button"
                      onClick={() => setAmount(String(outstandingBalance))}
                      className="font-bold text-emerald-600 hover:underline"
                    >
                      Fill Full Due (Rs. {Number(outstandingBalance).toFixed(2)})
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

            {/* Which App was used */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Paid From Which App? <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SENDER_APPS.map((app) => {
                  const isSelected = senderApp === app;
                  return (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setSenderApp(app)}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition flex items-center space-x-1 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{app}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UTR Number */}
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
                  placeholder="e.g. 423589123456 (12-digit UTR from payment receipt)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Enter the exact 12-digit UTR from GPay / PhonePe / Paytm / Bank payment receipt.
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
                placeholder="e.g. Settled meal balance for this month"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Verification Note */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-[11px] text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                Admin will verify payment on <strong>{selectedUpi.name} ({selectedUpi.upiId})</strong>. Upon approval, your balance will be settled and GST tax invoice generated.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{submitting ? 'Submitting Payment...' : 'Submit Payment & UTR Proof'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
