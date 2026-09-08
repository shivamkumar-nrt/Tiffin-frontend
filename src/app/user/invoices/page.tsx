'use client';

import React, { useState, useEffect } from 'react';
import { invoiceService, paymentService } from '@/services/api';
import { Invoice, Payment } from '@/types';
import { FileText, Download, Eye, CreditCard, CheckCircle2 } from 'lucide-react';
import { InvoiceModal } from '@/components/InvoiceModal';
import { format } from 'date-fns';

export default function UserInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes] = await Promise.all([
        invoiceService.getMyInvoices(),
        paymentService.getMyPayments(),
      ]);

      if (invRes.success && invRes.data) {
        setInvoices(invRes.data);
      }
      if (payRes.success && payRes.data) {
        setPayments(payRes.data);
      }
    } catch (err) {
      console.error('Failed to load invoices/payments', err);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-orange-600" />
          <span>My Invoices & Payment Receipts</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View tax invoices with date-wise meals included and download official PDF copies.
        </p>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tax Invoices</h2>
        </div>

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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
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
                      {format(new Date(inv.generatedAt), 'dd MMM yyyy')}
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
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}