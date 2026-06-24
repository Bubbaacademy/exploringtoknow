import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';

const SUPPORT_EMAIL = 'info@exploringtoknow.com';
const UPDATED = 'June 23, 2026';

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses, secures, and lets you control your data — including workspace information and read-only advertising connections such as Google Ads and Meta Ads.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <article className="doc-page">
      <header className="doc-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <span aria-current="page">Privacy Policy</span></nav>
        <span className="eyebrow">Privacy</span>
        <h1>Privacy Policy</h1>
        <p className="doc-lede">
          {SITE_NAME} is a multi-tenant marketing platform. This policy explains what data we collect, how we use and
          protect it, and the controls you have — including for the advertising accounts you choose to connect.
        </p>
        <p className="doc-meta">Last updated: {UPDATED}</p>
      </header>

      <div className="prose">
        <h2>Who we are</h2>
        <p>
          {SITE_NAME} (“we”, “us”) provides a software-as-a-service platform for planning, producing, and measuring
          marketing — including landing pages, social and ad content, and performance reporting. Each customer works
          inside their own isolated <strong>workspace</strong>; data in one workspace is never shared with another.
        </p>

        <h2>Data we collect</h2>
        <h3>Account &amp; workspace information</h3>
        <p>
          When you create an account or are invited to a workspace, we store your name, email address, hashed
          credentials, role, and the workspace(s) you belong to. We also store the content you create in the platform
          (such as landing pages, posts, campaigns, and notes) and basic usage records needed to operate the service.
        </p>
        <h3>Provider connection data (OAuth)</h3>
        <p>
          You may connect third-party advertising accounts — for example <strong>Google Ads</strong> and
          {' '}<strong>Meta Ads</strong> — using each provider’s official OAuth flow. When you do, we store the
          encrypted access tokens the provider issues, along with non-sensitive connection details such as the provider
          name, the ad-account identifiers you authorize, the account display name, currency, and time zone. We request
          <strong> read-only</strong> access to start. We never ask for, see, or store your provider username or
          password, and we never display provider tokens to you or anyone else.
        </p>
        <h3>Advertising &amp; performance analytics</h3>
        <p>
          For accounts you connect, we read campaign metadata and performance metrics (such as impressions, clicks,
          spend, and conversions) and store them in your workspace, clearly labeled as provider-synced data. We also
          record first-party analytics for pages you publish through the platform. We do not fabricate metrics — numbers
          are either measured, provider-reported, or clearly shown as empty.
        </p>
        <h3>Technical data</h3>
        <p>
          Like most online services, our infrastructure processes standard technical information (such as IP address,
          browser type, and request logs) to keep the service secure, reliable, and available.
        </p>

        <h2>How we use your data</h2>
        <ul>
          <li>To provide the platform — authentication, workspaces, content, and reporting.</li>
          <li>To sync read-only performance data from advertising accounts you explicitly connect.</li>
          <li>To secure the service, prevent abuse, debug issues, and maintain reliability.</li>
          <li>To communicate with you about your account, support requests, and important service notices.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your personal data, and we do not share one customer’s data with another. We
          use connected-provider data only to provide reporting and features inside your own workspace.
        </p>

        <h2>How we protect your data</h2>
        <p>
          Provider access tokens are <strong>encrypted at rest</strong> using authenticated encryption (AES-256-GCM) and
          are scoped to the workspace that created the connection. Tokens are never logged, never returned to the
          browser, and never shown in the interface. Access to workspace data is enforced on the server based on your
          membership and role; identifiers supplied by the browser can never grant cross-workspace access.
        </p>

        <h2>Your controls</h2>
        <ul>
          <li><strong>Disconnect a provider</strong> at any time from the workspace’s Connections area — this revokes our stored access and clears the encrypted tokens.</li>
          <li><strong>Access or correct</strong> your account information from your settings, or by contacting us.</li>
          <li><strong>Request deletion</strong> of your data — see our <Link href="/data-deletion">Data Deletion Instructions</Link>.</li>
        </ul>

        <h2>Data retention</h2>
        <p>
          We keep your data for as long as your account or workspace is active, and for a reasonable period afterward
          where needed to meet legal, security, or operational obligations. When you disconnect a provider or close a
          workspace, associated tokens and synced data are removed or scheduled for removal, subject to those limited
          retention needs.
        </p>

        <h2>Third-party providers</h2>
        <p>
          When you connect an advertising account, your use of that provider remains subject to the provider’s own terms
          and privacy policy (for example, Google and Meta). We access only the read-only scopes you authorize and make
          no changes to your campaigns, budgets, or ads.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy as the product evolves. Material changes will be reflected here with a new “last
          updated” date.
        </p>

        <h2>Contact us</h2>
        <p>
          Questions about privacy or your data? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we’ll
          be glad to help.
        </p>
      </div>

      <div className="doc-cta">
        <Link href="/terms" className="btn btn-ghost">Terms of Service</Link>
        <Link href="/data-deletion" className="btn btn-ghost">Data Deletion</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-accent">Contact support</a>
      </div>
    </article>
  );
}
