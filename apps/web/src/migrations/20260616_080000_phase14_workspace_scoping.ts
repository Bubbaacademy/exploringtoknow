import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 14 — workspace scoping + tenant coverage completion. ADDITIVE + IDEMPOTENT.
 *
 * - Adds nullable `workspace_id` (+FK +idx) to the 10 Phase-13 tenant-scoped tables.
 * - Adds nullable `tenant_id` AND `workspace_id` (+FKs +idxs) to brands,
 *   content_briefs, product_intelligence, social_posts (had neither).
 * - Backfills every existing row to the ExploringToKnow tenant + ETK Magazine
 *   workspace (only WHERE the column is NULL).
 *
 * Columns stay nullable (new records are stamped by the stampTenantWorkspace hook;
 * the public site/worker use the Local API and are unaffected). Re-runnable: ADD
 * COLUMN IF NOT EXISTS, FK guarded by duplicate_object, idx IF NOT EXISTS,
 * UPDATE only WHERE NULL.
 */

const ADD_WORKSPACE = [
  'products', 'articles', 'product_requests', 'categories', 'authors',
  'newsletter_subscribers', 'contact_messages', 'generation_runs', 'article_views', 'media',
]

const ADD_BOTH = ['brands', 'content_briefs', 'product_intelligence', 'social_posts']

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. workspace_id on the 10 Phase-13 tables
  for (const t of ADD_WORKSPACE) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${t}"`)} ADD COLUMN IF NOT EXISTS "workspace_id" integer;
      DO $$ BEGIN
        ALTER TABLE ${sql.raw(`"${t}"`)} ADD CONSTRAINT ${sql.raw(`"${t}_workspace_id_workspaces_id_fk"`)} FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      CREATE INDEX IF NOT EXISTS ${sql.raw(`"${t}_workspace_idx"`)} ON ${sql.raw(`"${t}"`)} USING btree ("workspace_id");`)
  }

  // 2. tenant_id + workspace_id on the 4 tables that had neither
  for (const t of ADD_BOTH) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${t}"`)} ADD COLUMN IF NOT EXISTS "tenant_id" integer;
      ALTER TABLE ${sql.raw(`"${t}"`)} ADD COLUMN IF NOT EXISTS "workspace_id" integer;
      DO $$ BEGIN
        ALTER TABLE ${sql.raw(`"${t}"`)} ADD CONSTRAINT ${sql.raw(`"${t}_tenant_id_tenants_id_fk"`)} FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE ${sql.raw(`"${t}"`)} ADD CONSTRAINT ${sql.raw(`"${t}_workspace_id_workspaces_id_fk"`)} FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      CREATE INDEX IF NOT EXISTS ${sql.raw(`"${t}_tenant_idx"`)} ON ${sql.raw(`"${t}"`)} USING btree ("tenant_id");
      CREATE INDEX IF NOT EXISTS ${sql.raw(`"${t}_workspace_idx"`)} ON ${sql.raw(`"${t}"`)} USING btree ("workspace_id");`)
  }

  // 3. Backfill workspace on the 10 tables → ETK Magazine workspace
  for (const t of ADD_WORKSPACE) {
    await db.execute(sql`
      UPDATE ${sql.raw(`"${t}"`)}
      SET "workspace_id" = (SELECT id FROM "workspaces" WHERE slug = 'exploringtoknow')
      WHERE "workspace_id" IS NULL;`)
  }

  // 4. Backfill tenant + workspace on the 4 tables → ETK
  for (const t of ADD_BOTH) {
    await db.execute(sql`
      UPDATE ${sql.raw(`"${t}"`)}
      SET "tenant_id" = (SELECT id FROM "tenants" WHERE slug = 'exploringtoknow')
      WHERE "tenant_id" IS NULL;
      UPDATE ${sql.raw(`"${t}"`)}
      SET "workspace_id" = (SELECT id FROM "workspaces" WHERE slug = 'exploringtoknow')
      WHERE "workspace_id" IS NULL;`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const t of ADD_WORKSPACE) {
    await db.execute(sql`ALTER TABLE ${sql.raw(`"${t}"`)} DROP COLUMN IF EXISTS "workspace_id";`)
  }
  for (const t of ADD_BOTH) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${t}"`)} DROP COLUMN IF EXISTS "workspace_id";
      ALTER TABLE ${sql.raw(`"${t}"`)} DROP COLUMN IF EXISTS "tenant_id";`)
  }
}
