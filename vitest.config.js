import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globalTeardown: ['./src/test/global-teardown.js'],
    globals: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    forceExit: true,
    teardownTimeout: 5000,
    reporter: ['verbose'],
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['**/e2e/**', '**/*.isolated.test.{js,jsx}', '**/benchmarks/**', '**/supabase/functions/**'],
    testTimeout: 15000,
    hookTimeout: 10000,
    isolate: true,
    sequence: { hooks: 'parallel' },
    deps: {
      optimizer: { web: { include: ['dexie'] } },
    },
  },
});