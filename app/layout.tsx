import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
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
        <ClerkProvider proxyUrl="/__clerk">{children}</ClerkProvider>
      </body>
    </html>
  );
}
