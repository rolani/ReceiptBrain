import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['tests/helpers/global-setup.ts'],
    pool: 'forks',
    // Integration tests share a single Postgres test schema; running them
    // serially keeps truncate-between-tests deterministic.
    poolOptions: {
      forks: { singleFork: true },
    },
    testTimeout: 15_000,
  },
});
