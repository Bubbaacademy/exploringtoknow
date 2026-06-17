import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 15 — self-serve signup / trial onboarding. ADDITIVE + IDEMPOTENT.
 *
 * Adds trial + onboarding metadata to `tenants` only. No data is rewritten; the
 * ExploringToKnow tenant keeps its existing values (new columns default sensibly).
 * Re-runnable: CREATE TYPE guarded, ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tenants_onboarding_status" AS ENUM('not_started', 'in_progress', 'completed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trial_started_at" timestamp(3) with time zone;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "onboarding_status" "enum_tenants_onboarding_status" DEFAULT 'not_started';
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "onboarding_step" numeric DEFAULT 0;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "signup_source" varchar;
    CREATE INDEX IF NOT EXISTS "tenants_onboarding_status_idx" ON "tenants" USING btree ("onboarding_status");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "trial_started_at";
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "onboarding_status";
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "onboarding_step";
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "signup_source";
    DROP TYPE IF EXISTS "public"."enum_tenants_onboarding_status";`)
}
