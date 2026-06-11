import 'dotenv/config';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import { loadBrandProfile } from '../src/lib/brand';
import { validateOneArticle } from './lib/validation';
import { FLANCCI_CASE } from './cases/flancci';

/** Phase C — ONE real-AI validation for the FLANCCI product. Writes the 3 reports.
 *  pnpm --filter @etk/web validate:flancci   (ANTHROPIC_API_KEY set => REAL output) */
async function main() {
  const payload = await getPayload({ config });
  const brandProfile = await loadBrandProfile(payload);
  const r = await validateOneArticle(payload, {
    brand: FLANCCI_CASE.brand,
    product: FLANCCI_CASE.product,
    brandProfile,
  });
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
