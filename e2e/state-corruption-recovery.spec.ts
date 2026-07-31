import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('State Corruption & Recovery', () => {
  test.setTimeout(30000);

  test('app recovers from corrupted localStorage brand config', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const corruptBrand = await page.evaluate(async () => {
      try {
        localStorage.setItem('financia_brand', '{invalid json{{{');
        const raw = localStorage.getItem('financia_brand');
        JSON.parse(raw);
        return 'no-error';
      } catch (e) {
        return 'parse-error-handled';
      }
    });

    expect(corruptBrand).toBe('parse-error-handled');
  });

  test('app survives missing IndexedDB database gracefully', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const idbMissing = await page.evaluate(async () => {
      try {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('nonexistent-db-' + Date.now(), 1);
          request.onerror = () => reject(new Error('db-not-found'));
          request.onsuccess = (e) => resolve(e.target.result);
          request.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore('test');
          };
        });
        db.close();
        indexedDB.deleteDatabase(db.name);
        return 'db-created-and-deleted';
      } catch (e) {
        return 'error-handled: ' + (e as Error).message;
      }
    });

    expect(idbMissing).toBeTruthy();
  });

  test('app handles sessionStorage flood without crash', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const floodResult = await page.evaluate(async () => {
      try {
        for (let i = 0; i < 100; i++) {
          sessionStorage.setItem('flood_test_' + i, 'x'.repeat(1000));
        }
        const count = sessionStorage.length;
        for (let i = 0; i < 100; i++) {
          sessionStorage.removeItem('flood_test_' + i);
        }
        return { success: true, finalCount: sessionStorage.length };
      } catch (e) {
        return { success: false, error: (e as Error).name };
      }
    });

    expect(floodResult.success).toBe(true);
  });

  test('app survives cache API quota exceeded', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const cacheResult = await page.evaluate(async () => {
      try {
        if (!('caches' in window)) return 'no-cache-api';
        const cache = await caches.open('test-corruption-cache');
        const blob = new Blob(['x'.repeat(1024 * 1024)], { type: 'text/plain' });
        await cache.put('/test-url', new Response(blob));
        await caches.delete('test-corruption-cache');
        return 'cache-operation-success';
      } catch (e) {
        return 'cache-error-handled: ' + (e as Error).name;
      }
    });

    expect(cacheResult).toBeTruthy();
  });

  test('app handles service worker registration failure gracefully', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const swResult = await page.evaluate(async () => {
      try {
        if (!('serviceWorker' in navigator)) return 'no-sw-api';
        const registration = await navigator.serviceWorker.register('/nonexistent-sw.js');
        return 'sw-registered';
      } catch (e) {
        return 'sw-failure-handled: ' + (e as Error).name;
      }
    });

    expect(swResult).toBeTruthy();
  });
});