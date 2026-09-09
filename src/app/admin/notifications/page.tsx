'use client';

import React, { useState, useEffect } from 'react';
import { notificationService, userService } from '@/services/api';
import { User, BroadcastNotification } from '@/types';
import {
  Megaphone,
  Mail,
  MessageCircle,
  Bell,
  Send,
  Users,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  Utensils
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { Loader } from '@/components/Loader';
import { openWhatsApp } from '@/utils/whatsapp';
import { showLocalPushNotification } from '@/utils/pushNotification';

export default function AdminNotificationsPage() {
  const { showSuccess, showError, showWarning } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [history, setHistory] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'WITH_DUES' | 'SINGLE'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Channels
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendPush, setSendPush] = useState(true);

  // Result WhatsApp Links Modal / Box
  const [lastBroadcast, setLastBroadcast] = useState<BroadcastNotification | null>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [empRes, histRes] = await Promise.all([
        userService.getAllEmployees(),
        notificationService.getBroadcastHistory()
      ]);
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data.filter(e => e.role !== 'ROLE_ADMIN'));
      }
      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load notification center data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const templates = [
    {
      name: '🍱 Special Menu Announcement',
      icon: Utensils,
      title: 'Special Menu for Today: Paneer Butter Masala & Gulab Jamun!',
      msg: 'Namaste! Today we have an exclusive chef-special meal package available. Book your Thali before 11:30 AM on your customer portal to guarantee fresh hot delivery.'
    },
    {
      name: '💳 Monthly Payment Clearance Notice',
      icon: CreditCard,
      title: 'Monthly Tiffin Balance Settlement Reminder (25th - 30th)',
      msg: 'This is a reminder to settle your monthly tiffin account before month-end. You can pay using Kotak/PhonePe/Amazon/CRED UPI and enter your UTR number in the Payment Settlements section.'
    },
    {
      name: '⏰ Kitchen Schedule & Delivery Timing',
      icon: Clock,
      title: 'Lunch Delivery Timing Update',
      msg: 'Please note that lunch tiffins will be dispatched today between 12:45 PM and 1:30 PM. For any special delivery instructions, please update your request.'
    },
    {
      name: '🎉 Festival & Holiday Greetings',
      icon: Sparkles,
      title: 'Festival Greetings & Special Holiday Thali!',
      msg: 'Wishing you a joyful festival season! We are serving a festive feast today with special sweets and treats. Thank you for being a valued customer.'
    }
  ];

  const handleApplyTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.msg);
    showSuccess(`Applied preset: ${tpl.name}`);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showWarning('Please enter a notification title / subject');
      return;
    }
    if (!message.trim()) {
      showWarning('Please enter the message content');
      return;
    }
    if (!sendEmail && !sendWhatsApp && !sendPush) {
      showWarning('Please select at least one delivery channel (Email, WhatsApp, or Push)');
      return;
    }
    if (targetAudience === 'SINGLE' && !selectedUserId) {
      showWarning('Please select a target customer');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        title,
        message,
        targetAudience,
        targetUserId: targetAudience === 'SINGLE' ? Number(selectedUserId) : undefined,
        sendEmail,
        sendWhatsApp,
        sendPush,
      };

      const res = await notificationService.sendBroadcast(payload);
      if (res.success && res.data) {
        showSuccess(res.message || 'Notification broadcast dispatched successfully!');
        setLastBroadcast(res.data);
        setTitle('');
        setMessage('');

        // Trigger local push preview
        if (sendPush) {
          showLocalPushNotification('📢 ' + res.data.title, res.data.message, '/admin/notifications');
        }

        // Refresh history
        const histRes = await notificationService.getBroadcastHistory();
        if (histRes.success && histRes.data) {
          setHistory(histRes.data);
        }
      }
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || 'Failed to dispatch notification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <Megaphone className="w-7 h-7 text-emerald-600" />
            <span>Broadcast & Notification Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch announcements simultaneously across <b className="text-slate-800">Email, 1-Click WhatsApp, and Phone Lock-Screen Push Alerts</b>.
          </p>
        </div>

        <button
          onClick={fetchInitialData}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-emerald-600" />
          <span>Refresh History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Broadcast Composer */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSendBroadcast} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Compose Multi-Channel Broadcast</span>
            </h2>

            {/* Target Audience Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Select Target Audience
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetAudience('ALL')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                    targetAudience === 'ALL'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Users className={`w-5 h-5 mt-0.5 ${targetAudience === 'ALL' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">All Customers</div>
                    <div className="text-[11px] text-slate-500 font-normal">All active food subscribers</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('WITH_DUES')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                    targetAudience === 'WITH_DUES'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mt-0.5 ${targetAudience === 'WITH_DUES' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Customers With Dues</div>
                    <div className="text-[11px] text-slate-500 font-normal">Having unpaid meals</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('SINGLE')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                    targetAudience === 'SINGLE'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <MessageCircle className={`w-5 h-5 mt-0.5 ${targetAudience === 'SINGLE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Single Customer</div>
                    <div className="text-[11px] text-slate-500 font-normal">Specific recipient</div>
                  </div>
                </button>
              </div>

              {/* Single User Dropdown */}
              {targetAudience === 'SINGLE' && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Choose Customer:</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Customer from Directory --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.email}) - {emp.phone || 'No phone'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Delivery Channels Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Select Delivery Channels
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                  sendEmail ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs">HTML Email</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                  sendWhatsApp ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs">1-Click WhatsApp</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                  sendPush ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={sendPush}
                    onChange={(e) => setSendPush(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs">Screen Push Alert</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Message Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Title / Subject *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Special Weekend Thali Announcement / Monthly Bill Clearance"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  4. Message Body *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Type your announcement, special meal details, payment notice, or kitchen timings..."
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>
            </div>

            {/* Submit Dispatch Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 text-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Dispatching Broadcast...' : 'Dispatch Broadcast to All Selected Channels'}</span>
            </button>
          </form>

          {/* Last Broadcast WhatsApp Links Box */}
          {lastBroadcast && lastBroadcast.whatsAppLinks && lastBroadcast.whatsAppLinks.length > 0 && (
            <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-xl border border-emerald-500/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2.5">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-emerald-300">
                    1-Click WhatsApp Direct Chat List ({lastBroadcast.whatsAppLinks.length} Customers)
                  </span>
                </div>
                <button
                  onClick={() => setLastBroadcast(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                Click on any customer below to instantly open WhatsApp with the pre-formatted announcement:
              </p>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {lastBroadcast.whatsAppLinks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-emerald-900/60 rounded-xl border border-emerald-500/20 hover:bg-emerald-900 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.customerName}</div>
                      <div className="text-[10px] text-emerald-400">{item.phone}</div>
                    </div>
                    <a
                      href={item.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 transition shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Presets & Status */}
        <div className="space-y-6">
          {/* Preset Templates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Quick Preset Templates</span>
            </h3>
            <p className="text-[11px] text-slate-400">1-click to auto-fill proven announcement copy:</p>

            <div className="space-y-2">
              {templates.map((tpl, i) => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200/70 text-left transition flex items-start space-x-3 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5 group-hover:scale-110 transition-transform">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{tpl.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{tpl.msg}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Delivery Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Active Delivery Hub</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><b>HTML Emails:</b> Formatted with brand header & user personalization</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><b>1-Click WhatsApp:</b> Auto sanitized with +91 country prefix</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><b>Web Push Alerts:</b> Immediate bell icon update & screen popup</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Past Broadcast History</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">{history.length} Announcements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Subject / Title</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Channels</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Dispatched By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Loader text="Loading history..." />
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{h.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-md">{h.message}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {h.targetAudience === 'ALL' ? 'All Customers' :
                         h.targetAudience === 'WITH_DUES' ? 'With Dues' : (h.targetUserName || 'Single Customer')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        {h.channels.includes('EMAIL') && <span title="Email"><Mail className="w-3.5 h-3.5 text-blue-600" /></span>}
                        {h.channels.includes('WHATSAPP') && <span title="WhatsApp"><MessageCircle className="w-3.5 h-3.5 text-emerald-600" /></span>}
                        {h.channels.includes('PUSH') && <span title="Push"><Bell className="w-3.5 h-3.5 text-purple-600" /></span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {h.recipientsCount} users
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 truncate max-w-[120px]">
                      {h.sentBy}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No broadcast announcements dispatched yet.
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