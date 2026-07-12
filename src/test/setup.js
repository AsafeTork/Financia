import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers.js';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  vi.clearAllTimers();
  localStorage.clear();
  sessionStorage.clear();
  indexedDB.databases ? indexedDB.databases().then(dbs => {
    dbs.forEach(db => {
      if (db.name) indexedDB.deleteDatabase(db.name);
    });
  }) : void 0;
});

vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 5000,
});

globalThis.cleanupMocks = () => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
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