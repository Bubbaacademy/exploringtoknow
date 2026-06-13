import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_editorial_status" AS ENUM('draft', 'ready_for_review', 'published', 'rejected');
  CREATE TYPE "public"."enum_product_requests_status" AS ENUM('submitted', 'under_review', 'approved', 'processing', 'completed', 'rejected');
  CREATE TABLE "product_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"requester_name" varchar,
  	"requester_email" varchar NOT NULL,
  	"product_name" varchar NOT NULL,
  	"brand" varchar,
  	"product_url" varchar,
  	"affiliate_url" varchar,
  	"asin" varchar,
  	"requested_category_id" integer,
  	"notes" varchar,
  	"image_id" integer,
  	"status" "enum_product_requests_status" DEFAULT 'submitted' NOT NULL,
  	"linked_product_id" integer,
  	"linked_article_id" integer,
  	"generation_job_id" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "categories" ADD COLUMN "image_id" integer;
  ALTER TABLE "categories" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "categories" ADD COLUMN "seo_seo_title" varchar;
  ALTER TABLE "categories" ADD COLUMN "seo_seo_description" varchar;
  ALTER TABLE "products" ADD COLUMN "price_text" varchar;
  ALTER TABLE "products" ADD COLUMN "affiliate_url" varchar;
  ALTER TABLE "products" ADD COLUMN "merchant_name" varchar;
  ALTER TABLE "articles" ADD COLUMN "category_id" integer;
  ALTER TABLE "articles" ADD COLUMN "excerpt" varchar;
  ALTER TABLE "articles" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "images_hero_id" integer;
  ALTER TABLE "articles" ADD COLUMN "images_hero_alt" varchar;
  ALTER TABLE "articles" ADD COLUMN "images_product_id" integer;
  ALTER TABLE "articles" ADD COLUMN "images_caption" varchar;
  ALTER TABLE "articles" ADD COLUMN "images_og_id" integer;
  ALTER TABLE "articles" ADD COLUMN "editorial_status" "enum_articles_editorial_status" DEFAULT 'draft' NOT NULL;
  ALTER TABLE "articles" ADD COLUMN "editorial_published_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "product_requests_id" integer;
  ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_requested_category_id_categories_id_fk" FOREIGN KEY ("requested_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_linked_product_id_products_id_fk" FOREIGN KEY ("linked_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_linked_article_id_articles_id_fk" FOREIGN KEY ("linked_article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "product_requests_requested_category_idx" ON "product_requests" USING btree ("requested_category_id");
  CREATE INDEX "product_requests_image_idx" ON "product_requests" USING btree ("image_id");
  CREATE INDEX "product_requests_status_idx" ON "product_requests" USING btree ("status");
  CREATE INDEX "product_requests_linked_product_idx" ON "product_requests" USING btree ("linked_product_id");
  CREATE INDEX "product_requests_linked_article_idx" ON "product_requests" USING btree ("linked_article_id");
  CREATE INDEX "product_requests_updated_at_idx" ON "product_requests" USING btree ("updated_at");
  CREATE INDEX "product_requests_created_at_idx" ON "product_requests" USING btree ("created_at");
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_images_hero_id_media_id_fk" FOREIGN KEY ("images_hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_images_product_id_media_id_fk" FOREIGN KEY ("images_product_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_images_og_id_media_id_fk" FOREIGN KEY ("images_og_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_requests_fk" FOREIGN KEY ("product_requests_id") REFERENCES "public"."product_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX "categories_active_idx" ON "categories" USING btree ("active");
  CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");
  CREATE INDEX "articles_images_images_hero_idx" ON "articles" USING btree ("images_hero_id");
  CREATE INDEX "articles_images_images_product_idx" ON "articles" USING btree ("images_product_id");
  CREATE INDEX "articles_images_images_og_idx" ON "articles" USING btree ("images_og_id");
  CREATE INDEX "articles_editorial_status_idx" ON "articles" USING btree ("editorial_status");
  CREATE INDEX "payload_locked_documents_rels_product_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("product_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "product_requests" CASCADE;
  ALTER TABLE "categories" DROP CONSTRAINT "categories_image_id_media_id_fk";
  
  ALTER TABLE "articles" DROP CONSTRAINT "articles_category_id_categories_id_fk";
  
  ALTER TABLE "articles" DROP CONSTRAINT "articles_images_hero_id_media_id_fk";
  
  ALTER TABLE "articles" DROP CONSTRAINT "articles_images_product_id_media_id_fk";
  
  ALTER TABLE "articles" DROP CONSTRAINT "articles_images_og_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_product_requests_fk";
  
  DROP INDEX "categories_image_idx";
  DROP INDEX "categories_active_idx";
  DROP INDEX "articles_category_idx";
  DROP INDEX "articles_images_images_hero_idx";
  DROP INDEX "articles_images_images_product_idx";
  DROP INDEX "articles_images_images_og_idx";
  DROP INDEX "articles_editorial_status_idx";
  DROP INDEX "payload_locked_documents_rels_product_requests_id_idx";
  ALTER TABLE "categories" DROP COLUMN "image_id";
  ALTER TABLE "categories" DROP COLUMN "active";
  ALTER TABLE "categories" DROP COLUMN "seo_seo_title";
  ALTER TABLE "categories" DROP COLUMN "seo_seo_description";
  ALTER TABLE "products" DROP COLUMN "price_text";
  ALTER TABLE "products" DROP COLUMN "affiliate_url";
  ALTER TABLE "products" DROP COLUMN "merchant_name";
  ALTER TABLE "articles" DROP COLUMN "category_id";
  ALTER TABLE "articles" DROP COLUMN "excerpt";
  ALTER TABLE "articles" DROP COLUMN "featured";
  ALTER TABLE "articles" DROP COLUMN "images_hero_id";
  ALTER TABLE "articles" DROP COLUMN "images_hero_alt";
  ALTER TABLE "articles" DROP COLUMN "images_product_id";
  ALTER TABLE "articles" DROP COLUMN "images_caption";
  ALTER TABLE "articles" DROP COLUMN "images_og_id";
  ALTER TABLE "articles" DROP COLUMN "editorial_status";
  ALTER TABLE "articles" DROP COLUMN "editorial_published_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "product_requests_id";
  DROP TYPE "public"."enum_articles_editorial_status";
  DROP TYPE "public"."enum_product_requests_status";`)
}
