import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 18 — workspace team invitations. ADDITIVE + IDEMPOTENT.
 * Creates the workspace_invitations table (+enums, indexes, FKs) and the
 * payload_locked_documents_rels column for admin doc-locking. No existing data is
 * touched. Re-runnable: CREATE TYPE guarded, IF NOT EXISTS, FKs guarded.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_workspace_invitations_role" AS ENUM('workspace_admin', 'editor', 'viewer');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_workspace_invitations_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "workspace_invitations" (
      "id" serial PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL,
      "role" "enum_workspace_invitations_role" DEFAULT 'viewer' NOT NULL,
      "tenant_id" integer,
      "workspace_id" integer,
      "invited_by_id" integer,
      "message" varchar,
      "token_hash" varchar,
      "status" "enum_workspace_invitations_status" DEFAULT 'pending',
      "expires_at" timestamp(3) with time zone,
      "accepted_at" timestamp(3) with time zone,
      "email_status" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "workspace_invitations_email_idx" ON "workspace_invitations" USING btree ("email");
    CREATE INDEX IF NOT EXISTS "workspace_invitations_role_idx" ON "workspace_invitations" USING btree ("role");
    CREATE INDEX IF NOT EXISTS "workspace_invitations_status_idx" ON "workspace_invitations" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "workspace_invitations_token_hash_idx" ON "workspace_invitations" USING btree ("token_hash");
    CREATE INDEX IF NOT EXISTS "workspace_invitations_tenant_idx" ON "workspace_invitations" USING btree ("tenant_id");
    CREATE INDEX IF NOT EXISTS "workspace_invitations_workspace_idx" ON "workspace_invitations" USING btree ("workspace_id");
    CREATE INDEX IF NOT EXISTS "workspace_invitations_invited_by_idx" ON "workspace_invitations" USING btree ("invited_by_id");
    CREATE INDEX IF NOT EXISTS "workspace_invitations_updated_at_idx" ON "workspace_invitations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "workspace_invitations_created_at_idx" ON "workspace_invitations" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "workspace_invitations_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workspace_invitations_fk" FOREIGN KEY ("workspace_invitations_id") REFERENCES "public"."workspace_invitations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_workspace_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("workspace_invitations_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "workspace_invitations_id";
    DROP TABLE IF EXISTS "workspace_invitations";
    DROP TYPE IF EXISTS "public"."enum_workspace_invitations_status";
    DROP TYPE IF EXISTS "public"."enum_workspace_invitations_role";`)
}
