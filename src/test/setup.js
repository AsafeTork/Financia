// Node 24 dropped globals for web streams — polyfill before MSW import
import 'stream/web';
// Setup MSW for Node 24+ compatibility
import '@testing-library/jest-dom';
import { IDBFactory } from 'fake-indexeddb';
import { beforeAll, afterAll, afterEach, vi, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './test/msw-handlers.js';
import * as matchers from 'vitest-dom/matchers';

expect.extend(matchers);

globalThis.indexedDB = new IDBFactory();

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(async () => {
  try { await server.close(); } catch (_) { /* ignore close error */ }
  globalThis.indexedDB = new IDBFactory();
});
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
  globalThis.indexedDB = new IDBFactory();
  try { localStorage.clear(); } catch (_) { /* ignore clear error */ }
  try { sessionStorage.clear(); } catch (_) { /* ignore clear error */ }
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
