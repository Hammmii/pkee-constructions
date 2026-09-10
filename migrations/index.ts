import * as migration_20260910_193810_init from './20260910_193810_init';

export const migrations = [
  {
    up: migration_20260910_193810_init.up,
    down: migration_20260910_193810_init.down,
    name: '20260910_193810_init'
  },
];
