import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/lib/DataContext';
import { SessionProvider } from '@/lib/SessionContext';
import { Toaster } from '@/components/ui/toaster';

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body selection:bg-primary/30 selection:text-primary bg-background antialiased min-h-screen overflow-y-auto">
        <SessionProvider>
          <DataProvider>
            {children}
            <Toaster />
          </DataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
