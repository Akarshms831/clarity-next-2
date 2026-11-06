'use client';

import dynamic from 'next/dynamic';

const SignIn = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.SignIn),
  {
    ssr: false,
    loading: () => <div className="cl-loading" role="status">Loading secure sign-in…</div>,
  },
);

export default function AppSignIn() {
  return (
    <section className="cl-rootBox" aria-label="Sign in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
        fallback={<div className="cl-loading" role="status">Connecting to secure sign-in…</div>}
        appearance={{
          elements: {
            rootBox: { width: '100%' },
            card: { width: '100%', boxShadow: 'none', border: 'none' },
          },
        }}
      />
    </section>
  );
}
