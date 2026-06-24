import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';

const SUPPORT_EMAIL = 'info@exploringtoknow.com';
const UPDATED = 'June 23, 2026';

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: `The terms that govern your use of ${SITE_NAME} — acceptable use, account responsibility, service availability, and limitation of liability.`,
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <article className="doc-page">
      <header className="doc-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <span aria-current="page">Terms of Service</span></nav>
        <span className="eyebrow">Terms</span>
        <h1>Terms of Service</h1>
        <p className="doc-lede">
          These terms govern your access to and use of {SITE_NAME}. By creating an account, joining a workspace, or
          otherwise using the platform, you agree to them.
        </p>
        <p className="doc-meta">Last updated: {UPDATED}</p>
      </header>

      <div className="prose">
        <h2>The service</h2>
        <p>
          {SITE_NAME} is a multi-tenant marketing platform that helps teams plan, produce, and measure marketing,
          including the ability to connect advertising accounts (such as Google Ads and Meta Ads) for read-only
          performance reporting. We may add, change, or remove features over time.
        </p>

        <h2>Account responsibility</h2>
        <ul>
          <li>You are responsible for the accuracy of your account information and for keeping your credentials secure.</li>
          <li>You are responsible for activity that occurs under your account and within workspaces you administer.</li>
          <li>You must have the authority to connect any advertising account you link, and to share its data with the platform.</li>
          <li>You must promptly notify us of any unauthorized use of your account at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</li>
        </ul>

        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Access, or attempt to access, data or workspaces that you are not authorized to use.</li>
          <li>Probe, scan, or test the vulnerability of the service, or breach or circumvent any security or authentication measures.</li>
          <li>Interfere with or disrupt the integrity or performance of the service, including through automated abuse, excessive requests, or denial-of-service activity.</li>
          <li>Use the service to store or transmit unlawful, infringing, deceptive, or malicious content.</li>
          <li>Reverse engineer or misuse the platform except to the extent permitted by applicable law.</li>
          <li>Violate the terms of any third-party provider whose account you connect, or use connected access for anything beyond the authorized scope.</li>
        </ul>

        <h2>Third-party providers</h2>
        <p>
          When you connect a third-party advertising account, your use of that provider is also governed by the
          provider’s own terms and policies. We request read-only access to start and do not modify your campaigns,
          budgets, or ads. You are responsible for maintaining your own standing with those providers.
        </p>

        <h2>Service availability</h2>
        <p>
          We work to keep the service reliable, but it is provided on an <strong>“as is” and “as available”</strong>
          {' '}basis. We do not warrant that the service will be uninterrupted, error-free, or that data synced from
          third-party providers will always be complete or available, since that depends on those providers and factors
          outside our control. We may perform maintenance, suspend features, or modify the service as needed.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {SITE_NAME} and its suppliers will not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, or
          goodwill, arising out of or related to your use of (or inability to use) the service. Our total liability for
          any claim relating to the service will not exceed the amount you paid us for the service in the twelve months
          preceding the claim. Some jurisdictions do not allow certain limitations, so some of these may not apply to
          you.
        </p>

        <h2>Suspension &amp; termination</h2>
        <p>
          You may stop using the service at any time and may disconnect any connected provider from the workspace
          Connections area. We may suspend or terminate access if these terms are violated, if required for security or
          legal reasons, or if necessary to protect the service or other customers. We aim to give reasonable notice
          where practical. Provisions that by their nature should survive termination (such as acceptable use,
          limitation of liability, and these general terms) will survive.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          We may update these terms as the product and our legal requirements evolve. Material changes will be reflected
          here with a new “last updated” date; continued use after changes take effect constitutes acceptance.
        </p>

        <h2>Contact us</h2>
        <p>
          Questions about these terms? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>

      <div className="doc-cta">
        <Link href="/privacy" className="btn btn-ghost">Privacy Policy</Link>
        <Link href="/data-deletion" className="btn btn-ghost">Data Deletion</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-accent">Contact support</a>
      </div>
    </article>
  );
}
