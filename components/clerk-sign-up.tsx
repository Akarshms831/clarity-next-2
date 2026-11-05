'use client';

import { FormEvent, useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

type ClerkIssue = { longMessage?: string; message?: string };
function messageFrom(error: unknown) {
  const issues = (error as { errors?: ClerkIssue[] })?.errors;
  return issues?.[0]?.longMessage || issues?.[0]?.message || (error instanceof Error ? error.message : 'Please try again.');
}

export default function AppSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function finishIfComplete(status: string, sessionId?: string | null) {
    if (status === 'complete' && sessionId && setActive) {
      await setActive({ session: sessionId });
      router.replace('/dashboard');
      router.refresh();
      return true;
    }
    return false;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!isLoaded || !signUp) {
      setError('Secure sign-up is still loading. Please wait a moment and try again.');
      return;
    }
    setBusy(true);
    try {
      const result = await signUp.create({ emailAddress: email.trim(), password });
      if (await finishIfComplete(result.status, result.createdSessionId)) return;
      if (result.status === 'missing_requirements' || result.unverifiedFields?.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setVerifying(true);
      } else {
        setError('Your account needs an additional verification step that is not yet configured.');
      }
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!isLoaded || !signUp) {
      setError('Secure sign-up is still loading. Please try again.');
      return;
    }
    setBusy(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (!(await finishIfComplete(result.status, result.createdSessionId))) {
        setError('Verification is not complete yet. Check the code and try again.');
      }
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cl-rootBox" aria-label="Create account">
      <div className="cl-card" style={{ width: 'min(390px, 100%)', padding: 28 }}>
        <h2 style={{ fontSize: 22, margin: '0 0 8px', color: '#242438' }}>{verifying ? 'Verify your email' : 'Create your Clarity account'}</h2>
        <p style={{ color: '#888b9b', fontSize: 13, margin: '0 0 22px' }}>{verifying ? 'Enter the verification code we sent to your email.' : 'Your personal finances, securely in one place.'}</p>
        {!verifying ? (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <label className="field-label">Email address
              <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label className="field-label">Password
              <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </label>
            {error && <p role="alert" style={{ color: '#c34f58', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{error}</p>}
            <button className="button button-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>{busy ? 'Creating account…' : 'Create account'}</button>
          </form>
        ) : (
          <form onSubmit={verify} style={{ display: 'grid', gap: 14 }}>
            <label className="field-label">Email verification code
              <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e => setCode(e.target.value)} placeholder="Enter the code from your email" />
            </label>
            {error && <p role="alert" style={{ color: '#c34f58', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{error}</p>}
            <button className="button button-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>{busy ? 'Verifying…' : 'Verify email'}</button>
            <button className="button button-quiet" type="button" onClick={() => { setVerifying(false); setCode(''); setError(''); }}>Back</button>
          </form>
        )}
        {!verifying && error === '' && !isLoaded && <p style={{ color: '#999', fontSize: 10, textAlign: 'center', marginTop: 12 }}>Connecting to secure sign-up…</p>}
        <p style={{ color: '#888b9b', fontSize: 12, textAlign: 'center', margin: '18px 0 0' }}>Already registered? <a href="/sign-in" style={{ color: '#7772df', fontWeight: 700 }}>Sign in</a></p>
      </div>
    </section>
  );
}
