'use client';

import dynamic from 'next/dynamic';

const ClerkSignUp = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.SignUp),
  {
    ssr: false,
    loading: () => <div className="auth-loading" role="status">Loading secure sign-up…</div>,
  },
);

export default function AppSignUp() {
  return <ClerkSignUp routing="path" path="/sign-up" signInUrl="/sign-in" />;
}
