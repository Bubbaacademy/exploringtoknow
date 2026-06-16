import * as migration_20260610_210250_initial from './20260610_210250_initial';
import * as migration_20260612_060512_add_user_api_key from './20260612_060512_add_user_api_key';
import * as migration_20260613_004800_phase2_intake_editorial from './20260613_004800_phase2_intake_editorial';
import * as migration_20260613_020339_slice_b_body_blocks from './20260613_020339_slice_b_body_blocks';
import * as migration_20260613_183516_manual_product_request_images from './20260613_183516_manual_product_request_images';
import * as migration_20260614_214148_product_request_category_and_seed from './20260614_214148_product_request_category_and_seed';
import * as migration_20260616_010000_newsletter_subscribers from './20260616_010000_newsletter_subscribers';
import * as migration_20260616_020000_phase5_newsletter_contact from './20260616_020000_phase5_newsletter_contact';

export const migrations = [
  {
    up: migration_20260610_210250_initial.up,
    down: migration_20260610_210250_initial.down,
    name: '20260610_210250_initial',
  },
  {
    up: migration_20260612_060512_add_user_api_key.up,
    down: migration_20260612_060512_add_user_api_key.down,
    name: '20260612_060512_add_user_api_key',
  },
  {
    up: migration_20260613_004800_phase2_intake_editorial.up,
    down: migration_20260613_004800_phase2_intake_editorial.down,
    name: '20260613_004800_phase2_intake_editorial',
  },
  {
    up: migration_20260613_020339_slice_b_body_blocks.up,
    down: migration_20260613_020339_slice_b_body_blocks.down,
    name: '20260613_020339_slice_b_body_blocks',
  },
  {
    up: migration_20260613_183516_manual_product_request_images.up,
    down: migration_20260613_183516_manual_product_request_images.down,
    name: '20260613_183516_manual_product_request_images',
  },
  {
    up: migration_20260614_214148_product_request_category_and_seed.up,
    down: migration_20260614_214148_product_request_category_and_seed.down,
    name: '20260614_214148_product_request_category_and_seed'
  },
  {
    up: migration_20260616_010000_newsletter_subscribers.up,
    down: migration_20260616_010000_newsletter_subscribers.down,
    name: '20260616_010000_newsletter_subscribers',
  },
  {
    up: migration_20260616_020000_phase5_newsletter_contact.up,
    down: migration_20260616_020000_phase5_newsletter_contact.down,
    name: '20260616_020000_phase5_newsletter_contact',
  },
];
