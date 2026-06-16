import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Phase 10 — additive/idempotent only. Editor-facing publishing-queue fields on
// articles (notes + priority). Admin-only display; no public/business-logic impact.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "editorial_notes" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "publish_priority" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" DROP COLUMN "editorial_notes";
  ALTER TABLE "articles" DROP COLUMN "publish_priority";`)
}
