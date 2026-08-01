import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/lib/DataContext';
import { SessionProvider } from '@/lib/SessionContext';
import { Toaster } from '@/components/ui/toaster';
import { NotificationManager } from '@/components/NotificationManager';
import { NotificationBell } from '@/components/NotificationBell';

export const metadata: Metadata = {
  title: 'GapLogic | Analyze Behavior-Intention Discrepancies',
  description: 'Novel AI-driven approach for enhancing lifestyle consistency.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const stored = localStorage.getItem('gaplogic-theme');
              if (stored === 'light' || (!stored && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
              }
              
              // Detect mobile app WebView environments
              const ua = navigator.userAgent || '';
              if (ua.includes('GapLogicAndroid') || ua.includes('GapLogicMobile') || window.Android) {
                document.documentElement.classList.add('is-webview');
              }
            } catch (_) {}
          })();
        `}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body selection:bg-primary/30 selection:text-primary bg-background antialiased min-h-screen overflow-y-auto">
        <SessionProvider>
          <DataProvider>
            {children}
            <Toaster />
            <NotificationManager />
            <div className="global-notification-bell fixed top-6 right-6 z-40 md:top-8 md:right-10">
              <NotificationBell />
            </div>
          </DataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
