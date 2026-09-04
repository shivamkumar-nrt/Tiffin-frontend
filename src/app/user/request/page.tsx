'use client';

import React, { useState, useEffect } from 'react';
import { tiffinRequestService, comboService } from '@/services/api';
import { ComboPackage, TiffinType } from '@/types';
import { PlusCircle, Calendar, PackageCheck, Check, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function UserRequestPage() {
  const router = useRouter();
  const [serviceDate, setServiceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [combos, setCombos] = useState<ComboPackage[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<ComboPackage | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCombos = async () => {
      setLoading(true);
      try {
        const res = await comboService.getActiveCombos();
        if (res.success && res.data && res.data.length > 0) {
          setCombos(res.data);
          setSelectedCombo(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to load combos', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCombo) {
      alert('Please select a Thali or Combo package');
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
        setSuccess(true);
        setTimeout(() => {
          router.push('/user/records');
        }, 1200);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Request submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <PlusCircle className="w-5 h-5 text-orange-600" />
          <span>Order Thali / Combo Tiffin</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select your service date and choose from Full Thali, Half Thali, or Special Combo meals.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 font-bold">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Tiffin request submitted successfully! Redirecting to your history...</span>
        </div>
      )}

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
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Combos & Thalis Grid */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            2. Choose Your Meal Package / Thali
          </label>

          {loading ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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
                        ? 'border-orange-600 bg-orange-50/50 shadow-md ring-2 ring-orange-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          combo.tiffinType === 'FULL' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {combo.tiffinType}
                        </span>
                        <div className="text-base font-black text-orange-600">
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
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              <span>{dish}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className={`text-center py-1.5 rounded-xl text-xs font-bold transition ${
                        isSelected ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
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
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedCombo}
          className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>{submitting ? 'Placing Order...' : `Confirm Order - ${selectedCombo?.name || ''} (Rs. ${Number(selectedCombo?.price || 0).toFixed(2)})`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}