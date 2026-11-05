'use client';

import { FormEvent, useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

type ClerkIssue = { longMessage?: string; message?: string };
function messageFrom(error: unknown) {
  const issues = (error as { errors?: ClerkIssue[] })?.errors;
  return issues?.[0]?.longMessage || issues?.[0]?.message || (error instanceof Error ? error.message : 'Please try again.');
}

export default function AppSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!isLoaded || !signIn) {
      setError('Secure sign-in is still loading. Please wait a moment and try again.');
      return;
    }
    setBusy(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace('/dashboard');
        router.refresh();
        return;
      }
      if (result.status === 'needs_second_factor') {
        setError('This account requires an additional verification step. Contact the site administrator to enable the matching verification method.');
      } else {
        setError('Sign-in needs an additional step that is not yet configured for this page.');
      }
    } catch (err) {
      setError(messageFrom(err));
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
          <button className="button button-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', cursor: busy ? 'wait' : 'pointer' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ color: '#888b9b', fontSize: 12, textAlign: 'center', margin: '18px 0 0' }}>
          New to Clarity? <a href="/sign-up" style={{ color: '#7772df', fontWeight: 700 }}>Create an account</a>
        </p>
        {!isLoaded && <p style={{ color: '#999', fontSize: 10, textAlign: 'center', marginTop: 12 }}>Connecting to secure sign-in…</p>}
      </div>
    </section>
  );
}
