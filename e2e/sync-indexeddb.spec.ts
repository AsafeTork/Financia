import { test, expect } from '@playwright/test';
import fs from 'fs';

const storageState = fs.existsSync('e2e/auth-state.json') ? 'e2e/auth-state.json' : undefined;

test.describe('Multi-tab / BroadcastChannel Sync - IndexedDB', () => {
  test.setTimeout(120000);

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
            db.close();
            resolve();
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

      await page2.waitForTimeout(2000);

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

      const syncedTxn = syncedData.find(t => t.description === 'Synced transaction');
      expect(syncedTxn).toBeTruthy();
      expect(syncedTxn.amount).toBe(200);

      await context.close();
    });
  });
});
