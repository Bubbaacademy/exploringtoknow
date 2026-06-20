import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 27 — Ads Studio v1 (manual campaign + creative drafts). ADDITIVE + IDEMPOTENT.
 * Creates two NEW workspace-scoped tables: ad_campaigns and ad_creatives (+enums,
 * indexes, product/request/landing-page/social-post/brand-profile/campaign/user/
 * tenant/workspace FKs, and payload_locked_documents_rels columns). No existing table
 * or data is touched. Re-runnable: guarded CREATE TYPE, IF NOT EXISTS, guarded FKs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN CREATE TYPE "public"."enum_ad_campaigns_status" AS ENUM('draft','ready_for_review','approved_to_export','archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_ad_campaigns_platform" AS ENUM('meta','google_search','google_display','youtube','tiktok','linkedin','pinterest','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_ad_campaigns_objective" AS ENUM('awareness','traffic','leads','sales','engagement','retargeting_placeholder','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_ad_creatives_status" AS ENUM('draft','ready_for_review','approved_to_export','archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_ad_creatives_platform" AS ENUM('meta','google_search','google_display','youtube','tiktok','linkedin','pinterest','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_ad_creatives_format" AS ENUM('text_ad','search_ad','image_ad_placeholder','carousel_placeholder','short_video_placeholder','display_ad_placeholder','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "ad_campaigns" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "status" "enum_ad_campaigns_status" DEFAULT 'draft' NOT NULL,
      "platform" "enum_ad_campaigns_platform" DEFAULT 'generic' NOT NULL,
      "objective" "enum_ad_campaigns_objective" DEFAULT 'generic' NOT NULL,
      "audience_name" varchar, "audience_notes" varchar, "geography_notes" varchar, "language_notes" varchar, "placement_notes" varchar,
      "budget_notes" varchar, "schedule_notes" varchar, "primary_cta" varchar, "destination_url" varchar,
      "utm_source" varchar, "utm_medium" varchar, "utm_campaign" varchar, "utm_content" varchar, "utm_term" varchar,
      "disclosure_text" varchar, "notes" varchar,
      "related_product_id" integer, "related_request_id" integer, "related_landing_page_id" integer,
      "related_social_post_id" integer, "related_brand_profile_id" integer,
      "exported_at" timestamp(3) with time zone, "export_count" numeric DEFAULT 0,
      "created_by_id" integer, "updated_by_id" integer, "tenant_id" integer, "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "ad_campaigns_status_idx" ON "ad_campaigns" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_platform_idx" ON "ad_campaigns" USING btree ("platform");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_objective_idx" ON "ad_campaigns" USING btree ("objective");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_related_product_idx" ON "ad_campaigns" USING btree ("related_product_id");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_related_request_idx" ON "ad_campaigns" USING btree ("related_request_id");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_related_landing_page_idx" ON "ad_campaigns" USING btree ("related_landing_page_id");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_related_social_post_idx" ON "ad_campaigns" USING btree ("related_social_post_id");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_related_brand_profile_idx" ON "ad_campaigns" USING btree ("related_brand_profile_id");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_tenant_idx" ON "ad_campaigns" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_workspace_idx" ON "ad_campaigns" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_updated_at_idx" ON "ad_campaigns" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_created_at_idx" ON "ad_campaigns" USING btree ("created_at");

    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_related_request_id_product_requests_id_fk" FOREIGN KEY ("related_request_id") REFERENCES "public"."product_requests"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_related_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("related_landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_related_social_post_id_social_studio_posts_id_fk" FOREIGN KEY ("related_social_post_id") REFERENCES "public"."social_studio_posts"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_related_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("related_brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "ad_creatives" (
      "id" serial PRIMARY KEY NOT NULL,
      "campaign_id" integer,
      "name" varchar NOT NULL,
      "status" "enum_ad_creatives_status" DEFAULT 'draft' NOT NULL,
      "platform" "enum_ad_creatives_platform" DEFAULT 'generic',
      "format" "enum_ad_creatives_format" DEFAULT 'text_ad',
      "headline" varchar, "primary_text" varchar, "description" varchar, "cta_label" varchar, "cta_url" varchar,
      "display_path" varchar, "keywords" varchar, "creative_notes" varchar, "disclosure_text" varchar,
      "related_social_post_id" integer, "related_landing_page_id" integer,
      "created_by_id" integer, "updated_by_id" integer, "tenant_id" integer, "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "ad_creatives_campaign_idx" ON "ad_creatives" USING btree ("campaign_id");
    CREATE INDEX IF NOT EXISTS "ad_creatives_status_idx" ON "ad_creatives" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "ad_creatives_platform_idx" ON "ad_creatives" USING btree ("platform");
    CREATE INDEX IF NOT EXISTS "ad_creatives_format_idx" ON "ad_creatives" USING btree ("format");
    CREATE INDEX IF NOT EXISTS "ad_creatives_related_social_post_idx" ON "ad_creatives" USING btree ("related_social_post_id");
    CREATE INDEX IF NOT EXISTS "ad_creatives_related_landing_page_idx" ON "ad_creatives" USING btree ("related_landing_page_id");
    CREATE INDEX IF NOT EXISTS "ad_creatives_tenant_idx" ON "ad_creatives" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "ad_creatives_workspace_idx" ON "ad_creatives" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "ad_creatives_updated_at_idx" ON "ad_creatives" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "ad_creatives_created_at_idx" ON "ad_creatives" USING btree ("created_at");

    DO $$ BEGIN ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_related_social_post_id_social_studio_posts_id_fk" FOREIGN KEY ("related_social_post_id") REFERENCES "public"."social_studio_posts"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_related_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("related_landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ad_campaigns_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ad_creatives_id" integer;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ad_campaigns_fk" FOREIGN KEY ("ad_campaigns_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ad_creatives_fk" FOREIGN KEY ("ad_creatives_id") REFERENCES "public"."ad_creatives"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_ad_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("ad_campaigns_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_ad_creatives_id_idx" ON "payload_locked_documents_rels" USING btree ("ad_creatives_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "ad_creatives_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "ad_campaigns_id";
    DROP TABLE IF EXISTS "ad_creatives";
    DROP TABLE IF EXISTS "ad_campaigns";
    DROP TYPE IF EXISTS "public"."enum_ad_creatives_format";
    DROP TYPE IF EXISTS "public"."enum_ad_creatives_platform";
    DROP TYPE IF EXISTS "public"."enum_ad_creatives_status";
    DROP TYPE IF EXISTS "public"."enum_ad_campaigns_objective";
    DROP TYPE IF EXISTS "public"."enum_ad_campaigns_platform";
    DROP TYPE IF EXISTS "public"."enum_ad_campaigns_status";`)
}
