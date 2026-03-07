import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ipTIME WOL Fast',
  description: 'Server-side ipTIME Wake-on-LAN dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
