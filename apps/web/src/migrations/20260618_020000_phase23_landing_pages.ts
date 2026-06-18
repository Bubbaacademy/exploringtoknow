import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 23 — Landing Pages foundation. ADDITIVE + IDEMPOTENT.
 * Creates the NEW workspace-scoped landing_pages table (+enums, indexes, a
 * per-workspace unique slug index, tenant/workspace/product/request/user FKs, and
 * the payload_locked_documents_rels column). No existing table or data is touched.
 * Re-runnable: guarded CREATE TYPE, IF NOT EXISTS everywhere, guarded FKs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_landing_pages_status" AS ENUM('draft', 'ready_for_review', 'published', 'archived');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_landing_pages_page_type" AS ENUM('affiliate_bridge', 'product_promo', 'lead_capture_placeholder', 'general');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "landing_pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar,
      "status" "enum_landing_pages_status" DEFAULT 'draft' NOT NULL,
      "page_type" "enum_landing_pages_page_type" DEFAULT 'general' NOT NULL,
      "headline" varchar,
      "subheadline" varchar,
      "body" varchar,
      "cta_label" varchar,
      "cta_url" varchar,
      "disclosure_text" varchar,
      "seo_title" varchar,
      "seo_description" varchar,
      "noindex" boolean DEFAULT true,
      "published_at" timestamp(3) with time zone,
      "related_product_id" integer,
      "related_request_id" integer,
      "created_by_id" integer,
      "updated_by_id" integer,
      "tenant_id" integer,
      "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "landing_pages_slug_idx" ON "landing_pages" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "landing_pages_status_idx" ON "landing_pages" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "landing_pages_page_type_idx" ON "landing_pages" USING btree ("page_type");
    CREATE INDEX IF NOT EXISTS "landing_pages_related_product_idx" ON "landing_pages" USING btree ("related_product_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_related_request_idx" ON "landing_pages" USING btree ("related_request_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_tenant_idx" ON "landing_pages" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_workspace_idx" ON "landing_pages" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_updated_at_idx" ON "landing_pages" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "landing_pages_created_at_idx" ON "landing_pages" USING btree ("created_at");
    -- Per-workspace slug uniqueness (NULL workspace rows are treated distinct, which is fine).
    CREATE UNIQUE INDEX IF NOT EXISTS "landing_pages_workspace_slug_unique" ON "landing_pages" USING btree ("workspace_id", "slug");

    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_related_request_id_product_requests_id_fk" FOREIGN KEY ("related_request_id") REFERENCES "public"."product_requests"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "landing_pages_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_landing_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("landing_pages_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "landing_pages_id";
    DROP TABLE IF EXISTS "landing_pages";
    DROP TYPE IF EXISTS "public"."enum_landing_pages_page_type";
    DROP TYPE IF EXISTS "public"."enum_landing_pages_status";`)
}
