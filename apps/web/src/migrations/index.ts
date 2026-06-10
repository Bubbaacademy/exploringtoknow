import * as migration_20260610_210250_initial from './20260610_210250_initial';

export const migrations = [
  {
    up: migration_20260610_210250_initial.up,
    down: migration_20260610_210250_initial.down,
    name: '20260610_210250_initial'
  },
];
