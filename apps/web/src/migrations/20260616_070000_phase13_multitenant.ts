import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 13 — multi-tenant SaaS foundation. ADDITIVE + IDEMPOTENT ONLY.
 *
 * Adds the Tenants / Workspaces / Memberships tables, an additive nullable
 * `tenant_id` relationship column on every operational collection, then SEEDS the
 * ExploringToKnow tenant (slug `exploringtoknow`) + workspace (slug
 * `exploringtoknow`) + a platform_super_admin membership for the earliest user,
 * and BACKFILLS every existing operational row to that tenant.
 *
 * Safety properties:
 *  - No existing column/row is altered or deleted; new columns are nullable.
 *  - Re-runnable: CREATE TYPE guarded by duplicate_object, every table/column/index
 *    uses IF NOT EXISTS, every FK is guarded by duplicate_object, seeds use
 *    ON CONFLICT / WHERE NOT EXISTS, backfills run only WHERE tenant_id IS NULL.
 *  - Public published-article fingerprints are untouched (only a relational
 *    tenant_id is added/populated; no content, affiliate, or media field changes).
 *  - Media stays publicly readable (read access is unchanged in the collection).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ---- 1. Enums (idempotent) ----
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tenants_status" AS ENUM('active', 'trial', 'suspended', 'archived');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_workspaces_mode" AS ENUM('exploring_network', 'hosted', 'custom_domain_ready');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_workspaces_status" AS ENUM('active', 'inactive');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_memberships_role" AS ENUM('platform_super_admin', 'workspace_owner', 'workspace_admin', 'editor', 'viewer');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`)

  // ---- 2. New platform tables ----
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenants" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "status" "enum_tenants_status" DEFAULT 'active',
      "contact_name" varchar,
      "contact_email" varchar,
      "plan" varchar DEFAULT 'free',
      "trial_ends_at" timestamp(3) with time zone,
      "billing_customer_id" varchar,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "workspaces" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "mode" "enum_workspaces_mode" DEFAULT 'exploring_network',
      "primary_domain" varchar,
      "status" "enum_workspaces_status" DEFAULT 'active',
      "display_name" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "memberships" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "tenant_id" integer,
      "workspace_id" integer,
      "role" "enum_memberships_role" DEFAULT 'viewer' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );`)

  // ---- 3. Indexes for the new tables ----
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "tenants_status_idx" ON "tenants" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "tenants_created_at_idx" ON "tenants" USING btree ("created_at");

    CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_slug_idx" ON "workspaces" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "workspaces_tenant_idx" ON "workspaces" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "workspaces_mode_idx" ON "workspaces" USING btree ("mode");
    CREATE INDEX IF NOT EXISTS "workspaces_status_idx" ON "workspaces" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "workspaces_updated_at_idx" ON "workspaces" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "workspaces_created_at_idx" ON "workspaces" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "memberships_user_idx" ON "memberships" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "memberships_tenant_idx" ON "memberships" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "memberships_workspace_idx" ON "memberships" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "memberships_role_idx" ON "memberships" USING btree ("role");
    CREATE INDEX IF NOT EXISTS "memberships_updated_at_idx" ON "memberships" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "memberships_created_at_idx" ON "memberships" USING btree ("created_at");`)

  // ---- 4. FKs among the new tables (idempotent) ----
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;`)

  // ---- 5. payload_locked_documents_rels columns for admin doc-locking ----
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tenants_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "workspaces_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "memberships_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workspaces_fk" FOREIGN KEY ("workspaces_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_memberships_fk" FOREIGN KEY ("memberships_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_workspaces_id_idx" ON "payload_locked_documents_rels" USING btree ("workspaces_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_memberships_id_idx" ON "payload_locked_documents_rels" USING btree ("memberships_id");`)

  // ---- 6. Additive nullable tenant_id on every operational table (+FK +idx) ----
  // One block per table so each is independently idempotent.
  const tables = [
    'products', 'articles', 'product_requests', 'categories', 'authors',
    'newsletter_subscribers', 'contact_messages', 'generation_runs', 'article_views', 'media',
  ]
  for (const t of tables) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${t}"`)} ADD COLUMN IF NOT EXISTS "tenant_id" integer;
      DO $$ BEGIN
        ALTER TABLE ${sql.raw(`"${t}"`)} ADD CONSTRAINT ${sql.raw(`"${t}_tenant_id_tenants_id_fk"`)} FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      CREATE INDEX IF NOT EXISTS ${sql.raw(`"${t}_tenant_idx"`)} ON ${sql.raw(`"${t}"`)} USING btree ("tenant_id");`)
  }

  // ---- 7. Seed ETK tenant + workspace (idempotent) ----
  await db.execute(sql`
    INSERT INTO "tenants" ("name", "slug", "status", "plan", "updated_at", "created_at")
    VALUES ('ExploringToKnow', 'exploringtoknow', 'active', 'free', now(), now())
    ON CONFLICT ("slug") DO NOTHING;`)

  await db.execute(sql`
    INSERT INTO "workspaces" ("tenant_id", "name", "slug", "mode", "status", "display_name", "updated_at", "created_at")
    SELECT t.id, 'ETK Magazine', 'exploringtoknow', 'exploring_network', 'active', 'ExploringToKnow Magazine', now(), now()
    FROM "tenants" t WHERE t.slug = 'exploringtoknow'
    ON CONFLICT ("slug") DO NOTHING;`)

  // ---- 8. Seed a platform_super_admin membership for the earliest user ----
  // Tenant/workspace are derived server-side; this seed binds the existing owner.
  // No-op if there is no user yet, or if a super-admin membership already exists.
  await db.execute(sql`
    INSERT INTO "memberships" ("user_id", "tenant_id", "workspace_id", "role", "updated_at", "created_at")
    SELECT u.id, t.id, w.id, 'platform_super_admin', now(), now()
    FROM (SELECT id FROM "users" ORDER BY id ASC LIMIT 1) u
    CROSS JOIN (SELECT id FROM "tenants" WHERE slug = 'exploringtoknow') t
    LEFT JOIN (SELECT id FROM "workspaces" WHERE slug = 'exploringtoknow') w ON true
    WHERE NOT EXISTS (
      SELECT 1 FROM "memberships" m WHERE m.user_id = u.id AND m.role = 'platform_super_admin'
    );`)

  // ---- 9. Backfill every operational row to the ETK tenant (only where NULL) ----
  for (const t of tables) {
    await db.execute(sql`
      UPDATE ${sql.raw(`"${t}"`)}
      SET "tenant_id" = (SELECT id FROM "tenants" WHERE slug = 'exploringtoknow')
      WHERE "tenant_id" IS NULL;`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Reverse schema only. Seeded ETK rows live in the dropped tables.
  const tables = [
    'products', 'articles', 'product_requests', 'categories', 'authors',
    'newsletter_subscribers', 'contact_messages', 'generation_runs', 'article_views', 'media',
  ]
  for (const t of tables) {
    await db.execute(sql`ALTER TABLE ${sql.raw(`"${t}"`)} DROP COLUMN IF EXISTS "tenant_id";`)
  }
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tenants_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "workspaces_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "memberships_id";
    DROP TABLE IF EXISTS "memberships";
    DROP TABLE IF EXISTS "workspaces";
    DROP TABLE IF EXISTS "tenants";
    DROP TYPE IF EXISTS "public"."enum_memberships_role";
    DROP TYPE IF EXISTS "public"."enum_workspaces_status";
    DROP TYPE IF EXISTS "public"."enum_workspaces_mode";
    DROP TYPE IF EXISTS "public"."enum_tenants_status";`)
}
