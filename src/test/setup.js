import '@testing-library/jest-dom';
import { IDBFactory } from 'fake-indexeddb';
import { beforeAll, afterAll, afterEach, vi, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers.js';
import * as matchers from 'vitest-dom/matchers';

// eslint-disable-next-line no-undef
/* global process */

expect.extend(matchers);

globalThis.indexedDB = new IDBFactory();

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(async () => {
  await server.close();
  globalThis.indexedDB = new IDBFactory();
  // Force exit if anything is still hanging
  setTimeout(() => process.exit(0), 100);
});
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  vi.clearAllTimers();
  globalThis.indexedDB = new IDBFactory();
  try {
    localStorage.clear();
  } catch (_) {
    // ignore
  }
  try {
    sessionStorage.clear();
  } catch (_) {
    // ignore
  }
});

globalThis.cleanupMocks = () => {
  vi.clearAllMocks();
  try { localStorage.clear(); } catch (_) { /* ignore */ }
  try { sessionStorage.clear(); } catch (_) { /* ignore */ }
};

globalThis.resetMocks = () => {
  vi.resetAllMocks();
};

globalThis.waitFor = async (callback, options = {}) => {
  const { timeout = 1000, interval = 50 } = options;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await callback();
      return;
    } catch {
      await new Promise(r => setTimeout(r, interval));
    }
  }
  await callback();
};
