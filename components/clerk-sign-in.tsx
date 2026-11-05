'use client';

import { FormEvent, useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function AppSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace('/dashboard');
        router.refresh();
      } else {
        setError('Your account needs an additional verification step. Please use the verification option from your Clerk sign-in settings.');
      }
    } catch (err) {
      const clerkError = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      setError(clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || 'Unable to sign in. Please check your details and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cl-rootBox" aria-label="Sign in">
      <div className="cl-card" style={{ width: 'min(390px, 100%)', padding: 28 }}>
        <h2 style={{ fontSize: 22, margin: '0 0 8px', color: '#242438' }}>Sign in to Clarity</h2>
        <p style={{ color: '#888b9b', fontSize: 13, margin: '0 0 22px' }}>Use the email and password for your account.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <label className="field-label">Email address
            <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="field-label">Password
            <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
          </label>
          {error && <p role="alert" style={{ color: '#c34f58', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{error}</p>}
          <button className="button button-primary" type="submit" disabled={!isLoaded || busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ color: '#888b9b', fontSize: 12, textAlign: 'center', margin: '18px 0 0' }}>
          New to Clarity? <a href="/sign-up" style={{ color: '#7772df', fontWeight: 700 }}>Create an account</a>
        </p>
      </div>
    </section>
  );
}
