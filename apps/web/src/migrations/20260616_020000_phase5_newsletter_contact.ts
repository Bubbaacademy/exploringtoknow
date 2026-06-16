import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Phase 5 — additive only.
// 1) Newsletter: add lifecycle statuses + provider/confirm/unsubscribe/token columns.
//    New enum values are NOT used in this same transaction (no SET DEFAULT to a new
//    value) to satisfy Postgres' "unsafe use of new value" rule. The runtime/API
//    sets status explicitly.
// 2) Contact: new contact_messages table + admin lock relation.
// No existing table data or column is altered destructively.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_newsletter_subscribers_status" ADD VALUE IF NOT EXISTS 'active';
  ALTER TYPE "public"."enum_newsletter_subscribers_status" ADD VALUE IF NOT EXISTS 'pending';
  ALTER TYPE "public"."enum_newsletter_subscribers_status" ADD VALUE IF NOT EXISTS 'bounced';
  ALTER TYPE "public"."enum_newsletter_subscribers_status" ADD VALUE IF NOT EXISTS 'complained';
  ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "provider" varchar;
  ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp(3) with time zone;
  ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "unsubscribed_at" timestamp(3) with time zone;
  ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "token_hash" varchar;
  CREATE INDEX IF NOT EXISTS "newsletter_subscribers_token_hash_idx" ON "newsletter_subscribers" USING btree ("token_hash");

  CREATE TYPE "public"."enum_contact_messages_reason" AS ENUM('suggest_product', 'correction', 'partnership', 'general');
  CREATE TYPE "public"."enum_contact_messages_status" AS ENUM('new', 'read', 'archived');
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"email" varchar NOT NULL,
  	"reason" "enum_contact_messages_reason" DEFAULT 'general',
  	"subject" varchar,
  	"message" varchar NOT NULL,
  	"product_url" varchar,
  	"status" "enum_contact_messages_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contact_messages_id" integer;
  CREATE INDEX "contact_messages_status_idx" ON "contact_messages" USING btree ("status");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Note: Postgres cannot drop enum values, so the added newsletter status values
  // remain (harmless). Everything else is removed.
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contact_messages_fk";
  DROP INDEX "payload_locked_documents_rels_contact_messages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contact_messages_id";
  DROP TABLE "contact_messages" CASCADE;
  DROP TYPE "public"."enum_contact_messages_reason";
  DROP TYPE "public"."enum_contact_messages_status";
  DROP INDEX "newsletter_subscribers_token_hash_idx";
  ALTER TABLE "newsletter_subscribers" DROP COLUMN "token_hash";
  ALTER TABLE "newsletter_subscribers" DROP COLUMN "unsubscribed_at";
  ALTER TABLE "newsletter_subscribers" DROP COLUMN "confirmed_at";
  ALTER TABLE "newsletter_subscribers" DROP COLUMN "provider";`)
}
