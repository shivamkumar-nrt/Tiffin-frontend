import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { SidebarProvider } from '@/context/SidebarContext';
import GlobalApiLoader from '@/components/GlobalApiLoader';

export const metadata: Metadata = {
  title: 'Tiffin Service Management System',
  description: 'Digital Tiffin Management, Approvals, Daily Records, Payments & Invoices',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ToastProvider>
          <AuthProvider>
            <SidebarProvider>
              <GlobalApiLoader />
              {children}
            </SidebarProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}