import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Phase 6 — additive only.
// Adds: authors + article_views tables; articles.author_id; category hero/seo
// fields; newsletter.last_email_status; contact source/reviewed_at; admin lock
// relations. Seeds a default "ExploringToKnow Editorial Team" author and backfills
// existing articles' author_id (additive metadata only — no title/body/markdown
// content is touched, so published-article fingerprints are preserved).
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"role" varchar,
  	"bio" varchar,
  	"image_id" integer,
  	"website_url" varchar,
  	"active" boolean DEFAULT true,
  	"seo_seo_title" varchar,
  	"seo_seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "article_views" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"article_id" integer NOT NULL,
  	"view_date" varchar NOT NULL,
  	"count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "articles" ADD COLUMN "author_id" integer;
  ALTER TABLE "categories" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "categories" ADD COLUMN "long_description" varchar;
  ALTER TABLE "categories" ADD COLUMN "sort_order" numeric;
  ALTER TABLE "categories" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "newsletter_subscribers" ADD COLUMN "last_email_status" varchar;
  ALTER TABLE "contact_messages" ADD COLUMN "source" varchar;
  ALTER TABLE "contact_messages" ADD COLUMN "reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "authors_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "article_views_id" integer;

  ALTER TABLE "authors" ADD CONSTRAINT "authors_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "article_views" ADD CONSTRAINT "article_views_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_article_views_fk" FOREIGN KEY ("article_views_id") REFERENCES "public"."article_views"("id") ON DELETE cascade ON UPDATE no action;

  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_active_idx" ON "authors" USING btree ("active");
  CREATE INDEX "authors_image_idx" ON "authors" USING btree ("image_id");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE INDEX "article_views_article_idx" ON "article_views" USING btree ("article_id");
  CREATE INDEX "article_views_view_date_idx" ON "article_views" USING btree ("view_date");
  CREATE INDEX "article_views_updated_at_idx" ON "article_views" USING btree ("updated_at");
  CREATE INDEX "article_views_created_at_idx" ON "article_views" USING btree ("created_at");
  CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id");
  CREATE INDEX "categories_hero_image_idx" ON "categories" USING btree ("hero_image_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_article_views_id_idx" ON "payload_locked_documents_rels" USING btree ("article_views_id");

  INSERT INTO "authors" ("name","slug","role","bio","active")
  VALUES ('ExploringToKnow Editorial Team','exploringtoknow-editorial-team','Editorial Team','The ExploringToKnow editorial team researches every guide, drafts with AI assistance, and reviews each one against a human editorial standard before it is published.', true);
  UPDATE "articles" SET "author_id" = (SELECT id FROM "authors" WHERE slug='exploringtoknow-editorial-team') WHERE "author_id" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_authors_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_article_views_fk";
  ALTER TABLE "articles" DROP CONSTRAINT "articles_author_id_authors_id_fk";
  ALTER TABLE "categories" DROP CONSTRAINT "categories_hero_image_id_media_id_fk";
  DROP INDEX "payload_locked_documents_rels_authors_id_idx";
  DROP INDEX "payload_locked_documents_rels_article_views_id_idx";
  DROP INDEX "articles_author_idx";
  DROP INDEX "categories_hero_image_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "authors_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "article_views_id";
  ALTER TABLE "articles" DROP COLUMN "author_id";
  ALTER TABLE "categories" DROP COLUMN "hero_image_id";
  ALTER TABLE "categories" DROP COLUMN "long_description";
  ALTER TABLE "categories" DROP COLUMN "sort_order";
  ALTER TABLE "categories" DROP COLUMN "featured";
  ALTER TABLE "newsletter_subscribers" DROP COLUMN "last_email_status";
  ALTER TABLE "contact_messages" DROP COLUMN "source";
  ALTER TABLE "contact_messages" DROP COLUMN "reviewed_at";
  DROP TABLE "article_views" CASCADE;
  DROP TABLE "authors" CASCADE;`)
}
