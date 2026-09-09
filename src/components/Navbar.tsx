'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  Utensils,
  LogOut,
  CreditCard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { isCollapsed, toggleCollapse, toggleMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand & Mobile Hamburger & Collapse Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user && (
              <>
                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  onClick={toggleMobile}
                  className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
                  aria-label="Toggle navigation drawer"
                >
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>

                {/* Desktop Sidebar Collapse / Expand Button */}
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus:outline-none"
                  title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="w-5 h-5 text-slate-600 hover:text-emerald-600" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5 text-slate-600 hover:text-emerald-600" />
                  )}
                </button>
              </>
            )}

            <Link href={isAdmin ? '/admin' : '/user'} className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Tiffin<span className="text-slate-800">System</span>
                </span>
                <span className="block text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                  {isAdmin ? 'Admin Console' : 'Customer Portal'}
                </span>
              </div>
            </Link>
          </div>

          {/* User Info & Actions */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Outstanding Balance Pill for User */}
              {!isAdmin && (
                <div className="flex items-center space-x-1 sm:space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-800 shadow-xs">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden xs:inline text-emerald-700">Due:</span>
                  <span className="text-emerald-950 font-bold">Rs. {Number(user.outstandingBalance || 0).toFixed(2)}</span>
                </div>
              )}

              {/* Notification Center Bell */}
              <NotificationBell />

              {/* User Profile Tag */}
              <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">{user.fullName}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email}</div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;