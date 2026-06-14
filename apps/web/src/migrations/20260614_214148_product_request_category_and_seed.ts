import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_requests" ADD COLUMN "suggested_category" varchar;`)

  // Idempotent controlled category seed. ON CONFLICT (slug) DO NOTHING preserves
  // any existing category (e.g. "Sleep & Wellness") and never creates duplicate
  // names/slugs — safe to run repeatedly. Additive only; no deletes or renames.
  await db.execute(sql`
   INSERT INTO "categories" ("name","slug","active","updated_at","created_at") VALUES
    ('Tech & Electronics','tech-electronics',true,now(),now()),
    ('Home & Kitchen','home-kitchen',true,now(),now()),
    ('Appliances','appliances',true,now(),now()),
    ('Sleep & Wellness','sleep-wellness',true,now(),now()),
    ('Health & Fitness','health-fitness',true,now(),now()),
    ('Beauty & Personal Care','beauty-personal-care',true,now(),now()),
    ('Baby & Kids','baby-kids',true,now(),now()),
    ('Toys & Games','toys-games',true,now(),now()),
    ('Pet Supplies','pet-supplies',true,now(),now()),
    ('Sports & Recreation','sports-recreation',true,now(),now()),
    ('Outdoors, Garden & Patio','outdoors-garden-patio',true,now(),now()),
    ('Tools & Home Improvement','tools-home-improvement',true,now(),now()),
    ('Automotive','automotive',true,now(),now()),
    ('Office, School & Business','office-school-business',true,now(),now()),
    ('Travel & Luggage','travel-luggage',true,now(),now()),
    ('Clothing, Shoes & Accessories','clothing-shoes-accessories',true,now(),now()),
    ('Jewelry & Watches','jewelry-watches',true,now(),now()),
    ('Arts, Crafts & Hobbies','arts-crafts-hobbies',true,now(),now()),
    ('Food & Grocery','food-grocery',true,now(),now()),
    ('Books, Media & Entertainment','books-media-entertainment',true,now(),now()),
    ('Gifts & Seasonal','gifts-seasonal',true,now(),now()),
    ('Industrial & Professional','industrial-professional',true,now(),now()),
    ('Other / Not Sure','other-not-sure',true,now(),now())
   ON CONFLICT ("slug") DO NOTHING;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Only reverse the additive column. Seeded categories are intentionally NOT
  // removed on down() — they may already be referenced by products/requests.
  await db.execute(sql`
   ALTER TABLE "product_requests" DROP COLUMN "suggested_category";`)
}
