import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { signupEnabled, freeTrialDays } from '@/lib/onboarding';
import { SignupForm } from '@/components/site/SignupForm';

export const dynamic = 'force-dynamic';

/**
 * Unlinked, noindexed account-setup route (Phase 2F). This is an operational
 * surface, not public magazine content: it is excluded from the sitemap, carries
 * no public marketing framing, and is no longer linked from `/login`. The form
 * and the signup API are UNCHANGED — account creation still works exactly as
 * before for anyone sent here directly.
 */
export const metadata: Metadata = {
  title: `Account setup — ${SITE_NAME}`,
  description: 'Internal account setup for ExploringToKnow operators and editorial staff.',
  alternates: { canonical: `${SITE_URL}/signup` },
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  const enabled = signupEnabled();
  const days = freeTrialDays();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="request-head">
          <span className="eyebrow">Account setup</span>
          <h1>Set up your account</h1>
          <p className="request-lede">
            Account setup for ExploringToKnow operators and editorial staff. Nothing is generated or published
            without a human review.
          </p>
        </div>

        {enabled ? (
          <SignupForm trialDays={days} />
        ) : (
          <div className="form">
            <div className="empty-panel" role="status">
              <span className="eyebrow">Not open</span>
              <h2>Account setup isn’t open</h2>
              <p>Accounts are arranged directly with the ExploringToKnow team. If you already have one, sign in below.</p>
              <div className="empty-panel-actions">
                <a href="/login" className="btn btn-ghost">Sign in</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
