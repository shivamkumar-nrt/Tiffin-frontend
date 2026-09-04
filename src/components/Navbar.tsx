'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Utensils, LogOut, User as UserIcon, ShieldAlert, Sparkles, CreditCard } from 'lucide-react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href={isAdmin ? '/admin' : '/user'} className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Tiffin<span className="text-slate-800">System</span>
                </span>
                <span className="block text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                  {isAdmin ? 'Admin Console' : 'Employee Portal'}
                </span>
              </div>
            </Link>
          </div>

          {/* User Info & Actions */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Outstanding Balance Pill for User */}
              {!isAdmin && (
                <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-semibold text-orange-700">
                  <CreditCard className="w-3.5 h-3.5 text-orange-600" />
                  <span>Due Balance:</span>
                  <span className="text-orange-900 font-bold">Rs. {Number(user.outstandingBalance || 0).toFixed(2)}</span>
                </div>
              )}

              {/* User Profile Tag */}
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{user.fullName}</div>
                  <div className="text-[10px] text-slate-500">{user.email}</div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};