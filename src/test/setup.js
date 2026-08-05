/* global process */

// Polyfills for MSW on Node 24+ - MUST be before msw import
import { TextEncoder, TextDecoder } from 'util';
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

try {
  const _streamWeb = import('stream/web');
  globalThis.TransformStream = _streamWeb.TransformStream;
  globalThis.ReadableStream = _streamWeb.ReadableStream;
  globalThis.WritableStream = _streamWeb.WritableStream;
} catch (_) {
  // stream/web not available — streams may already be global in Node 24+
}

import '@testing-library/jest-dom';
import { IDBFactory } from 'fake-indexeddb';
import { beforeAll, afterAll, afterEach, vi, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers.js';
import * as matchers from 'vitest-dom/matchers';

expect.extend(matchers);

globalThis.indexedDB = new IDBFactory();

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(async () => {
  try { await server.close(); } catch (_) { /* ignore close error */ }
  globalThis.indexedDB = new IDBFactory();
  setTimeout(() => process.exit(0), 100);
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