import 'dotenv/config';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import { loadBrandProfile } from '../src/lib/brand';
import { validateOneArticle } from './lib/validation';

/** Phase C — single real-AI validation for RYZE Mushroom Coffee. Writes the 3 reports.
 *  pnpm --filter @etk/web validate:ryze   (set ANTHROPIC_API_KEY for REAL output) */
async function main() {
  const payload = await getPayload({ config });
  const brandProfile = await loadBrandProfile(payload);
  const r = await validateOneArticle(payload, {
    brand: { name: 'RYZE', slug: 'ryze', website: 'https://ryzesuperfoods.com' },
    product: { id: 'pending', title: 'RYZE Mushroom Coffee', slug: 'ryze-mushroom-coffee',
      offerType: 'amazon_affiliate', brand: 'RYZE', categories: ['coffee', 'wellness'],
      notes: 'Mushroom coffee blend; lower caffeine; marketed for focus and calm energy.' },
    brandProfile,
  });
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
