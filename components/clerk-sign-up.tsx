'use client';

import dynamic from 'next/dynamic';

const SignUp = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.SignUp),
  {
    ssr: false,
    loading: () => <div className="cl-loading" role="status">Loading secure sign-up…</div>,
  },
);

export default function AppSignUp() {
  return (
    <section className="cl-rootBox" aria-label="Create account">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
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
