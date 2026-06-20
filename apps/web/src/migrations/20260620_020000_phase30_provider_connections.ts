import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 30 — Provider Connections Foundation / OAuth Vault. ADDITIVE + IDEMPOTENT.
 * Creates two NEW workspace-scoped tables: provider_connections (encrypted token vault
 * — tokens stored as AES-256-GCM ciphertext varchars, never plaintext) and
 * provider_sync_runs (audit foundation; no sync occurs yet). +enums, indexes,
 * connection/user/tenant/workspace FKs, and payload_locked_documents_rels columns. No
 * existing table or data is touched. Re-runnable: guarded CREATE TYPE, IF NOT EXISTS,
 * guarded FKs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN CREATE TYPE "public"."enum_provider_connections_provider" AS ENUM('google_ads','meta_ads','tiktok_ads','linkedin_ads','pinterest_ads','microsoft_ads','amazon_ads','x_ads','snapchat_ads','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_provider_connections_connection_type" AS ENUM('oauth','api_key_placeholder','manual_placeholder'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_provider_connections_status" AS ENUM('not_configured','ready_to_connect','connected','expired','disconnected','error','disabled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_provider_sync_runs_provider" AS ENUM('google_ads','meta_ads','tiktok_ads','linkedin_ads','pinterest_ads','microsoft_ads','amazon_ads','x_ads','snapchat_ads','generic'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_provider_sync_runs_sync_type" AS ENUM('account_identity_placeholder','performance_read','campaign_read','creative_read','manual_test_placeholder'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_provider_sync_runs_status" AS ENUM('queued','running','succeeded','failed','skipped'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_provider_sync_runs_source" AS ENUM('provider_api','manual','system'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "provider_connections" (
      "id" serial PRIMARY KEY NOT NULL,
      "provider" "enum_provider_connections_provider" NOT NULL,
      "connection_type" "enum_provider_connections_connection_type" DEFAULT 'oauth' NOT NULL,
      "status" "enum_provider_connections_status" DEFAULT 'not_configured' NOT NULL,
      "display_name" varchar,
      "provider_account_id" varchar, "provider_account_name" varchar, "manager_account_id" varchar,
      "currency_code" varchar, "time_zone" varchar, "scopes" jsonb, "token_type" varchar,
      "access_token_encrypted" varchar, "refresh_token_encrypted" varchar,
      "token_expires_at" timestamp(3) with time zone, "last_connected_at" timestamp(3) with time zone,
      "last_refreshed_at" timestamp(3) with time zone, "last_sync_at" timestamp(3) with time zone,
      "last_error_code" varchar, "last_error_message" varchar,
      "connected_by_id" integer, "disconnected_at" timestamp(3) with time zone, "disconnected_by_id" integer,
      "notes" varchar, "tenant_id" integer, "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "provider_connections_provider_idx" ON "provider_connections" USING btree ("provider");
    CREATE INDEX IF NOT EXISTS "provider_connections_connection_type_idx" ON "provider_connections" USING btree ("connection_type");
    CREATE INDEX IF NOT EXISTS "provider_connections_status_idx" ON "provider_connections" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "provider_connections_tenant_idx" ON "provider_connections" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "provider_connections_workspace_idx" ON "provider_connections" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "provider_connections_updated_at_idx" ON "provider_connections" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "provider_connections_created_at_idx" ON "provider_connections" USING btree ("created_at");

    DO $$ BEGIN ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_connected_by_id_users_id_fk" FOREIGN KEY ("connected_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_disconnected_by_id_users_id_fk" FOREIGN KEY ("disconnected_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "provider_sync_runs" (
      "id" serial PRIMARY KEY NOT NULL,
      "provider" "enum_provider_sync_runs_provider" NOT NULL,
      "connection_id" integer,
      "sync_type" "enum_provider_sync_runs_sync_type" DEFAULT 'account_identity_placeholder' NOT NULL,
      "status" "enum_provider_sync_runs_status" DEFAULT 'queued' NOT NULL,
      "started_at" timestamp(3) with time zone, "finished_at" timestamp(3) with time zone,
      "records_read" numeric DEFAULT 0, "records_written" numeric DEFAULT 0,
      "error_code" varchar, "error_message" varchar,
      "source" "enum_provider_sync_runs_source" DEFAULT 'system' NOT NULL,
      "tenant_id" integer, "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "provider_sync_runs_provider_idx" ON "provider_sync_runs" USING btree ("provider");
    CREATE INDEX IF NOT EXISTS "provider_sync_runs_connection_idx" ON "provider_sync_runs" USING btree ("connection_id");
    CREATE INDEX IF NOT EXISTS "provider_sync_runs_status_idx" ON "provider_sync_runs" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "provider_sync_runs_tenant_idx" ON "provider_sync_runs" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "provider_sync_runs_workspace_idx" ON "provider_sync_runs" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "provider_sync_runs_updated_at_idx" ON "provider_sync_runs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "provider_sync_runs_created_at_idx" ON "provider_sync_runs" USING btree ("created_at");

    DO $$ BEGIN ALTER TABLE "provider_sync_runs" ADD CONSTRAINT "provider_sync_runs_connection_id_provider_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."provider_connections"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "provider_sync_runs" ADD CONSTRAINT "provider_sync_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "provider_sync_runs" ADD CONSTRAINT "provider_sync_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "provider_connections_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "provider_sync_runs_id" integer;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provider_connections_fk" FOREIGN KEY ("provider_connections_id") REFERENCES "public"."provider_connections"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provider_sync_runs_fk" FOREIGN KEY ("provider_sync_runs_id") REFERENCES "public"."provider_sync_runs"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_provider_connections_id_idx" ON "payload_locked_documents_rels" USING btree ("provider_connections_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_provider_sync_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("provider_sync_runs_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "provider_sync_runs_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "provider_connections_id";
    DROP TABLE IF EXISTS "provider_sync_runs";
    DROP TABLE IF EXISTS "provider_connections";
    DROP TYPE IF EXISTS "public"."enum_provider_sync_runs_source";
    DROP TYPE IF EXISTS "public"."enum_provider_sync_runs_status";
    DROP TYPE IF EXISTS "public"."enum_provider_sync_runs_sync_type";
    DROP TYPE IF EXISTS "public"."enum_provider_sync_runs_provider";
    DROP TYPE IF EXISTS "public"."enum_provider_connections_status";
    DROP TYPE IF EXISTS "public"."enum_provider_connections_connection_type";
    DROP TYPE IF EXISTS "public"."enum_provider_connections_provider";`)
}
