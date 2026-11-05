'use client';

import { SignUp } from '@clerk/nextjs';

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
