import type { Metadata } from 'next';
import AppClerkProvider from '@/components/clerk-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clarity — Money, in focus',
  description: 'A sharper, calmer workspace for your salary, spending and monthly plan.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppClerkProvider>{children}</AppClerkProvider>
      </body>
    </html>
  );
}
