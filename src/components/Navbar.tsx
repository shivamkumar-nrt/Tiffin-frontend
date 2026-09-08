'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Utensils,
  LogOut,
  User as UserIcon,
  CreditCard,
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  ChefHat,
  PackageCheck,
  FileText,
  Users,
  History,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Tiffin Requests', href: '/admin/requests', icon: ClipboardList },
    { name: 'Daily Consumption Log', href: '/admin/records', icon: CalendarCheck },
    { name: 'Menu Items', href: '/admin/menu', icon: ChefHat },
    { name: 'Combos & Thalis', href: '/admin/combos', icon: PackageCheck },
    { name: 'Balances & Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Invoices Center', href: '/admin/invoices', icon: FileText },
    { name: 'Users Directory', href: '/admin/employees', icon: Users },
    { name: 'Audit Logs', href: '/admin/audit', icon: History },
  ];

  const employeeNav = [
    { name: 'Overview', href: '/user', icon: LayoutDashboard },
    { name: 'Order Thali / Combo', href: '/user/request', icon: PlusCircle },
    { name: 'My Tiffin History', href: '/user/records', icon: CalendarCheck },
    { name: 'Payments & Invoices', href: '/user/invoices', icon: FileText },
  ];

  const navItems = isAdmin ? adminNav : employeeNav;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-orange-600" /> : <Menu className="w-6 h-6" />}
              </button>
            )}

            <Link href={isAdmin ? '/admin' : '/user'} className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
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
                <div className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-orange-50 border border-orange-200 rounded-full text-[11px] sm:text-xs font-semibold text-orange-700">
                  <CreditCard className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-orange-600" />
                  <span className="hidden xs:inline">Due:</span>
                  <span className="text-orange-900 font-bold">Rs. {Number(user.outstandingBalance || 0).toFixed(2)}</span>
                </div>
              )}

              {/* User Profile Tag */}
              <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user.fullName}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 sm:p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-800">{user.fullName}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {isAdmin ? 'ADMINISTRATOR' : 'CUSTOMER'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Administration Menu' : 'My Account Navigation'}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 font-bold shadow-sm border border-orange-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};