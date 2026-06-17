import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { LoginForm } from '@/components/site/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Sign in — ${SITE_NAME}`,
  description: 'Sign in to your workspace.',
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="request-head">
          <span className="eyebrow">Welcome back</span>
          <h1>Sign in</h1>
          <p className="request-lede">Access your workspace dashboard.</p>
        </div>
        <LoginForm />
      </div>
    </section>
  );
}
