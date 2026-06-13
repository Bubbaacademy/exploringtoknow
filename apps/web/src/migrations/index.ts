import * as migration_20260610_210250_initial from './20260610_210250_initial';
import * as migration_20260612_060512_add_user_api_key from './20260612_060512_add_user_api_key';
import * as migration_20260613_004800_phase2_intake_editorial from './20260613_004800_phase2_intake_editorial';

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
    name: '20260613_004800_phase2_intake_editorial'
  },
];
