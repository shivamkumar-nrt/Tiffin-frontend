'use client';

import React from 'react';
import { Invoice } from '@/types';
import { invoiceService } from '@/services/api';
import { X, Download, Printer, CheckCircle, FileText, Calendar, User, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(invoiceService.getPdfUrl(invoice.id), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        {/* Modal Top Actions */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-2 text-slate-800 font-bold">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>Invoice Details: {invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-orange-600 tracking-tight">TIFFIN SERVICE</h1>
              <p className="text-xs text-slate-500 mt-1">Fresh & Nutritious Daily Meal Delivery</p>
              <p className="text-xs text-slate-400">Admin Email: shivamstm01@gmail.com | Mobile: +91 9876543210</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-1">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> PAID
              </span>
              <div className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</div>
              <div className="text-xs text-slate-500">
                Date: {format(new Date(invoice.generatedAt), 'dd MMM yyyy, hh:mm a')}
              </div>
            </div>
          </div>

          {/* Billed To & Summary */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</div>
              <div className="font-bold text-slate-900 text-sm">{invoice.userName}</div>
              <div className="text-xs text-slate-600">{invoice.userEmail}</div>
              {invoice.userPhone && <div className="text-xs text-slate-500">Mobile: {invoice.userPhone}</div>}
              {invoice.userDepartment && <div className="text-xs text-slate-500">Dept: {invoice.userDepartment}</div>}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Details</div>
              <div className="text-xs text-slate-700">
                <span className="font-semibold">Period:</span> {invoice.billingStartDate} to {invoice.billingEndDate}
              </div>
              {invoice.paymentNumber && (
                <div className="text-xs text-slate-700">
                  <span className="font-semibold">Payment Ref:</span> {invoice.paymentNumber}
                </div>
              )}
              {invoice.notes && (
                <div className="text-xs text-slate-500 mt-1 italic">
                  Note: {invoice.notes}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Service Date</th>
                  <th className="py-2.5 px-3">Tiffin Type</th>
                  <th className="py-2.5 px-3">Menu / Items Description</th>
                  <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{item.serviceDate}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.tiffinType === 'FULL' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.tiffinType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{item.menuSummary || 'Standard Daily Thali'}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800">
                        Rs. {Number(item.chargedAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400">No line items attached</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal / Billed Amount:</span>
                <span className="font-semibold">Rs. {Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold text-sm bg-emerald-50 p-2 rounded-lg">
                <span>Total Amount Paid:</span>
                <span>Rs. {Number(invoice.paymentAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
            This is a computer-generated tax invoice and requires no physical signature. Generated by {invoice.generatedBy || 'Administrator'}.
          </div>
        </div>
      </div>
    </div>
  );
};