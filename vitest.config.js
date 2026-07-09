import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    pool: 'threads',
    poolOptions: { threads: { minThreads: 2, maxThreads: 4 } },
    isolate: true,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/**/*.test.*', 'src/**/*.spec.*'],
      reportsDirectory: './coverage',
      thresholds: { lines: 40, functions: 30, branches: 30, statements: 40 },
    },
    deps: {
      optimizer: { web: { include: ['dexie', 'fake-indexeddb'] } },
    },
  },
});
