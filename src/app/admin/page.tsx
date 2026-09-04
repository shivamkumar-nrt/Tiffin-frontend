'use client';

import React, { useState, useEffect } from 'react';
import { dashboardService, tiffinRequestService, comboService } from '@/services/api';
import { DashboardStats, TiffinRequest, ComboPackage } from '@/types';
import {
  Users,
  ClipboardList,
  Utensils,
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ChefHat,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [combos, setCombos] = useState<ComboPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [dashRes, comboRes] = await Promise.all([
        dashboardService.getAdminStats(),
        comboService.getActiveCombos(),
      ]);

      if (dashRes.success && dashRes.data) {
        setStats(dashRes.data);
      }
      if (comboRes.success && comboRes.data) {
        setCombos(comboRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      await tiffinRequestService.approveRequest(id);
      await loadStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      setActionLoading(id);
      await tiffinRequestService.rejectRequest(id, reason);
      await loadStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/10">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Admin Overview</h1>
          <p className="text-orange-100 text-xs mt-1">
            Monitor pending approvals, daily consumption, outstanding balances & payments.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/admin/requests"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold text-white transition flex items-center space-x-1.5"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Manage Requests</span>
          </Link>
          <Link
            href="/admin/combos"
            className="px-4 py-2 bg-white text-orange-700 hover:bg-orange-50 rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Combos & Thalis</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {stats?.pendingRequests || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-amber-600 font-medium">
            Requires your action to create billable meal records
          </div>
        </div>

        {/* Today's Tiffins */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Tiffins</div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {stats?.totalTiffinsToday || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-500">
            Est. Today Value: <span className="font-bold text-slate-800">Rs. {Number(stats?.todayRevenue || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Due Balance</div>
              <div className="text-2xl font-black text-red-600 mt-1">
                Rs. {Number(stats?.totalOutstandingDues || 0).toFixed(2)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-500">
            Unsettled approved meal consumption
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settled Payments</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                Rs. {Number(stats?.totalRevenueCollected || 0).toFixed(2)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-emerald-600 font-medium">
            Total verified & invoiced collections
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Action Table & Combos / Thalis Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests Column (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">Pending Requests Awaiting Approval</h2>
            </div>
            <Link href="/admin/requests" className="text-xs text-orange-600 font-bold hover:text-orange-700">
              View All &rarr;
            </Link>
          </div>

          <div className="p-4">
            {stats?.recentPendingRequests && stats.recentPendingRequests.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recentPendingRequests.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 p-2 rounded-xl transition">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{req.userName}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          req.tiffinType === 'FULL' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {req.comboName ? req.comboName : req.tiffinType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Date: <span className="font-semibold text-slate-700">{req.serviceDate}</span> • {req.userEmail}
                      </div>
                      {req.specialInstructions && (
                        <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                          Note: {req.specialInstructions}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No pending requests. All requests have been reviewed!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Combos & Thalis */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <PackageCheck className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Active Combos & Thalis
                </h3>
              </div>
              <Link href="/admin/combos" className="text-[11px] text-orange-600 font-bold hover:underline">
                Manage
              </Link>
            </div>

            {combos.length > 0 ? (
              <div className="mt-4 space-y-3">
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800">{combo.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {combo.includedItems?.length || 0} dishes included
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-orange-600">
                        Rs. {Number(combo.price).toFixed(2)}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-center py-6 text-slate-400 text-xs">
                No active combos. Go to Combos & Thalis to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}