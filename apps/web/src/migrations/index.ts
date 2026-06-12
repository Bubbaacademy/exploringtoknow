import * as migration_20260610_210250_initial from './20260610_210250_initial';
import * as migration_20260612_060512_add_user_api_key from './20260612_060512_add_user_api_key';

export const migrations = [
  {
    up: migration_20260610_210250_initial.up,
    down: migration_20260610_210250_initial.down,
    name: '20260610_210250_initial',
  },
  {
    up: migration_20260612_060512_add_user_api_key.up,
    down: migration_20260612_060512_add_user_api_key.down,
    name: '20260612_060512_add_user_api_key'
  },
];
