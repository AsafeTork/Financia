import { test, expect } from '@playwright/test';
import fs from 'fs';

const storageState = fs.existsSync('e2e/auth-state.json') ? 'e2e/auth-state.json' : undefined;

test.describe('Multi-tab / BroadcastChannel Sync - IndexedDB', () => {
  test.setTimeout(120000);

  const ensureDBSchema = async (page) => {
    await page.evaluate(async () => {
      const dbName = 'gestao_offline';
      await new Promise<void>((resolve) => {
        const request = indexedDB.open(dbName, 5);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('transactions')) {
            const store = db.createObjectStore('transactions', { keyPath: 'id' });
            store.createIndex('by-date', 'date');
            store.createIndex('by-user_id', 'user_id');
          }
          if (!db.objectStoreNames.contains('products')) {
            const store = db.createObjectStore('products', { keyPath: 'id' });
            store.createIndex('by-category', 'category');
            store.createIndex('by-user_id', 'user_id');
          }
          if (!db.objectStoreNames.contains('losses')) {
            const store = db.createObjectStore('losses', { keyPath: 'id' });
            store.createIndex('by-date', 'date');
            store.createIndex('by-user_id', 'user_id');
          }
          if (!db.objectStoreNames.contains('profiles')) {
            db.createObjectStore('profiles', { keyPath: 'user_id' });
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('brand_presets')) {
            const store = db.createObjectStore('brand_presets', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('brand_logo_schemes')) {
            const store = db.createObjectStore('brand_logo_schemes', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => { request.result.close(); resolve(); };
        request.onerror = () => resolve();
      });
    });
  };

  test.describe('IndexedDB Sync via BroadcastChannel', () => {
    test('should sync IndexedDB writes across tabs', async ({ browser }) => {
      const context = storageState
        ? await browser.newContext({ storageState })
        : await browser.newContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/');
      await page2.goto('/');

      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');
      await ensureDBSchema(page1);

      await page1.evaluate(async () => {
        const dbName = 'gestao_offline';
        const storeName = 'transactions';

        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
              db.close();
              resolve();
              return;
            }
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            store.put({
              id: `sync-${Date.now()}`,
              amount: 200,
              description: 'Synced transaction',
              type: 'income',
              date: new Date().toISOString(),
              synced: true,
              createdAt: new Date().toISOString(),
            });
            transaction.oncomplete = () => {
              db.close();
              resolve();
            };
            transaction.onerror = () => {
              db.close();
              reject(transaction.error);
            };
          };
          request.onerror = () => reject(request.error);
        });
      });

      await page1.evaluate(() => {
        const channel = new BroadcastChannel('financia-sync');
        channel.postMessage({
          type: 'DB_SYNC_TRIGGER',
          store: 'transactions',
          timestamp: Date.now(),
        });
        channel.close();
      });

      await expect
        .poll(async () => {
          const syncedData = await page2.evaluate(async () => {
            const dbName = 'gestao_offline';
            const storeName = 'transactions';

            return new Promise<any[]>((resolve, reject) => {
              const request = indexedDB.open(dbName);
              request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                  resolve([]);
                  return;
                }
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const getAllRequest = store.getAll();
                getAllRequest.onsuccess = () => resolve(getAllRequest.result);
                getAllRequest.onerror = () => reject(getAllRequest.error);
              };
              request.onerror = () => reject(request.error);
            });
          });

          return syncedData.find(t => t.description === 'Synced transaction') ?? null;
        }, { timeout: 30000, intervals: [250] })
        .toMatchObject({ amount: 200 });

      await context.close();
    });
  });
});
