import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ipTIME WOL Fast',
  description: 'Server-side ipTIME Wake-on-LAN dashboard',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    shortcut: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
  themeColor: '#000000',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
