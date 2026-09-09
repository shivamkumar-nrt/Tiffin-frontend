'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/api';
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
  X,
  Megaphone,
  CheckCheck,
  ExternalLink
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalPushNotification
} from '@/utils/pushNotification';
import { openWhatsApp, whatsappTemplates } from '@/utils/whatsapp';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface RealNotificationItem {
  id: number | string;
  title: string;
  message: string;
  targetAudience?: string;
  targetUserName?: string;
  channels?: string;
  createdAt?: string;
  read?: boolean;
}

export const NotificationBell: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<RealNotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastNotifiedIdRef = useRef<string | null>(null);

  // Load read notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`tiffin_read_notifications_${user?.id || 'guest'}`);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, [user?.id]);

  // Save read IDs to localStorage
  const markAsRead = (id: string | number) => {
    const idStr = String(id);
    const updated = new Set(readIds).add(idStr);
    setReadIds(updated);
    try {
      localStorage.setItem(`tiffin_read_notifications_${user?.id || 'guest'}`, JSON.stringify(Array.from(updated)));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => String(n.id)));
    setReadIds(allIds);
    try {
      localStorage.setItem(`tiffin_read_notifications_${user?.id || 'guest'}`, JSON.stringify(Array.from(allIds)));
    } catch {
      // ignore
    }
  };

  // Fetch real notifications from backend
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationService.getMyNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);

        // Check if there is a brand new unread notification to trigger Web Push alert
        if (res.data.length > 0) {
          const latest = res.data[0];
          const latestIdStr = String(latest.id);

          // If this is a new notification we haven't seen in this session and not marked as read
          if (
            lastNotifiedIdRef.current !== null &&
            lastNotifiedIdRef.current !== latestIdStr &&
            !readIds.has(latestIdStr)
          ) {
            // Trigger Phone screen push notification
            showLocalPushNotification(
              '📢 ' + (latest.title || 'New Announcement'),
              latest.message || 'You have received a new update.',
              isAdmin ? '/admin/notifications' : '/user'
            );
          }
          lastNotifiedIdRef.current = latestIdStr;
        }
      }
    } catch {
      // fallback silent
    }
  };

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }

    if (user) {
      fetchNotifications();
      // Poll every 25 seconds for real-time delivery
      const interval = setInterval(fetchNotifications, 25000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
        'Your device will now receive live pop-up alerts for meal updates, payments and announcements.',
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

  const unreadCount = notifications.filter(n => !readIds.has(String(n.id))).length;

  const formatNotificationTime = (createdAt?: string) => {
    if (!createdAt) return 'Recent';
    try {
      return formatDistanceToNow(parseISO(createdAt), { addSuffix: true });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-200/60 focus:outline-none cursor-pointer"
        title="Notifications & Screen Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
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
                <p className="text-[10px] text-slate-400">Live announcements & updates</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold px-2 py-0.5 rounded-md hover:bg-emerald-50 transition cursor-pointer"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Test Alert</span>
                </button>
              ) : (
                <button
                  onClick={handleTogglePush}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
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
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact Kitchen on WhatsApp</span>
              </button>
            ) : (
              <a
                href="/admin/notifications"
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 text-center"
              >
                <Megaphone className="w-4 h-4 text-emerald-600" />
                <span>Open Broadcast Center</span>
              </a>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 px-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span>No announcements yet</span>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.has(String(item.id));
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-3 rounded-xl transition flex items-start space-x-3 cursor-pointer ${
                      isRead ? 'opacity-75 hover:bg-slate-50' : 'bg-emerald-50/40 hover:bg-emerald-50 border-l-2 border-emerald-500'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isRead ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <Megaphone className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs truncate ${isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatNotificationTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug line-clamp-3 whitespace-pre-line">
                        {item.message}
                      </p>
                      {item.channels && (
                        <div className="mt-1.5 flex items-center gap-1">
                          {item.channels.split(',').map((ch, ci) => (
                            <span
                              key={ci}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-medium uppercase"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 px-4 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-between">
            <span>Push &bull; WhatsApp &bull; Email</span>
            <button
              onClick={fetchNotifications}
              className="text-emerald-600 hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;