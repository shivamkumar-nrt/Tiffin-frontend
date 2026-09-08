'use client';

import React, { useEffect, useState } from 'react';
import { subscribeApiLoading } from '@/services/api';
import { AnimatePresence, motion } from 'framer-motion';

export const GlobalApiLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<string>('GET');

  useEffect(() => {
    const unsubscribe = subscribeApiLoading((isLoading, reqMethod) => {
      setLoading(isLoading);
      if (reqMethod) setMethod(reqMethod);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Only show the floating modal/card indicator for state-changing mutations (POST, PUT, DELETE)
  // Page-level GET calls already render the inline or full page custom .loader
  const isMutation = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';

  const getActionText = () => {
    switch (method) {
      case 'DELETE':
        return 'Deleting item...';
      case 'PUT':
      case 'PATCH':
        return 'Updating details...';
      case 'POST':
        return 'Saving & Processing...';
      default:
        return 'Connecting to server...';
    }
  };

  return (
    <>
      {/* Top ambient progress bar for ALL requests (GET, POST, PUT, DELETE) */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 z-[9999] origin-left shadow-sm shadow-emerald-500/50"
          />
        )}
      </AnimatePresence>

      {/* Floating Center Indicator for Mutations (POST, PUT, DELETE) */}
      <AnimatePresence>
        {loading && isMutation && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 right-6 z-[9998] bg-slate-950/90 text-white backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center space-x-3 pointer-events-none"
          >
            <div className="loader scale-75 origin-left"></div>
            <span className="text-xs font-bold text-slate-100">{getActionText()}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalApiLoader;
