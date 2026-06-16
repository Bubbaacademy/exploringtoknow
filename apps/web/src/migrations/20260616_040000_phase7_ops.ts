import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Phase 7 — additive / idempotent only.
// 1) pg_trgm + GIN indexes to transparently accelerate the existing published-only
//    ILIKE search (no query change — Postgres uses the trgm index for ILIKE '%q%').
// 2) Contact editorial workflow: status values reviewed/spam (ADD VALUE, not used in
//    this tx), notify_status, reviewed_by relation.
// 3) authors.sort_order for editorial ordering.
// No existing data is rewritten.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
  ALTER TYPE "public"."enum_contact_messages_status" ADD VALUE IF NOT EXISTS 'reviewed';
  ALTER TYPE "public"."enum_contact_messages_status" ADD VALUE IF NOT EXISTS 'spam';
  ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "notify_status" varchar;
  ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "reviewed_by_id" integer;
  ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "sort_order" numeric;
  ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "contact_messages_reviewed_by_idx" ON "contact_messages" USING btree ("reviewed_by_id");
  CREATE INDEX IF NOT EXISTS "articles_title_trgm_idx" ON "articles" USING gin ("title" gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS "articles_markdown_trgm_idx" ON "articles" USING gin ("markdown" gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS "articles_excerpt_trgm_idx" ON "articles" USING gin ("excerpt" gin_trgm_ops);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Note: Postgres cannot drop enum values; the added contact statuses remain
  // (harmless). The pg_trgm extension is left installed (other objects may use it).
  await db.execute(sql`
   DROP INDEX IF EXISTS "articles_title_trgm_idx";
  DROP INDEX IF EXISTS "articles_markdown_trgm_idx";
  DROP INDEX IF EXISTS "articles_excerpt_trgm_idx";
  ALTER TABLE "contact_messages" DROP CONSTRAINT "contact_messages_reviewed_by_id_users_id_fk";
  DROP INDEX IF EXISTS "contact_messages_reviewed_by_idx";
  ALTER TABLE "contact_messages" DROP COLUMN "notify_status";
  ALTER TABLE "contact_messages" DROP COLUMN "reviewed_by_id";
  ALTER TABLE "authors" DROP COLUMN "sort_order";`)
}
