import * as migration_20260910_193810_init from './20260910_193810_init';
import * as migration_20260910_212226 from './20260910_212226';

export const migrations = [
  {
    up: migration_20260910_193810_init.up,
    down: migration_20260910_193810_init.down,
    name: '20260910_193810_init',
  },
  {
    up: migration_20260910_212226.up,
    down: migration_20260910_212226.down,
    name: '20260910_212226'
  },
];
