'use client';

import React, { useEffect, useState } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalPushNotification,
  registerServiceWorker
} from '@/utils/pushNotification';
import { Bell, BellRing, CheckCircle, X } from 'lucide-react';

export const PushNotificationManager: React.FC = () => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    if (isNotificationSupported()) {
      setSupported(true);
      const perm = getNotificationPermission();
      setPermission(perm);
      registerServiceWorker();

      const dismissed = localStorage.getItem('tiffin_push_banner_dismissed');
      if (perm === 'default' && dismissed !== 'true') {
        setBannerDismissed(false);
      }
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      setBannerDismissed(true);
      localStorage.setItem('tiffin_push_banner_dismissed', 'true');
      showLocalPushNotification(
        '🎉 Notifications Enabled!',
        'You will now receive instant lock screen alerts for Tiffin orders, payment approvals, and monthly bills.',
        '/user'
      );
    } else {
      setPermission('denied');
      setBannerDismissed(true);
    }
  };

  const handleDismiss = () => {
    setBannerDismissed(true);
    localStorage.setItem('tiffin_push_banner_dismissed', 'true');
  };

  if (!supported || permission === 'granted' || bannerDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white px-4 py-3 border-b border-emerald-500/30 shadow-md">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="font-bold text-emerald-300">Enable Instant Mobile & Screen Alerts</span>
            <p className="text-slate-300 text-[11px]">Get lock-screen notifications for Tiffin approvals, daily lunch delivery, and monthly UPI bills.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleEnable}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable Alerts (Free)</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationManager;