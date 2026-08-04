import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        maxThreads: 2,
        minThreads: 1,
        vmMemoryLimit: '3g',
      },
    },
    teardownTimeout: 5000,
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['**/e2e/**', '**/*.isolated.test.{js,jsx}', '**/benchmarks/**', '**/supabase/functions/**'],
    testTimeout: 15000,
    hookTimeout: 10000,
    deps: {
      optimizer: { web: { include: ['dexie', 'fake-indexeddb'] } },
    },
  },
});