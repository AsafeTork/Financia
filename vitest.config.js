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
        minThreads: 2,
        maxThreads: 4,
      },
    },
    isolate: false,
    projects: [
      {
        name: 'unit',
        include: ['src/**/*.test.{js,jsx}'],
        exclude: ['**/*.benchmark.test.{js,jsx}', '**/e2e/**'],
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        globals: true,
        isolate: false,
      },
      {
        name: 'isolated',
        include: ['src/**/*.isolated.test.{js,jsx}'],
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        globals: true,
        isolate: true,
      },
      {
        name: 'benchmark',
        include: ['benchmarks/**/*.benchmark.test.{js,jsx}', 'supabase/functions/*.benchmark.test.{js,ts}'],
        exclude: ['**/e2e/**'],
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        globals: true,
        isolate: false,
      },
    ],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/**/*.test.*', 'src/**/*.spec.*'],
      reportsDirectory: './coverage',
      thresholds: { lines: 60, functions: 50, branches: 50, statements: 60 },
    },
    deps: {
      optimizer: { web: { include: ['dexie', 'fake-indexeddb'] } },
    },
  },
});