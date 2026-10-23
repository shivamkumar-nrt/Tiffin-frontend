'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type Format = 'csv' | 'pdf';

const CUSTOMER_ITEMS = [
  { type: 'records', label: 'My Tiffin Records' },
  { type: 'requests', label: 'My Requests' },
  { type: 'payments', label: 'My Payments' },
  { type: 'invoices', label: 'My Invoices' },
];

const ADMIN_ITEMS = [
  { type: 'records', label: 'Daily Consumption' },
  { type: 'requests', label: 'Tiffin Requests' },
  { type: 'payments', label: 'Payments' },
  { type: 'invoices', label: 'Invoices' },
  { type: 'users', label: 'Users Directory' },
];

/** Navbar dropdown: every signed-in user can download their data as CSV or PDF. */
export const ExportMenu: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showError, showSuccess } = useToast();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const items = isAdmin ? ADMIN_ITEMS : CUSTOMER_ITEMS;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const download = async (type: string, format: Format) => {
    const key = `${type}:${format}`;
    setBusy(key);
    try {
      const res = await apiClient.get(isAdmin ? '/export/admin' : '/export/my', {
        params: { type, format, ...(from && { startDate: from }), ...(to && { endDate: to }) },
        responseType: 'blob',
      });
      const disposition: string = res.headers['content-disposition'] || '';
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      const filename = match?.[1] || `tiffin-${type}.${format}`;
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showSuccess(`${format.toUpperCase()} downloaded`);
    } catch (err: any) {
      let msg = 'Export failed. Please try again.';
      try {
        const text = await (err.response?.data as Blob | undefined)?.text();
        if (text) msg = JSON.parse(text).message || msg;
      } catch {
        /* keep default message */
      }
      showError(msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Export my data"
        className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-700 hover:bg-gold-500/20 hover:border-gold-400/60 transition text-xs font-bold"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[19rem] max-w-[90vw] rounded-2xl border border-gold-500/25 bg-ink-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 p-4 z-50 space-y-3">
          <div>
            <div className="text-sm font-extrabold text-gold-800">{isAdmin ? 'Export business data' : 'Export my data'}</div>
            <p className="text-[11px] text-stone-500 mt-0.5">Download as CSV (Excel) or PDF.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-lg bg-stone-50 border border-stone-200 px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-lg bg-stone-50 border border-stone-200 px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
            </label>
          </div>

          <ul className="divide-y divide-stone-200/60">
            {items.map((it) => (
              <li key={it.type} className="flex items-center justify-between py-2">
                <span className="text-xs font-semibold text-stone-700">{it.label}</span>
                <div className="flex items-center space-x-1.5">
                  {(['csv', 'pdf'] as Format[]).map((f) => {
                    const loading = busy === `${it.type}:${f}`;
                    return (
                      <button
                        key={f}
                        type="button"
                        disabled={busy !== null}
                        onClick={() => download(it.type, f)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-gold-500/30 text-gold-700 hover:bg-gold-500 hover:text-ink-950 transition disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : f === 'csv' ? (
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>{f.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
