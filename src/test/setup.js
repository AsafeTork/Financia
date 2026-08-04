import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { beforeAll, afterAll, afterEach, vi, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers.js';
import * as matchers from 'vitest-dom/matchers';

expect.extend(matchers);

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(async () => {
  server.resetHandlers();
  vi.clearAllMocks();
  vi.clearAllTimers();
  // Properly handle localStorage/sessionStorage in jsdom
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
  if (indexedDB.databases) {
    try {
      const dbs = await indexedDB.databases();
      dbs.forEach(db => {
        if (db.name) indexedDB.deleteDatabase(db.name);
      });
    } catch (_) { /* ignore */ }
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