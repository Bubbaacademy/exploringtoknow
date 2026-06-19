import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Brands } from './collections/Brands';
import { Categories } from './collections/Categories';
import { Products } from './collections/Products';
import { ProductIntelligence } from './collections/ProductIntelligence';
import { ContentBriefs } from './collections/ContentBriefs';
import { Articles } from './collections/Articles';
import { SocialPosts } from './collections/SocialPosts';
import { GenerationRuns } from './collections/GenerationRuns';
import { ProductRequests } from './collections/ProductRequests';
import { NewsletterSubscribers } from './collections/NewsletterSubscribers';
import { ContactMessages } from './collections/ContactMessages';
import { Authors } from './collections/Authors';
import { ArticleViews } from './collections/ArticleViews';
import { Tenants } from './collections/Tenants';
import { Workspaces } from './collections/Workspaces';
import { Memberships } from './collections/Memberships';
import { WorkspaceInvitations } from './collections/WorkspaceInvitations';
import { BrandProfiles } from './collections/BrandProfiles';
import { BrandAssets } from './collections/BrandAssets';
import { LandingPages } from './collections/LandingPages';
import { LandingPageViews } from './collections/LandingPageViews';
import { BrandProfileGlobal } from './globals/BrandProfile';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Payload CMS — content & catalog source of truth.
 * Phase 1: catalog (Products + 8 offer types), AI-pipeline collections
 * (ProductIntelligence, ContentBriefs, Articles, SocialPosts), and taxonomy.
 */
export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    // Brand the browser tab. Global admin CSS is injected via a scoped import in
    // app/(payload)/layout.tsx (Payload 3.85.1 has no admin.css config key).
    meta: { titleSuffix: ' · ExploringToKnow Ops' },
  },
  collections: [
    Tenants, Workspaces, Memberships, WorkspaceInvitations,
    BrandProfiles, BrandAssets, LandingPages, LandingPageViews,
    Users, Media, Brands, Categories, Authors,
    Products, ProductIntelligence, ContentBriefs, Articles, SocialPosts, GenerationRuns,
    ProductRequests, NewsletterSubscribers, ContactMessages, ArticleViews,
  ],
  globals: [BrandProfileGlobal],
  editor: lexicalEditor({}),
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
});
