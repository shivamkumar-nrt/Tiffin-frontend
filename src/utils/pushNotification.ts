/**
 * 100% Free Web Push & Screen Notification Utility
 * Uses HTML5 Notification API + Service Worker to show native lock screen notifications
 */

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  }
  return null;
};

export const showLocalPushNotification = async (
  title: string,
  body: string,
  url: string = '/'
) => {
  if (!isNotificationSupported()) return;

  if (Notification.permission !== 'granted') {
    return;
  }

  // Play a soft notification audio beep if possible
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.35);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // ignore audio failure
  }

  // Use ServiceWorker if available for rich actions & background persistence
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
          vibrate: [200, 100, 200],
          data: { url },
        } as any);
        return;
      }
    } catch (e) {
      console.warn('SW notification failed, falling back to standard notification', e);
    }
  }

  // Standard fallback
  new Notification(title, {
    body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
  });
};