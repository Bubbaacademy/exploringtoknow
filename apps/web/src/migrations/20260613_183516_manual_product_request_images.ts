import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_product_images_role" AS ENUM('hero', 'lifestyle', 'product-detail', 'packaging', 'in-use', 'comparison', 'other');
  CREATE TYPE "public"."enum_product_requests_product_images_role" AS ENUM('hero', 'lifestyle', 'product-detail', 'packaging', 'in-use', 'comparison', 'other');
  CREATE TABLE "products_product_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"role" "enum_products_product_images_role" DEFAULT 'other',
  	"order" numeric,
  	"alt" varchar,
  	"caption" varchar,
  	"enabled" boolean DEFAULT true,
  	"preferred_hero" boolean DEFAULT false
  );
  
  CREATE TABLE "product_requests_product_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"role" "enum_product_requests_product_images_role" DEFAULT 'other',
  	"order" numeric,
  	"alt" varchar,
  	"caption" varchar,
  	"enabled" boolean DEFAULT true,
  	"preferred_hero" boolean DEFAULT false
  );
  
  ALTER TABLE "articles" ADD COLUMN "populate_images_from_product" boolean DEFAULT false;
  ALTER TABLE "product_requests" ADD COLUMN "image_permission_confirmed" boolean DEFAULT false;
  ALTER TABLE "products_product_images" ADD CONSTRAINT "products_product_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_product_images" ADD CONSTRAINT "products_product_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_requests_product_images" ADD CONSTRAINT "product_requests_product_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_requests_product_images" ADD CONSTRAINT "product_requests_product_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_product_images_order_idx" ON "products_product_images" USING btree ("_order");
  CREATE INDEX "products_product_images_parent_id_idx" ON "products_product_images" USING btree ("_parent_id");
  CREATE INDEX "products_product_images_image_idx" ON "products_product_images" USING btree ("image_id");
  CREATE INDEX "product_requests_product_images_order_idx" ON "product_requests_product_images" USING btree ("_order");
  CREATE INDEX "product_requests_product_images_parent_id_idx" ON "product_requests_product_images" USING btree ("_parent_id");
  CREATE INDEX "product_requests_product_images_image_idx" ON "product_requests_product_images" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_product_images" CASCADE;
  DROP TABLE "product_requests_product_images" CASCADE;
  ALTER TABLE "articles" DROP COLUMN "populate_images_from_product";
  ALTER TABLE "product_requests" DROP COLUMN "image_permission_confirmed";
  DROP TYPE "public"."enum_products_product_images_role";
  DROP TYPE "public"."enum_product_requests_product_images_role";`)
}
