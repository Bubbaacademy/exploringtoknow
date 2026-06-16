import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Phase 8 — additive/idempotent only. Adds richer public author profile fields.
// No existing data is rewritten.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "long_bio" varchar;
  ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "expertise" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "authors" DROP COLUMN "long_bio";
  ALTER TABLE "authors" DROP COLUMN "expertise";`)
}
