import AppSignUp from '@/components/clerk-sign-up';

export default function Page() {
  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/">
        <span className="brand-mark">c</span> clarity
      </a>
      <div className="auth-shell">
        <div className="auth-copy">
          <div className="eyebrow">A FRESH START</div>
          <h1>Build a better<br /><em>money rhythm.</em></h1>
          <p>Create your private workspace and bring a little more intention to everyday finances.</p>
        </div>
        <AppSignUp />
      </div>
    </main>
  );
}
