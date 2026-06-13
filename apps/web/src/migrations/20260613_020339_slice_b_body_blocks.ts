import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_blocks_inline_image_align" AS ENUM('wide', 'full');
  CREATE TYPE "public"."enum_articles_blocks_callout_variant" AS ENUM('tip', 'key-takeaway', 'warning', 'info');
  CREATE TYPE "public"."enum_articles_image_slots_position" AS ENUM('hero', 'inline');
  CREATE TYPE "public"."enum_articles_image_slots_status" AS ENUM('needed', 'uploaded', 'generated');
  CREATE TABLE "articles_blocks_prose" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"markdown" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_inline_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar,
  	"caption" varchar,
  	"align" "enum_articles_blocks_inline_image_align" DEFAULT 'wide',
  	"source" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_articles_blocks_callout_variant" DEFAULT 'tip',
  	"title" varchar,
  	"body" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_pull_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"attribution" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_image_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"position" "enum_articles_image_slots_position" DEFAULT 'inline',
  	"prompt" varchar,
  	"status" "enum_articles_image_slots_status" DEFAULT 'needed',
  	"media_id" integer
  );
  
  ALTER TABLE "articles_blocks_prose" ADD CONSTRAINT "articles_blocks_prose_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_inline_image" ADD CONSTRAINT "articles_blocks_inline_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_inline_image" ADD CONSTRAINT "articles_blocks_inline_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_callout" ADD CONSTRAINT "articles_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_pull_quote" ADD CONSTRAINT "articles_blocks_pull_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_image_slots" ADD CONSTRAINT "articles_image_slots_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_image_slots" ADD CONSTRAINT "articles_image_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_blocks_prose_order_idx" ON "articles_blocks_prose" USING btree ("_order");
  CREATE INDEX "articles_blocks_prose_parent_id_idx" ON "articles_blocks_prose" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_prose_path_idx" ON "articles_blocks_prose" USING btree ("_path");
  CREATE INDEX "articles_blocks_inline_image_order_idx" ON "articles_blocks_inline_image" USING btree ("_order");
  CREATE INDEX "articles_blocks_inline_image_parent_id_idx" ON "articles_blocks_inline_image" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_inline_image_path_idx" ON "articles_blocks_inline_image" USING btree ("_path");
  CREATE INDEX "articles_blocks_inline_image_image_idx" ON "articles_blocks_inline_image" USING btree ("image_id");
  CREATE INDEX "articles_blocks_callout_order_idx" ON "articles_blocks_callout" USING btree ("_order");
  CREATE INDEX "articles_blocks_callout_parent_id_idx" ON "articles_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_callout_path_idx" ON "articles_blocks_callout" USING btree ("_path");
  CREATE INDEX "articles_blocks_pull_quote_order_idx" ON "articles_blocks_pull_quote" USING btree ("_order");
  CREATE INDEX "articles_blocks_pull_quote_parent_id_idx" ON "articles_blocks_pull_quote" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_pull_quote_path_idx" ON "articles_blocks_pull_quote" USING btree ("_path");
  CREATE INDEX "articles_image_slots_order_idx" ON "articles_image_slots" USING btree ("_order");
  CREATE INDEX "articles_image_slots_parent_id_idx" ON "articles_image_slots" USING btree ("_parent_id");
  CREATE INDEX "articles_image_slots_media_idx" ON "articles_image_slots" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articles_blocks_prose" CASCADE;
  DROP TABLE "articles_blocks_inline_image" CASCADE;
  DROP TABLE "articles_blocks_callout" CASCADE;
  DROP TABLE "articles_blocks_pull_quote" CASCADE;
  DROP TABLE "articles_image_slots" CASCADE;
  DROP TYPE "public"."enum_articles_blocks_inline_image_align";
  DROP TYPE "public"."enum_articles_blocks_callout_variant";
  DROP TYPE "public"."enum_articles_image_slots_position";
  DROP TYPE "public"."enum_articles_image_slots_status";`)
}
