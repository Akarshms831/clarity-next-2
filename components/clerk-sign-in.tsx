'use client';

import dynamic from 'next/dynamic';

const ClerkSignIn = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.SignIn),
  {
    ssr: false,
    loading: () => <div className="auth-loading" role="status">Loading secure sign-in…</div>,
  },
);

export default function AppSignIn() {
  return <ClerkSignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />;
}
