import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 22 — Brand Kit / Asset Library foundation. ADDITIVE + IDEMPOTENT.
 * Creates two NEW workspace-scoped tables (brand_profiles, brand_assets) with
 * their enums, indexes, tenant/workspace FKs, and the payload_locked_documents_rels
 * columns for admin doc-locking. No existing table or data is touched. Re-runnable:
 * CREATE TYPE guarded, IF NOT EXISTS everywhere, FKs guarded.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_brand_assets_asset_type" AS ENUM('logo', 'brand_image', 'product_image', 'document', 'link', 'other');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_brand_assets_permission" AS ENUM('user_provided', 'permission_cleared', 'needs_review', 'unknown');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "brand_profiles" (
      "id" serial PRIMARY KEY NOT NULL,
      "brand_name" varchar,
      "publication_name" varchar,
      "description" varchar,
      "target_audience" varchar,
      "brand_voice" varchar,
      "editorial_style" varchar,
      "primary_color" varchar,
      "accent_color" varchar,
      "website_url" varchar,
      "social_links" varchar,
      "affiliate_disclosure" varchar,
      "focus_notes" varchar,
      "tenant_id" integer,
      "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "brand_assets" (
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "asset_type" "enum_brand_assets_asset_type" DEFAULT 'other' NOT NULL,
      "permission" "enum_brand_assets_permission" DEFAULT 'needs_review' NOT NULL,
      "source_url" varchar,
      "notes" varchar,
      "tenant_id" integer,
      "workspace_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "brand_profiles_tenant_idx" ON "brand_profiles" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "brand_profiles_workspace_idx" ON "brand_profiles" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "brand_profiles_updated_at_idx" ON "brand_profiles" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "brand_profiles_created_at_idx" ON "brand_profiles" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "brand_assets_asset_type_idx" ON "brand_assets" USING btree ("asset_type");
    CREATE INDEX IF NOT EXISTS "brand_assets_permission_idx" ON "brand_assets" USING btree ("permission");
    CREATE INDEX IF NOT EXISTS "brand_assets_tenant_idx" ON "brand_assets" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "brand_assets_workspace_idx" ON "brand_assets" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "brand_assets_updated_at_idx" ON "brand_assets" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "brand_assets_created_at_idx" ON "brand_assets" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "brand_assets" ADD CONSTRAINT "brand_assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "brand_assets" ADD CONSTRAINT "brand_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "brand_profiles_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "brand_assets_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_profiles_fk" FOREIGN KEY ("brand_profiles_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_assets_fk" FOREIGN KEY ("brand_assets_id") REFERENCES "public"."brand_assets"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_brand_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_profiles_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_brand_assets_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_assets_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "brand_profiles_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "brand_assets_id";
    DROP TABLE IF EXISTS "brand_assets";
    DROP TABLE IF EXISTS "brand_profiles";
    DROP TYPE IF EXISTS "public"."enum_brand_assets_permission";
    DROP TYPE IF EXISTS "public"."enum_brand_assets_asset_type";`)
}
