'use client';

import React from 'react';
import UpiPaymentCard from './UpiPaymentCard';

interface UserPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  outstandingBalance: number;
  onSuccess: () => void;
}

export default function UserPaymentModal({
  isOpen,
  onClose,
  outstandingBalance,
  onSuccess,
}: UserPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        <UpiPaymentCard
          outstandingBalance={outstandingBalance}
          onPaymentSuccess={() => {
            onSuccess();
            onClose();
          }}
          onClose={onClose}
          isModal={true}
          title="Scan & Settle Tiffin Payment"
        />
      </div>
    </div>
  );
}
