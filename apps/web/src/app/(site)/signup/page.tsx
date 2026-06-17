import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { signupEnabled, freeTrialDays } from '@/lib/onboarding';
import { SignupForm } from '@/components/site/SignupForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Start your workspace — ${SITE_NAME}`,
  description: 'Create an AI-assisted content-commerce workspace for your brand. You review and approve everything — nothing publishes automatically.',
  alternates: { canonical: `${SITE_URL}/signup` },
};

export default function SignupPage() {
  const enabled = signupEnabled();
  const days = freeTrialDays();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="request-head">
          <span className="eyebrow">Get started</span>
          <h1>Create your content-commerce workspace</h1>
          <p className="request-lede">
            Launch an AI-assisted publication for your brand. You review and approve everything —
            nothing is generated or published without you. No hype, no fake claims.
          </p>
          <ul className="request-trust">
            <li>Free {days}-day trial</li>
            <li>No credit card</li>
            <li>You stay in control</li>
          </ul>
        </div>

        {enabled ? (
          <SignupForm trialDays={days} />
        ) : (
          <div className="form">
            <div className="empty-panel" role="status">
              <span className="eyebrow">Early access</span>
              <h2>Signups aren’t open yet</h2>
              <p>We’re onboarding founding workspaces by invitation. Tell us about your brand and we’ll be in touch.</p>
              <div className="empty-panel-actions">
                <a href="/contact" className="btn btn-accent">Request early access</a>
                <a href="/login" className="btn btn-ghost">Sign in</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
