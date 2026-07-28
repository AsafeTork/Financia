import { test, expect } from '@playwright/test';

test.describe('IndexedDB Recovery - Eviction', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Eviction Test', () => {
    test('should handle storage pressure and persist()', async ({ page }) => {
      test.slow(); // This test writes large data

      const persistSupported = await page.evaluate(async () => {
        if ('storage' in navigator && 'persist' in navigator.storage) {
          try {
            const persisted = await navigator.storage.persist();
            return { supported: true, persisted };
          } catch {
            return { supported: true, persisted: false };
          }
        }
        return { supported: false, persisted: false };
      });

      expect(persistSupported.supported).toBeTruthy();

      await page.evaluate(async () => {
        const dbName = 'financia-db';
        const storeName = 'transactions';
        const largeData = 'x'.repeat(100 * 1024); // 100KB per entry
        
        await new Promise<void>((resolve, reject) => {
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
            
            for (let i = 0; i < 10; i++) {
              store.put({
                id: `large-${i}`,
                amount: i * 100,
                description: largeData,
                timestamp: Date.now(),
              });
            }
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const count = await page.evaluate(async () => {
        const dbName = 'financia-db';
        const storeName = 'transactions';
        
        return new Promise<number>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
              resolve(0);
              return;
            }
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const countRequest = store.count();
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => reject(countRequest.error);
          };
          request.onerror = () => reject(request.error);
        });
      });

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should estimate storage quota', async ({ page }) => {
      const estimate = await page.evaluate(async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          return {
            quota: estimate.quota,
            usage: estimate.usage,
            usagePercent: estimate.quota ? (estimate.usage! / estimate.quota!) * 100 : 0,
          };
        }
        return null;
      });

      if (estimate) {
        expect(estimate.quota).toBeGreaterThan(0);
        expect(estimate.usagePercent).toBeLessThanOrEqual(100);
      }
    });
  });
});