import type { Metadata } from 'next';
import { Nunito, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { SidebarProvider } from '@/context/SidebarContext';
import GlobalApiLoader from '@/components/GlobalApiLoader';
import { GoldenBackdrop } from '@/components/three';
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
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${body.variable} ${display.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('tiffin_theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-screen text-stone-900 antialiased">
        <ToastProvider>
          <AuthProvider>
            <SidebarProvider>
              <GoldenBackdrop />
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