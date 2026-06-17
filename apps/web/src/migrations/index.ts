import * as migration_20260610_210250_initial from './20260610_210250_initial';
import * as migration_20260612_060512_add_user_api_key from './20260612_060512_add_user_api_key';
import * as migration_20260613_004800_phase2_intake_editorial from './20260613_004800_phase2_intake_editorial';
import * as migration_20260613_020339_slice_b_body_blocks from './20260613_020339_slice_b_body_blocks';
import * as migration_20260613_183516_manual_product_request_images from './20260613_183516_manual_product_request_images';
import * as migration_20260614_214148_product_request_category_and_seed from './20260614_214148_product_request_category_and_seed';
import * as migration_20260616_010000_newsletter_subscribers from './20260616_010000_newsletter_subscribers';
import * as migration_20260616_020000_phase5_newsletter_contact from './20260616_020000_phase5_newsletter_contact';
import * as migration_20260616_030000_phase6_growth from './20260616_030000_phase6_growth';
import * as migration_20260616_040000_phase7_ops from './20260616_040000_phase7_ops';
import * as migration_20260616_050000_phase8_authors from './20260616_050000_phase8_authors';
import * as migration_20260616_060000_phase10_editorial from './20260616_060000_phase10_editorial';
import * as migration_20260616_070000_phase13_multitenant from './20260616_070000_phase13_multitenant';
import * as migration_20260616_080000_phase14_workspace_scoping from './20260616_080000_phase14_workspace_scoping';
import * as migration_20260616_090000_phase15_signup_onboarding from './20260616_090000_phase15_signup_onboarding';
import * as migration_20260617_010000_phase18_invitations from './20260617_010000_phase18_invitations';
import * as migration_20260617_020000_phase19_billing from './20260617_020000_phase19_billing';

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
  {
    up: migration_20260616_030000_phase6_growth.up,
    down: migration_20260616_030000_phase6_growth.down,
    name: '20260616_030000_phase6_growth',
  },
  {
    up: migration_20260616_040000_phase7_ops.up,
    down: migration_20260616_040000_phase7_ops.down,
    name: '20260616_040000_phase7_ops',
  },
  {
    up: migration_20260616_050000_phase8_authors.up,
    down: migration_20260616_050000_phase8_authors.down,
    name: '20260616_050000_phase8_authors',
  },
  {
    up: migration_20260616_060000_phase10_editorial.up,
    down: migration_20260616_060000_phase10_editorial.down,
    name: '20260616_060000_phase10_editorial',
  },
  {
    up: migration_20260616_070000_phase13_multitenant.up,
    down: migration_20260616_070000_phase13_multitenant.down,
    name: '20260616_070000_phase13_multitenant',
  },
  {
    up: migration_20260616_080000_phase14_workspace_scoping.up,
    down: migration_20260616_080000_phase14_workspace_scoping.down,
    name: '20260616_080000_phase14_workspace_scoping',
  },
  {
    up: migration_20260616_090000_phase15_signup_onboarding.up,
    down: migration_20260616_090000_phase15_signup_onboarding.down,
    name: '20260616_090000_phase15_signup_onboarding',
  },
  {
    up: migration_20260617_010000_phase18_invitations.up,
    down: migration_20260617_010000_phase18_invitations.down,
    name: '20260617_010000_phase18_invitations',
  },
  {
    up: migration_20260617_020000_phase19_billing.up,
    down: migration_20260617_020000_phase19_billing.down,
    name: '20260617_020000_phase19_billing',
  },
];
