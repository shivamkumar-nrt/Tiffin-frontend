import type { Metadata } from 'next';
import { Nunito, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { SidebarProvider } from '@/context/SidebarContext';
import GlobalApiLoader from '@/components/GlobalApiLoader';
import PushNotificationManager from '@/components/PushNotificationManager';

const body = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const display = Poppins({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Tiffin System | Ghar Jaisa Khana',
  description: 'Digital Tiffin Management, Approvals, Daily Records, Payments & Invoices',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-screen text-stone-900 antialiased">
        <ToastProvider>
          <AuthProvider>
            <SidebarProvider>
              <PushNotificationManager />
              <GlobalApiLoader />
              {children}
            </SidebarProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}