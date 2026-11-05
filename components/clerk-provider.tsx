'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const ClerkProviderClient = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.ClerkProvider),
  { ssr: false },
);

export default function AppClerkProvider({ children }: { children: ReactNode }) {
  return <ClerkProviderClient proxyUrl="/__clerk">{children}</ClerkProviderClient>;
}
