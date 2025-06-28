import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { CssBaseline } from '@mui/material';

import SnackBarProviderWrapper from '@/components/Notifications/SnackBarProviderWrapper';

import { WSocketProvider } from '@/context/ws';
import ThemeProvider from '@/providers/MUIThemeProvider';
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
        <ThemeProvider>
          <CssBaseline />

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
