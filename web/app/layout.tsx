import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { CssBaseline } from '@mui/material';

import SnackBarProviderWrapper from '@/components/Notifications/SnackBarProviderWrapper';
import Footer from '@/components/common/Footer';

import { WSocketProvider } from '@/context/ws';
import ReactQueryProvider from '@/providers/ReactQueryProvider';

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
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <CssBaseline />

        <ReactQueryProvider>
          <WSocketProvider>
            <SnackBarProviderWrapper />
            {children}
            <Footer />
          </WSocketProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
