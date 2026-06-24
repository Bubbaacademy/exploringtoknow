import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';

const SUPPORT_EMAIL = 'info@exploringtoknow.com';
const UPDATED = 'June 23, 2026';

export const metadata: Metadata = {
  title: `Data Deletion Instructions — ${SITE_NAME}`,
  description: `How to disconnect connected advertising accounts and request deletion of your data from ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/data-deletion` },
};

export default function DataDeletionPage() {
  return (
    <article className="doc-page">
      <header className="doc-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <span aria-current="page">Data Deletion</span></nav>
        <span className="eyebrow">Your data</span>
        <h1>Data Deletion Instructions</h1>
        <p className="doc-lede">
          You are in control of your data on {SITE_NAME}. You can disconnect any connected advertising account yourself,
          and you can request deletion of your data at any time.
        </p>
        <p className="doc-meta">Last updated: {UPDATED}</p>
      </header>

      <div className="prose">
        <h2>1. Disconnect a connected provider (self-service)</h2>
        <p>
          If you connected an advertising account such as <strong>Google Ads</strong> or <strong>Meta Ads</strong>, you
          can disconnect it yourself at any time:
        </p>
        <ol>
          <li>Sign in and open your workspace.</li>
          <li>Go to <strong>Connections</strong> (Provider Connections).</li>
          <li>Open the provider and choose <strong>Disconnect</strong> (or <strong>Remove</strong>).</li>
        </ol>
        <p>
          Disconnecting immediately revokes our stored access and clears the encrypted access tokens for that
          connection. Only a workspace owner or admin can manage connections. You may also revoke the platform’s access
          directly from your provider account (for example, in your Google or Meta account’s connected-apps settings).
        </p>

        <h2>2. Request deletion of your data</h2>
        <p>
          To request deletion of your account, a workspace, or specific data, email
          {' '}<a href={`mailto:${SUPPORT_EMAIL}?subject=Data%20Deletion%20Request`}>{SUPPORT_EMAIL}</a> from the email
          address associated with your account and tell us what you would like deleted (for example, your whole account,
          a specific workspace, or a connected ad account’s synced data). We may ask you to verify ownership before we
          proceed, to protect your data from unauthorized deletion.
        </p>

        <h2>What can be deleted</h2>
        <ul>
          <li><strong>Account information</strong> — your profile and login credentials.</li>
          <li><strong>Workspace content</strong> — landing pages, posts, campaigns, and related records you created.</li>
          <li><strong>Provider connections</strong> — encrypted access tokens and stored connection details.</li>
          <li><strong>Synced advertising data</strong> — ad-account identifiers, campaign metadata, and performance metrics synced into your workspace.</li>
        </ul>

        <h2>Response timeframe</h2>
        <p>
          We aim to acknowledge deletion requests promptly and to complete verified deletions within a reasonable period
          — typically within 30 days, and sooner where practical.
        </p>

        <h2>Retention exceptions</h2>
        <p>
          We may retain a limited subset of records for as long as necessary to meet legal, regulatory, security, fraud-
          prevention, or operational obligations (for example, records needed to comply with the law or to protect the
          integrity of the service). Any retained data remains protected under our
          {' '}<Link href="/privacy">Privacy Policy</Link> and is removed once those obligations no longer apply.
        </p>

        <h2>Need help?</h2>
        <p>
          If you have any trouble disconnecting a provider or want to confirm a deletion, contact us at
          {' '}<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we’ll assist you.
        </p>
      </div>

      <div className="doc-cta">
        <Link href="/privacy" className="btn btn-ghost">Privacy Policy</Link>
        <Link href="/terms" className="btn btn-ghost">Terms of Service</Link>
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Data%20Deletion%20Request`} className="btn btn-accent">Request deletion</a>
      </div>
    </article>
  );
}
