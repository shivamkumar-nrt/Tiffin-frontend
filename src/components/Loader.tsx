'use client';

import React from 'react';

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ text = 'Loading data...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center space-y-4 max-w-xs text-center animate-in fade-in zoom-in duration-200">
          <div className="loader"></div>
          <p className="text-xs font-bold text-slate-700">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <div className="loader"></div>
      {text && <p className="text-xs font-semibold text-slate-400">{text}</p>}
    </div>
  );
};

export default Loader;
