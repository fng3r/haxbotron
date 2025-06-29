import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import SnackBarProviderWrapper from '@/components/Notifications/SnackBarProviderWrapper';

import { WSocketProvider } from '@/context/ws';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import ThemeProvider from '@/providers/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Haxbotron Admin Dashboard',
  description: 'Administrative dashboard for Haxbotron',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <WSocketProvider>
              <SnackBarProviderWrapper />
              {children}
            </WSocketProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
