import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 24 — Landing Page enrichment + analytics. ADDITIVE + IDEMPOTENT.
 * (1) Adds landing_pages.sections (jsonb) for structured sections — existing `body`
 *     is preserved and still rendered when there are no sections.
 * (2) Creates landing_page_views (mirrors article_views) for first-party view counts.
 * No existing data is touched. Re-runnable: IF NOT EXISTS / guarded FKs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "landing_pages" ADD COLUMN IF NOT EXISTS "sections" jsonb;

    CREATE TABLE IF NOT EXISTS "landing_page_views" (
      "id" serial PRIMARY KEY NOT NULL,
      "landing_page_id" integer NOT NULL,
      "tenant_id" integer,
      "workspace_id" integer,
      "view_date" varchar NOT NULL,
      "count" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "landing_page_views_landing_page_idx" ON "landing_page_views" USING btree ("landing_page_id");
    CREATE INDEX IF NOT EXISTS "landing_page_views_tenant_idx" ON "landing_page_views" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "landing_page_views_workspace_idx" ON "landing_page_views" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "landing_page_views_view_date_idx" ON "landing_page_views" USING btree ("view_date");
    CREATE INDEX IF NOT EXISTS "landing_page_views_updated_at_idx" ON "landing_page_views" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "landing_page_views_created_at_idx" ON "landing_page_views" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "landing_page_views" ADD CONSTRAINT "landing_page_views_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "landing_page_views" ADD CONSTRAINT "landing_page_views_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "landing_page_views" ADD CONSTRAINT "landing_page_views_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "landing_page_views_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landing_page_views_fk" FOREIGN KEY ("landing_page_views_id") REFERENCES "public"."landing_page_views"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_landing_page_views_id_idx" ON "payload_locked_documents_rels" USING btree ("landing_page_views_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "landing_page_views_id";
    DROP TABLE IF EXISTS "landing_page_views";
    ALTER TABLE "landing_pages" DROP COLUMN IF EXISTS "sections";`)
}
