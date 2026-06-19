import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 26 — Social Studio planning (calendar / campaigns / duplication / export).
 * ADDITIVE + IDEMPOTENT. Adds planning columns to social_studio_posts:
 * planned_date, campaign_label, content_pillar, priority (enum), assignee_id (→users),
 * calendar_notes, duplicated_from_id (self-FK), exported_at, export_count. No existing
 * data is altered (existing rows get priority='normal' / export_count=0). Re-runnable:
 * guarded CREATE TYPE, ADD COLUMN IF NOT EXISTS, guarded FKs, IF NOT EXISTS indexes.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_social_studio_posts_priority" AS ENUM('low', 'normal', 'high');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "planned_date" varchar;
    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "campaign_label" varchar;
    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "content_pillar" varchar;
    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "priority" "enum_social_studio_posts_priority" DEFAULT 'normal';
    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "assignee_id" integer;
    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "calendar_notes" varchar;
    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "duplicated_from_id" integer;
    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "exported_at" timestamp(3) with time zone;
    ALTER TABLE "social_studio_posts" ADD COLUMN IF NOT EXISTS "export_count" numeric DEFAULT 0;

    CREATE INDEX IF NOT EXISTS "social_studio_posts_planned_date_idx" ON "social_studio_posts" USING btree ("planned_date");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_campaign_label_idx" ON "social_studio_posts" USING btree ("campaign_label");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_priority_idx" ON "social_studio_posts" USING btree ("priority");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_assignee_idx" ON "social_studio_posts" USING btree ("assignee_id");
    CREATE INDEX IF NOT EXISTS "social_studio_posts_duplicated_from_idx" ON "social_studio_posts" USING btree ("duplicated_from_id");

    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "social_studio_posts" ADD CONSTRAINT "social_studio_posts_duplicated_from_id_social_studio_posts_id_fk" FOREIGN KEY ("duplicated_from_id") REFERENCES "public"."social_studio_posts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "duplicated_from_id";
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "assignee_id";
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "planned_date";
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "campaign_label";
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "content_pillar";
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "priority";
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "calendar_notes";
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "exported_at";
    ALTER TABLE "social_studio_posts" DROP COLUMN IF EXISTS "export_count";
    DROP TYPE IF EXISTS "public"."enum_social_studio_posts_priority";`)
}
