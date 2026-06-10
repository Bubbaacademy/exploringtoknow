import 'dotenv/config';
import { getPayload } from 'payload';
import config from '../src/payload.config';

/** Seed ONE golden product (+ ensure brand-profile defaults) for the live E2E. */
async function main() {
  const payload = await getPayload({ config });

  // brand-profile global: writing {} persists the field defaults
  await payload.updateGlobal({ slug: 'brand-profile', data: {} });

  const slug = 'block-led-lights-bedroom';
  const existing = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs.length) {
    console.log('golden product already exists:', existing.docs[0]?.id);
  } else {
    const doc = await payload.create({
      collection: 'products',
      data: {
        title: 'Block LED Lights for Bedroom',
        slug,
        offerType: 'owned_amazon',
        status: 'active',
        priority: 100,
        amazonAsin: 'B0EXAMPLE',
        typeFields: {},
      },
    });
    console.log('created golden product:', doc.id);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
