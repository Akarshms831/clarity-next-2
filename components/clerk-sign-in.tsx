'use client';

import { SignIn } from '@clerk/nextjs';

export default function AppSignIn() {
  return (
    <section className="cl-rootBox" aria-label="Sign in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
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
