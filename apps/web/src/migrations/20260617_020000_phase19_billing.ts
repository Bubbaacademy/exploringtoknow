import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 19 — billing / subscription fields on tenants. ADDITIVE + IDEMPOTENT.
 * Adds subscription_status (enum) + provider placeholders. Backfills the
 * ExploringToKnow tenant to `comped` (unlimited internal) so it is never limited.
 * No existing data is altered otherwise. Re-runnable.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tenants_subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'comped', 'manual');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_status" "enum_tenants_subscription_status";
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "billing_subscription_id" varchar;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "current_period_start" timestamp(3) with time zone;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "current_period_end" timestamp(3) with time zone;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "cancel_at_period_end" boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS "tenants_subscription_status_idx" ON "tenants" USING btree ("subscription_status");

    UPDATE "tenants" SET "subscription_status" = 'comped' WHERE slug = 'exploringtoknow' AND "subscription_status" IS NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "subscription_status";
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "billing_subscription_id";
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "current_period_start";
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "current_period_end";
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "cancel_at_period_end";
    DROP TYPE IF EXISTS "public"."enum_tenants_subscription_status";`)
}
