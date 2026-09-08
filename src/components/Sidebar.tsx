'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  ChefHat,
  PackageCheck,
  CreditCard,
  FileText,
  Users,
  History,
  PlusCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();

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
    <>
      {/* Desktop Persistent Docked Sidebar (Edge-to-Edge) */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-30 ${
          isCollapsed ? 'w-20 p-2.5' : 'w-64 p-4'
        }`}
      >
        <div className="space-y-4">
          {/* Header & Collapse Toggle */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'} pt-1`}>
            {!isCollapsed && (
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {isAdmin ? 'Administration' : 'My Account'}
              </span>
            )}
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 focus:outline-none"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`group relative flex items-center rounded-xl font-medium text-sm transition-all ${
                    isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold shadow-sm border border-emerald-200/80'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`shrink-0 w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}

                  {/* Floating Tooltip in Collapsed Mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      {item.name}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Card */}
        <div className="pt-3 border-t border-slate-100">
          {!isCollapsed ? (
            <div className="p-3 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-xl border border-slate-200/60 text-xs text-slate-500">
              <div className="flex items-center space-x-2 text-slate-800 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Tiffin System v1.0</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Secure meal tracking & instant UPI settlements.</p>
            </div>
          ) : (
            <div className="flex justify-center" title="Tiffin System v1.0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer (Responsive Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeMobile}
          />

          {/* Slide-in Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  {isAdmin ? 'Admin Console' : 'Customer Portal'}
                </span>
              </div>
              <button
                onClick={closeMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                {isAdmin ? 'Administration Menu' : 'My Account Navigation'}
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobile}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 text-center">
              Tiffin System &bull; Fast &bull; Secure &bull; Responsive
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;