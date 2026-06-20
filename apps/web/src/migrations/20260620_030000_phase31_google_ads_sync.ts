import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 31 — Google Ads Read Sync v1. ADDITIVE + IDEMPOTENT.
 * Creates two NEW workspace-scoped tables: provider_accounts (ad accounts discovered
 * under a connection — read-only identity, no tokens) and synced_performance_daily
 * (normalized read-only metrics, source = api_synced). +enums, indexes, connection/
 * account/sync-run/tenant/workspace FKs, and payload_locked_documents_rels columns.
 * No existing table or data is touched (manual performance-entries untouched).
 * Re-runnable: guarded CREATE TYPE, IF NOT EXISTS, guarded FKs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Phase 31 additive: sync date-window columns on the Phase-30 provider_sync_runs table.
    ALTER TABLE "provider_sync_runs" ADD COLUMN IF NOT EXISTS "window_start" varchar;
    ALTER TABLE "provider_sync_runs" ADD COLUMN IF NOT EXISTS "window_end" varchar;

    DO $$ BEGIN CREATE TYPE "public"."enum_provider_accounts_provider" AS ENUM('google_ads','meta_ads','tiktok_ads','linkedin_ads','pinterest_ads','microsoft_ads','amazon_ads','x_ads','snapchat_ads','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_provider_accounts_status" AS ENUM('active','inactive','unknown'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_synced_performance_daily_provider" AS ENUM('google_ads','meta_ads','tiktok_ads','linkedin_ads','pinterest_ads','microsoft_ads','amazon_ads','x_ads','snapchat_ads','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_synced_performance_daily_source" AS ENUM('api_synced'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "provider_accounts" (
      "id" serial PRIMARY KEY NOT NULL,
      "provider" "enum_provider_accounts_provider" DEFAULT 'google_ads' NOT NULL,
      "provider_connection_id" integer,
      "provider_account_id" varchar, "provider_account_name" varchar, "manager_customer_id" varchar,
      "currency_code" varchar, "time_zone" varchar,
      "status" "enum_provider_accounts_status" DEFAULT 'active',
      "selected" boolean DEFAULT false, "last_fetched_at" timestamp(3) with time zone,
      "tenant_id" integer, "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "provider_accounts_provider_idx" ON "provider_accounts" USING btree ("provider");
    CREATE INDEX IF NOT EXISTS "provider_accounts_provider_connection_idx" ON "provider_accounts" USING btree ("provider_connection_id");
    CREATE INDEX IF NOT EXISTS "provider_accounts_provider_account_id_idx" ON "provider_accounts" USING btree ("provider_account_id");
    CREATE INDEX IF NOT EXISTS "provider_accounts_status_idx" ON "provider_accounts" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "provider_accounts_tenant_idx" ON "provider_accounts" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "provider_accounts_workspace_idx" ON "provider_accounts" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "provider_accounts_created_at_idx" ON "provider_accounts" USING btree ("created_at");
    DO $$ BEGIN ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_provider_connection_id_provider_connections_id_fk" FOREIGN KEY ("provider_connection_id") REFERENCES "public"."provider_connections"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "synced_performance_daily" (
      "id" serial PRIMARY KEY NOT NULL,
      "provider" "enum_synced_performance_daily_provider" DEFAULT 'google_ads' NOT NULL,
      "provider_connection_id" integer, "provider_account_id" integer, "customer_id" varchar,
      "metric_date" varchar NOT NULL,
      "campaign_id" varchar, "campaign_name" varchar, "campaign_status" varchar, "campaign_channel_type" varchar,
      "ad_group_id" varchar, "ad_group_name" varchar, "ad_id" varchar, "ad_name" varchar, "ad_type" varchar, "final_url" varchar,
      "impressions" numeric DEFAULT 0, "clicks" numeric DEFAULT 0, "cost_micros" numeric DEFAULT 0, "cost" numeric DEFAULT 0,
      "conversions" numeric DEFAULT 0, "conversion_value" numeric DEFAULT 0, "currency_code" varchar,
      "source" "enum_synced_performance_daily_source" DEFAULT 'api_synced' NOT NULL,
      "synced_at" timestamp(3) with time zone, "sync_run_id" integer,
      "tenant_id" integer, "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_provider_idx" ON "synced_performance_daily" USING btree ("provider");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_provider_connection_idx" ON "synced_performance_daily" USING btree ("provider_connection_id");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_provider_account_idx" ON "synced_performance_daily" USING btree ("provider_account_id");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_customer_id_idx" ON "synced_performance_daily" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_metric_date_idx" ON "synced_performance_daily" USING btree ("metric_date");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_campaign_id_idx" ON "synced_performance_daily" USING btree ("campaign_id");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_source_idx" ON "synced_performance_daily" USING btree ("source");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_sync_run_idx" ON "synced_performance_daily" USING btree ("sync_run_id");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_tenant_idx" ON "synced_performance_daily" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_workspace_idx" ON "synced_performance_daily" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "synced_performance_daily_created_at_idx" ON "synced_performance_daily" USING btree ("created_at");
    DO $$ BEGIN ALTER TABLE "synced_performance_daily" ADD CONSTRAINT "synced_performance_daily_provider_connection_id_provider_connections_id_fk" FOREIGN KEY ("provider_connection_id") REFERENCES "public"."provider_connections"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "synced_performance_daily" ADD CONSTRAINT "synced_performance_daily_provider_account_id_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."provider_accounts"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "synced_performance_daily" ADD CONSTRAINT "synced_performance_daily_sync_run_id_provider_sync_runs_id_fk" FOREIGN KEY ("sync_run_id") REFERENCES "public"."provider_sync_runs"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "synced_performance_daily" ADD CONSTRAINT "synced_performance_daily_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "synced_performance_daily" ADD CONSTRAINT "synced_performance_daily_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "provider_accounts_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "synced_performance_daily_id" integer;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provider_accounts_fk" FOREIGN KEY ("provider_accounts_id") REFERENCES "public"."provider_accounts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_synced_performance_daily_fk" FOREIGN KEY ("synced_performance_daily_id") REFERENCES "public"."synced_performance_daily"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_provider_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("provider_accounts_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_synced_performance_daily_id_idx" ON "payload_locked_documents_rels" USING btree ("synced_performance_daily_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "synced_performance_daily_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "provider_accounts_id";
    DROP TABLE IF EXISTS "synced_performance_daily";
    DROP TABLE IF EXISTS "provider_accounts";
    DROP TYPE IF EXISTS "public"."enum_synced_performance_daily_source";
    DROP TYPE IF EXISTS "public"."enum_synced_performance_daily_provider";
    DROP TYPE IF EXISTS "public"."enum_provider_accounts_status";
    DROP TYPE IF EXISTS "public"."enum_provider_accounts_provider";
    ALTER TABLE "provider_sync_runs" DROP COLUMN IF EXISTS "window_end";
    ALTER TABLE "provider_sync_runs" DROP COLUMN IF EXISTS "window_start";`)
}
