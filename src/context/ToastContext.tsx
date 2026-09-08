'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, type, message, title, duration };
      
      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts on screen

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title: string = 'Success') => {
    showToast('success', message, title);
  }, [showToast]);

  const error = useCallback((message: string, title: string = 'Error') => {
    showToast('error', message, title, 5000);
  }, [showToast]);

  const info = useCallback((message: string, title: string = 'Notice') => {
    showToast('info', message, title);
  }, [showToast]);

  const warning = useCallback((message: string, title: string = 'Warning') => {
    showToast('warning', message, title);
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        info,
        warning,
        showSuccess: success,
        showError: error,
        showInfo: info,
        showWarning: warning,
        removeToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const getIcon = () => {
              switch (toast.type) {
                case 'success':
                  return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
                case 'error':
                  return <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
                case 'warning':
                  return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
                default:
                  return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
              }
            };

            const getBorderAndBg = () => {
              switch (toast.type) {
                case 'success':
                  return 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10';
                case 'error':
                  return 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10';
                case 'warning':
                  return 'bg-white border-amber-200 text-slate-800 shadow-amber-500/10';
                default:
                  return 'bg-white border-blue-200 text-slate-800 shadow-blue-500/10';
              }
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto rounded-2xl border p-4 shadow-xl flex items-start space-x-3 backdrop-blur-xl ${getBorderAndBg()}`}
              >
                {getIcon()}
                <div className="flex-1 min-w-0">
                  {toast.title && <h5 className="text-xs font-bold text-slate-900">{toast.title}</h5>}
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition -mr-1 -mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
