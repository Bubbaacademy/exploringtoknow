import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 28 — Manual performance / measurement foundation. ADDITIVE + IDEMPOTENT.
 * Creates the NEW workspace-scoped performance_entries table (+4 enums, indexes,
 * ad-campaign/ad-creative/landing-page/social-post/product/request/article/user/
 * tenant/workspace FKs, and the payload_locked_documents_rels column). No existing
 * table or data is touched. Re-runnable: guarded CREATE TYPE, IF NOT EXISTS, guarded FKs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN CREATE TYPE "public"."enum_performance_entries_source_type" AS ENUM('manual_entry','csv_paste','internal_landing_page_views','placeholder'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_performance_entries_platform" AS ENUM('meta','google_search','google_display','youtube','tiktok','linkedin','pinterest','instagram','facebook','x_twitter','generic','unknown'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_performance_entries_channel_type" AS ENUM('ad','social','landing_page','article','product','email_placeholder','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_performance_entries_status" AS ENUM('draft','recorded','archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "performance_entries" (
      "id" serial PRIMARY KEY NOT NULL,
      "source_type" "enum_performance_entries_source_type" DEFAULT 'manual_entry' NOT NULL,
      "platform" "enum_performance_entries_platform" DEFAULT 'generic' NOT NULL,
      "channel_type" "enum_performance_entries_channel_type" DEFAULT 'generic' NOT NULL,
      "status" "enum_performance_entries_status" DEFAULT 'recorded' NOT NULL,
      "entry_date" varchar, "entry_date_end" varchar,
      "campaign_name" varchar, "ad_set_name" varchar, "creative_name" varchar,
      "impressions" numeric DEFAULT 0, "clicks" numeric DEFAULT 0, "spend" numeric DEFAULT 0,
      "conversions" numeric DEFAULT 0, "orders" numeric DEFAULT 0, "revenue" numeric DEFAULT 0,
      "leads" numeric DEFAULT 0, "add_to_cart" numeric DEFAULT 0,
      "currency" varchar DEFAULT 'USD', "notes" varchar, "import_batch_id" varchar,
      "related_ad_campaign_id" integer, "related_ad_creative_id" integer, "related_landing_page_id" integer,
      "related_social_post_id" integer, "related_product_id" integer, "related_request_id" integer, "related_article_id" integer,
      "created_by_id" integer, "updated_by_id" integer, "tenant_id" integer, "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "performance_entries_source_type_idx" ON "performance_entries" USING btree ("source_type");
    CREATE INDEX IF NOT EXISTS "performance_entries_platform_idx" ON "performance_entries" USING btree ("platform");
    CREATE INDEX IF NOT EXISTS "performance_entries_channel_type_idx" ON "performance_entries" USING btree ("channel_type");
    CREATE INDEX IF NOT EXISTS "performance_entries_status_idx" ON "performance_entries" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "performance_entries_entry_date_idx" ON "performance_entries" USING btree ("entry_date");
    CREATE INDEX IF NOT EXISTS "performance_entries_import_batch_id_idx" ON "performance_entries" USING btree ("import_batch_id");
    CREATE INDEX IF NOT EXISTS "performance_entries_related_ad_campaign_idx" ON "performance_entries" USING btree ("related_ad_campaign_id");
    CREATE INDEX IF NOT EXISTS "performance_entries_related_landing_page_idx" ON "performance_entries" USING btree ("related_landing_page_id");
    CREATE INDEX IF NOT EXISTS "performance_entries_related_product_idx" ON "performance_entries" USING btree ("related_product_id");
    CREATE INDEX IF NOT EXISTS "performance_entries_tenant_idx" ON "performance_entries" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "performance_entries_workspace_idx" ON "performance_entries" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "performance_entries_created_at_idx" ON "performance_entries" USING btree ("created_at");

    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_related_ad_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("related_ad_campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_related_ad_creative_id_ad_creatives_id_fk" FOREIGN KEY ("related_ad_creative_id") REFERENCES "public"."ad_creatives"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_related_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("related_landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_related_social_post_id_social_studio_posts_id_fk" FOREIGN KEY ("related_social_post_id") REFERENCES "public"."social_studio_posts"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_related_request_id_product_requests_id_fk" FOREIGN KEY ("related_request_id") REFERENCES "public"."product_requests"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_related_article_id_articles_id_fk" FOREIGN KEY ("related_article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "performance_entries" ADD CONSTRAINT "performance_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "performance_entries_id" integer;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_performance_entries_fk" FOREIGN KEY ("performance_entries_id") REFERENCES "public"."performance_entries"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_performance_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("performance_entries_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "performance_entries_id";
    DROP TABLE IF EXISTS "performance_entries";
    DROP TYPE IF EXISTS "public"."enum_performance_entries_status";
    DROP TYPE IF EXISTS "public"."enum_performance_entries_channel_type";
    DROP TYPE IF EXISTS "public"."enum_performance_entries_platform";
    DROP TYPE IF EXISTS "public"."enum_performance_entries_source_type";`)
}
