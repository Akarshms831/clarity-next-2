import type { Metadata } from 'next';
import AppClerkProvider from '@/components/clerk-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clarity — Personal Finance',
  description: 'A calmer, clearer way to manage your money.',
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
