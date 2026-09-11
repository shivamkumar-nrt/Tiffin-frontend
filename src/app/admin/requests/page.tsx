'use client';

import React, { useState, useEffect } from 'react';
import { tiffinRequestService, userService } from '@/services/api';
import { TiffinRequest, User } from '@/types';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Check,
  RotateCcw,
  X,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { Loader } from '@/components/Loader';
import { useToast } from '@/context/ToastContext';
import { openWhatsApp, whatsappTemplates } from '@/utils/whatsapp';
import { showLocalPushNotification } from '@/utils/pushNotification';
import { format, subDays, startOfMonth, parseISO } from 'date-fns';

export default function AdminRequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<TiffinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<User[]>([]);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Action / Modal State
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<TiffinRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const [reqRes, empRes] = await Promise.all([
        tiffinRequestService.getRequests({
          userId: selectedUser ? Number(selectedUser) : undefined,
          status: selectedStatus || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: page - 1,
          size: size,
        }),
        userService.getAllEmployees(),
      ]);

      if (reqRes.success && reqRes.data) {
        setRequests(reqRes.data.content);
        setTotalPages(reqRes.data.totalPages || 1);
        setTotalElements(reqRes.data.totalElements || 0);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err: any) {
      toast.error('Failed to load requests from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadData(1, pageSize);
  }, [selectedUser, selectedStatus, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadData(1, newSize);
  };

  // Quick Preset Filters
  const setQuickDate = (preset: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL') => {
    const today = new Date();
    if (preset === 'TODAY') {
      const d = format(today, 'yyyy-MM-dd');
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'YESTERDAY') {
      const d = format(subDays(today, 1), 'yyyy-MM-dd');
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'WEEK') {
      setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else if (preset === 'MONTH') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedUser('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    toast.info('Filters reset to default view');
  };

  const handleApprove = async (req: TiffinRequest) => {
    try {
      setActionLoading(req.id);
      const res = await tiffinRequestService.approveRequest(req.id);
      if (res.success) {
        toast.success(`Request for ${req.userName} on ${req.serviceDate} approved! Billed record created.`);
        await loadData(currentPage, pageSize);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    try {
      setActionLoading(rejectingRequest.id);
      const res = await tiffinRequestService.rejectRequest(rejectingRequest.id, rejectionReason.trim());
      if (res.success) {
        toast.warning(`Request for ${rejectingRequest.userName} rejected.`);
        setRejectingRequest(null);
        setRejectionReason('');
        await loadData(currentPage, pageSize);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.userName?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q) ||
      r.comboName?.toLowerCase().includes(q) ||
      r.specialInstructions?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <span>Tiffin Requests & Approvals</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, filter, approve, or reject customer daily meal requests.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Quick Presets */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        {/* Search & Main Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Keyword</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, combo, note..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer / User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Customers</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.email})
                </option>
              ))}
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
              <option value="PENDING">PENDING (Action Required)</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Range Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Quick Date:</span>
          {(['ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setQuickDate(preset)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium text-[11px] transition"
            >
              {preset === 'ALL' ? 'All Dates' : preset === 'TODAY' ? 'Today' : preset === 'YESTERDAY' ? 'Yesterday' : preset === 'WEEK' ? 'Last 7 Days' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Tiffin / Combo</th>
                <th className="py-3 px-4">Dietary Note</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reviewed Info</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <Loader text="Loading requests..." />
                  </td>
                </tr>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {req.serviceDate ? format(parseISO(req.serviceDate), 'dd MMM yyyy') : ''}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{req.userName}</div>
                      <div className="text-[10px] text-slate-500">{req.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.tiffinType === 'FULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {req.comboName ? req.comboName : req.tiffinType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {req.specialInstructions || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {req.reviewedBy ? (
                        <div>
                          <div>By: {req.reviewedBy}</div>
                          {req.rejectionReason && <div className="text-red-600 text-[10px]">Reason: {req.rejectionReason}</div>}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(() => {
                        const matchedEmp = employees.find(e => e.id === req.userId || e.email === req.userEmail);
                        const empPhone = matchedEmp?.phone;

                        return (
                          <div className="flex items-center justify-end space-x-1.5">
                            {req.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleApprove(req)}
                                  disabled={actionLoading === req.id}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1 disabled:opacity-50 shadow-sm"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingRequest(req);
                                    setRejectionReason('');
                                  }}
                                  disabled={actionLoading === req.id}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 disabled:opacity-50"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium mr-1">Completed</span>
                            )}
                            {empPhone && (
                              <button
                                onClick={() => {
                                  const msg = req.status === 'APPROVED'
                                    ? whatsappTemplates.requestApproved(req.userName || 'Customer', req.serviceDate, req.comboName || req.tiffinType)
                                    : whatsappTemplates.paymentReminder(req.userName || 'Customer', 120);
                                  openWhatsApp(empPhone, msg);
                                }}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No requests found matching the current filters.
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

      {/* Reject Reason Dialog Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Reject Tiffin Request</span>
              </h2>
              <button onClick={() => setRejectingRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl space-y-1">
              <div><span className="font-bold">Customer:</span> {rejectingRequest.userName} ({rejectingRequest.userEmail})</div>
              <div><span className="font-bold">Service Date:</span> {rejectingRequest.serviceDate}</div>
              <div><span className="font-bold">Meal Package:</span> {rejectingRequest.comboName || rejectingRequest.tiffinType}</div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Kitchen batch full / Service unavailable for this area"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === rejectingRequest.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading === rejectingRequest.id ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}