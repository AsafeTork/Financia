import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
      },
    },
    teardownTimeout: 10000,
    reporter: ['verbose'],
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['**/e2e/**', '**/*.isolated.test.{js,jsx}', '**/benchmarks/**', '**/supabase/functions/**'],
    testTimeout: 15000,
    hookTimeout: 10000,
    deps: {
      optimizer: { web: { include: ['dexie'] } },
    },
  },
});