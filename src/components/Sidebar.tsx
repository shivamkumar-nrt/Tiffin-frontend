'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

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
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {isAdmin ? 'Administration' : 'My Account'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm border border-emerald-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-500">
        <div className="flex items-center space-x-2 text-slate-700 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Tiffin System v1.0</span>
        </div>
        <p className="text-[11px] text-slate-400">Audit-ready food records, combo packs & invoice management.</p>
      </div>
    </aside>
  );
};