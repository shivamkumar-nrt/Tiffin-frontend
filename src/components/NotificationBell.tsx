'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  CreditCard,
  Utensils,
  MessageCircle,
  ShieldCheck,
  Volume2,
  X
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalPushNotification
} from '@/utils/pushNotification';
import { openWhatsApp, whatsappTemplates } from '@/utils/whatsapp';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'ORDER' | 'PAYMENT' | 'REMINDER' | 'SYSTEM';
  read: boolean;
}

export const NotificationBell: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }

    // Default contextual notifications
    if (isAdmin) {
      setNotifications([
        {
          id: '1',
          title: '🍱 Tiffin Console Active',
          message: 'System is monitoring live customer meal requests and payment receipts.',
          time: 'Live',
          type: 'SYSTEM',
          read: false
        },
        {
          id: '2',
          title: '💳 WhatsApp Reminders Ready',
          message: '1-Click WhatsApp notifications enabled for all customer accounts.',
          time: 'Active',
          type: 'REMINDER',
          read: false
        }
      ]);
    } else {
      setNotifications([
        {
          id: '1',
          title: '🍱 Live Order Updates',
          message: 'Track your daily tiffin approvals and consumption records.',
          time: 'Today',
          type: 'ORDER',
          read: false
        },
        {
          id: '2',
          title: '💳 UPI Multi-Accounts Active',
          message: 'Pay via Kotak, PhonePe, Amazon Pay or CRED with instant QR scan.',
          time: 'Live',
          type: 'PAYMENT',
          read: false
        }
      ]);
    }
  }, [isAdmin]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTogglePush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      showLocalPushNotification(
        '🎉 Notifications Activated!',
        'Your device is now set up to receive lock screen alerts for orders, meals & bills.',
        isAdmin ? '/admin' : '/user'
      );
    } else {
      setPermission('denied');
    }
  };

  const handleTestAlert = () => {
    showLocalPushNotification(
      '🍱 Tiffin Alert (Test)',
      'This is how instant meal and payment alerts look on your phone screen!',
      isAdmin ? '/admin' : '/user'
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-200/60 focus:outline-none"
        title="Notifications & Screen Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-600 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Dropdown Notification Center */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Notifications & Alerts</h3>
                <p className="text-[10px] text-slate-400">Lock screen & WhatsApp updates</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Controls: Push Notification Status */}
          <div className="p-3 mx-3 my-2 bg-gradient-to-r from-slate-50 to-emerald-50/50 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">Phone Screen Alerts</span>
                <p className="text-[10px] text-slate-500">
                  {permission === 'granted'
                    ? '🟢 Active (Lock Screen Enabled)'
                    : '⚪ Inactive (Click to Enable)'}
                </p>
              </div>
              {permission === 'granted' ? (
                <button
                  onClick={handleTestAlert}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 shadow-xs"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Test Alert</span>
                </button>
              ) : (
                <button
                  onClick={handleTogglePush}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* WhatsApp Direct Action Button */}
          <div className="px-3 pb-2">
            {!isAdmin ? (
              <button
                onClick={() => openWhatsApp('919876543210', whatsappTemplates.userHelp())}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact Admin on WhatsApp</span>
              </button>
            ) : (
              <button
                onClick={() => openWhatsApp('', whatsappTemplates.paymentReminder('All Customers', 0))}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Quick WhatsApp Helper</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 px-2">
            {notifications.map((item) => (
              <div key={item.id} className="p-2.5 hover:bg-slate-50 rounded-xl transition flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 mt-0.5">
                  {item.type === 'ORDER' ? <Utensils className="w-3.5 h-3.5 text-emerald-600" /> :
                   item.type === 'PAYMENT' ? <CreditCard className="w-3.5 h-3.5 text-blue-600" /> :
                   item.type === 'REMINDER' ? <Clock className="w-3.5 h-3.5 text-amber-600" /> :
                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-2 px-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            Push Alerts &bull; WhatsApp Notifications &bull; Email Receipts
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;