'use client';

import React, { useState, useEffect } from 'react';
import { dashboardService, tiffinRequestService, comboService } from '@/services/api';
import { UserDashboardStats, ComboPackage } from '@/types';
import {
  Utensils,
  CreditCard,
  ChefHat,
  Calendar,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  Flame,
  Candy,
  PackageCheck,
  FileText,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import Loader from '@/components/Loader';
import { useToast } from '@/context/ToastContext';

export default function UserDashboardPage() {
  const { showSuccess, showError, showWarning } = useToast();
  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [combos, setCombos] = useState<ComboPackage[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<ComboPackage | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Request Box State
  const [requestDate, setRequestDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, comboRes] = await Promise.all([
        dashboardService.getUserStats(),
        comboService.getActiveCombos(),
      ]);

      if (dashRes.success && dashRes.data) {
        setStats(dashRes.data);
      }
      if (comboRes.success && comboRes.data) {
        setCombos(comboRes.data);
        if (comboRes.data.length > 0 && !selectedCombo) {
          setSelectedCombo(comboRes.data[0]);
        }
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load user dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCombo) {
      showWarning('Please select a Thali or Combo package');
      return;
    }

    try {
      setSubmitting(true);
      const res = await tiffinRequestService.submitRequest({
        serviceDate: requestDate,
        tiffinType: selectedCombo.tiffinType,
        comboId: selectedCombo.id,
        comboName: selectedCombo.name,
        specialInstructions,
      });

      if (res.success) {
        showSuccess(`Request placed for ${selectedCombo.name} on ${requestDate} (Rs. ${Number(selectedCombo.price).toFixed(2)})!`);
        setSpecialInstructions('');
        await loadData();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Request submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader text="Loading your dashboard & today's menu..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Welcome to Tiffin Portal</h1>
          <p className="text-orange-100 text-xs mt-1">
            Order your daily fresh home-style meals, track meal history, and view invoices.
          </p>
        </div>

        {/* Due Balance Card on Banner */}
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-xl text-right">
            <div className="text-[10px] uppercase font-bold text-orange-200">Current Outstanding Due</div>
            <div className="text-2xl font-black text-white">
              Rs. {Number(stats?.outstandingBalance || 0).toFixed(2)}
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Today's Menu & Quick Request */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Delicious Menu */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Today&apos;s Special Meal Menu ({format(new Date(), 'dd MMMM yyyy')})
              </h2>
            </div>
            {stats?.todayMenu?.special && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                ⭐ Special
              </span>
            )}
          </div>

          {stats?.todayMenu ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{stats.todayMenu.title}</h3>
                {stats.todayMenu.description && (
                  <p className="text-xs text-slate-500 mt-1">{stats.todayMenu.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {stats.todayMenu.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">{item.category}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.spicy && (
                        <span title="Spicy">
                          <Flame className="w-3.5 h-3.5 text-red-500" />
                        </span>
                      )}
                      {item.sweet && (
                        <span title="Sweet">
                          <Candy className="w-3.5 h-3.5 text-pink-500" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ChefHat className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Fresh homemade thali meals prepared daily.</p>
            </div>
          )}
        </div>

        {/* Quick Order Widget from Dynamic Combos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Order Tiffin</h2>
          </div>

          {combos.length > 0 ? (
            <form onSubmit={handleQuickRequest} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Service Date</label>
                <input
                  type="date"
                  required
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Thali / Combo</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {combos.map((combo) => {
                    const isSel = selectedCombo?.id === combo.id;
                    return (
                      <div
                        key={combo.id}
                        onClick={() => setSelectedCombo(combo)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition ${
                          isSel
                            ? 'border-orange-600 bg-orange-50 text-orange-950 font-semibold shadow-sm ring-1 ring-orange-500'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{combo.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {combo.includedItems?.length || 0} items included
                          </div>
                        </div>
                        <div className="text-right font-black text-orange-600">
                          Rs. {Number(combo.price).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Special Note (Optional)
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Less oil / Extra salad"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedCombo}
                className="w-full mt-2 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <span>{submitting ? 'Submitting...' : `Order ${selectedCombo?.name || ''}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No active meal packages configured yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Requests Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">My Recent Tiffin Requests</h2>
          <Link href="/user/records" className="text-xs text-orange-600 font-bold hover:underline">
            View All Records &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Meal / Combo Package</th>
                <th className="py-3 px-4">Special Instructions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Admin Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentRequests && stats.recentRequests.length > 0 ? (
                stats.recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{req.serviceDate}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                        {req.comboName ? req.comboName : req.tiffinType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{req.specialInstructions || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {req.rejectionReason || (req.reviewedBy ? `Approved by ${req.reviewedBy}` : 'Awaiting Review')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    No requests submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}