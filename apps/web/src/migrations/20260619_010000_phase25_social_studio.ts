import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 25 — Social Studio foundation. ADDITIVE + IDEMPOTENT.
 * Creates the NEW workspace-scoped social_studio_posts table (+enums, indexes,
 * product/request/landing-page/brand-profile/user/tenant/workspace FKs, and the
 * payload_locked_documents_rels column). This is a SEPARATE collection from the
 * legacy `social_posts` table (the AI/worker FB+IG pipeline), which is NOT touched.
 * No existing table or data is altered. Re-runnable: guarded CREATE TYPE,
 * IF NOT EXISTS everywhere, guarded FKs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_social_studio_posts_channel" AS ENUM('instagram', 'tiktok', 'youtube_shorts', 'linkedin', 'facebook', 'x_twitter', 'pinterest', 'generic');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_social_studio_posts_format" AS ENUM('text', 'image_post', 'carousel_placeholder', 'short_video_placeholder', 'story_placeholder', 'reel_placeholder');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_social_studio_posts_status" AS ENUM('draft', 'ready_for_review', 'approved_to_copy', 'archived');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "social_studio_posts" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "channel" "enum_social_studio_posts_channel" DEFAULT 'generic' NOT NULL,
      "format" "enum_social_studio_posts_format" DEFAULT 'text' NOT NULL,
      "status" "enum_social_studio_posts_status" DEFAULT 'draft' NOT NULL,
      "hook" varchar,
      "caption" varchar,
      "hashtags" jsonb,
      "cta_label" varchar,
      "cta_url" varchar,
      "disclosure_text" varchar,
      "platform_notes" varchar,
      "notes" varchar,
      "related_product_id" integer,
      "related_request_id" integer,
      "related_landing_page_id" integer,
      "related_brand_profile_id" integer,
      "approved_at" timestamp(3) with time zone,
      "copy_count" numeric DEFAULT 0,
      "copied_at" timestamp(3) with time zone,
      "created_by_id" integer,
      "updated_by_id" integer,
      "tenant_id" integer,
      "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "social_studio_posts_channel_idx" ON "social_studio_posts" USING btree ("channel");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_format_idx" ON "social_studio_posts" USING btree ("format");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_status_idx" ON "social_studio_posts" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_related_product_idx" ON "social_studio_posts" USING btree ("related_product_id");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_related_request_idx" ON "social_studio_posts" USING btree ("related_request_id");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_related_landing_page_idx" ON "social_studio_posts" USING btree ("related_landing_page_id");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_related_brand_profile_idx" ON "social_studio_posts" USING btree ("related_brand_profile_id");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_tenant_idx" ON "social_studio_posts" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_workspace_idx" ON "social_studio_posts" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_updated_at_idx" ON "social_studio_posts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_created_at_idx" ON "social_studio_posts" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_related_request_id_product_requests_id_fk" FOREIGN KEY ("related_request_id") REFERENCES "public"."product_requests"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_related_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("related_landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_related_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("related_brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "social_studio_posts_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_studio_posts_fk" FOREIGN KEY ("social_studio_posts_id") REFERENCES "public"."social_studio_posts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_social_studio_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("social_studio_posts_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "social_studio_posts_id";
    DROP TABLE IF EXISTS "social_studio_posts";
    DROP TYPE IF EXISTS "public"."enum_social_studio_posts_status";
    DROP TYPE IF EXISTS "public"."enum_social_studio_posts_format";
    DROP TYPE IF EXISTS "public"."enum_social_studio_posts_channel";`)
}
