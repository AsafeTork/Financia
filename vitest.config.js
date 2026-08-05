import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/polyfills.js', './src/test/setup.js'],
    globalTeardown: './src/test/global-teardown.js',
    globals: true,
    pool: 'threads',
    maxThreads: 4,
    minThreads: 2,
    fileParallelism: true,
    forceExit: true,
    teardownTimeout: 5000,
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['**/e2e/**', '**/*.isolated.test.{js,jsx}', '**/benchmarks/**', '**/supabase/functions/**'],
    testTimeout: 8000,
    hookTimeout: 5000,
    isolate: false,
    deps: {
      optimizer: { web: { include: ['dexie'] } },
    },
  },
});
