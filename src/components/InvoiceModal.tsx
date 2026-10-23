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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Modal Top Actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-stone-50 border-b border-stone-200 flex flex-wrap justify-between items-center gap-2 print:hidden flex-shrink-0">
          <div className="flex items-center space-x-2 text-stone-800 font-bold text-xs sm:text-sm truncate">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 flex-shrink-0" />
            <span className="truncate">Invoice: {invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-gold-500 hover:bg-gold-400 text-gold-900 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="hidden xs:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-4 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-stone-200 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gold-600 tracking-tight">TIFFIN SERVICE</h1>
              <p className="text-xs text-stone-500 mt-0.5">Fresh & Nutritious Daily Meal Delivery</p>
              <p className="text-[11px] text-stone-400">Admin Email: shivamstm01@gmail.com | Mobile: +91 9876543210</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gold-100 text-gold-800 mb-1">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> PAID
              </span>
              <div className="text-xs sm:text-sm font-bold text-stone-900">{invoice.invoiceNumber}</div>
              <div className="text-[11px] text-stone-500">
                Date: {format(new Date(invoice.generatedAt), 'dd MMM yyyy, hh:mm a')}
              </div>
            </div>
          </div>

          {/* Billed To & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-stone-50 p-4 rounded-xl border border-stone-100">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Billed To</div>
              <div className="font-bold text-stone-900 text-sm">{invoice.userName}</div>
              <div className="text-xs text-stone-600">{invoice.userEmail}</div>
              {invoice.userPhone && <div className="text-xs text-stone-500">Mobile: {invoice.userPhone}</div>}
              {invoice.userDepartment && <div className="text-xs text-stone-500">Dept: {invoice.userDepartment}</div>}
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Billing Details</div>
              <div className="text-xs text-stone-700">
                <span className="font-semibold">Period:</span> {invoice.billingStartDate} to {invoice.billingEndDate}
              </div>
              {invoice.paymentNumber && (
                <div className="text-xs text-stone-700">
                  <span className="font-semibold">Payment Ref:</span> {invoice.paymentNumber}
                </div>
              )}
              {invoice.notes && (
                <div className="text-xs text-stone-500 mt-1 italic">
                  Note: {invoice.notes}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Service Date</th>
                  <th className="py-2.5 px-3">Tiffin Type</th>
                  <th className="py-2.5 px-3">Menu / Items Description</th>
                  <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-stone-50/50">
                      <td className="py-2 px-3 text-stone-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-stone-800">{item.serviceDate}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.tiffinType === 'FULL' ? 'bg-gold-100 text-gold-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.tiffinType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-stone-600">{item.menuSummary || 'Standard Daily Thali'}</td>
                      <td className="py-2 px-3 text-right font-semibold text-stone-800">
                        Rs. {Number(item.chargedAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-stone-400">No line items attached</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-4 border-t border-stone-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal / Billed Amount:</span>
                <span className="font-semibold">Rs. {Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gold-700 font-bold text-sm bg-gold-50 p-2 rounded-lg">
                <span>Total Amount Paid:</span>
                <span>Rs. {Number(invoice.paymentAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-stone-400 pt-4 border-t border-stone-100">
            This is a computer-generated tax invoice and requires no physical signature. Generated by {invoice.generatedBy || 'Administrator'}.
          </div>
        </div>
      </div>
    </div>
  );
};