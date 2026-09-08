'use client';

import React, { useState, useEffect } from 'react';
import { tiffinRequestService, comboService } from '@/services/api';
import { ComboPackage, TiffinType } from '@/types';
import { PlusCircle, Calendar, PackageCheck, Check, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import { useToast } from '@/context/ToastContext';

export default function UserRequestPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  const [serviceDate, setServiceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [combos, setCombos] = useState<ComboPackage[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<ComboPackage | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCombos = async () => {
      setLoading(true);
      try {
        const res = await comboService.getActiveCombos();
        if (res.success && res.data && res.data.length > 0) {
          setCombos(res.data);
          setSelectedCombo(res.data[0]);
        }
      } catch (err: any) {
        showError(err.message || 'Failed to load meal packages');
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCombo) {
      showWarning('Please select a Thali or Combo package');
      return;
    }

    try {
      setSubmitting(true);
      const res = await tiffinRequestService.submitRequest({
        serviceDate,
        tiffinType: selectedCombo.tiffinType,
        comboId: selectedCombo.id,
        comboName: selectedCombo.name,
        specialInstructions,
      });

      if (res.success) {
        showSuccess(`Order confirmed for ${selectedCombo.name} on ${serviceDate}!`);
        setTimeout(() => {
          router.push('/user/records');
        }, 1000);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Request submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {submitting && <Loader fullScreen text="Placing your tiffin order..." />}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          <span>Order Thali / Combo Tiffin</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select your service date and choose from Full Thali, Half Thali, or Special Combo meals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Date Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              1. Select Delivery Date
            </label>
            <p className="text-[11px] text-slate-400">Choose today or advance booking for upcoming days</p>
          </div>
          <input
            type="date"
            required
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Combos & Thalis Grid */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            2. Choose Your Meal Package / Thali
          </label>

          {loading ? (
            <div className="py-16 bg-white rounded-2xl border border-slate-200">
              <Loader text="Loading available Thalis and Combos..." />
            </div>
          ) : combos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {combos.map((combo) => {
                const isSelected = selectedCombo?.id === combo.id;
                return (
                  <div
                    key={combo.id}
                    onClick={() => setSelectedCombo(combo)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          combo.tiffinType === 'FULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                        }`}>
                          {combo.tiffinType}
                        </span>
                        <div className="text-base font-black text-emerald-600">
                          Rs. {Number(combo.price).toFixed(2)}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{combo.name}</h3>

                      {combo.description && (
                        <p className="text-[11px] text-slate-500">{combo.description}</p>
                      )}

                      {/* Included Items */}
                      <div className="pt-2 border-t border-slate-100/80">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Dishes Included:
                        </div>
                        <div className="space-y-1">
                          {combo.includedItems?.map((dish, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5 text-xs text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{dish}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className={`text-center py-1.5 rounded-xl text-xs font-bold transition ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isSelected ? '✓ Selected' : 'Select Package'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No active meal packages available. Please contact administrator.
            </div>
          )}
        </div>

        {/* Special Instructions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            3. Dietary Notes / Delivery Instructions (Optional)
          </label>
          <input
            type="text"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g. Less spicy / Extra salad / Deliver to 2nd Floor"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedCombo}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/20 transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>{submitting ? 'Placing Order...' : `Confirm Order - ${selectedCombo?.name || ''} (Rs. ${Number(selectedCombo?.price || 0).toFixed(2)})`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}