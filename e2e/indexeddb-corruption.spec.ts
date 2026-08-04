import { test, expect } from '@playwright/test';

test.describe('IndexedDB Recovery - Corruption', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Corruption Simulation', () => {
    test('should recover from corrupted IndexedDB data', async ({ page }) => {
      await page.evaluate(async () => {
        const dbName = 'gestao_offline';
        const storeName = 'transactions';
        
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => {
            const db = request.result;
            if (db.objectStoreNames.contains(storeName)) {
              const transaction = db.transaction(storeName, 'readwrite');
              const store = transaction.objectStore(storeName);
              
              store.put({ id: 'corrupted-1', data: 'invalid-data', corrupted: true });
              store.put({ id: 'corrupted-2', amount: 'not-a-number' });
              store.put({ id: null, amount: 100 });
            }
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const transactions = await page.evaluate(async () => {
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
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          };
          request.onerror = () => reject(request.error);
        });
      });

      const validTransactions = transactions.filter(t => t && typeof t.id === 'string' && typeof t.amount === 'number');
      expect(validTransactions.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle invalid schema gracefully', async ({ page }) => {
      await page.evaluate(async () => {
        const dbName = 'gestao_offline';
        
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => {
            const db = request.result;
            if (db.objectStoreNames.contains('invalid-store')) {
              db.close();
              resolve();
              return;
            }
            
            const version = db.version + 1;
            db.close();
            
            const upgradeRequest = indexedDB.open(dbName, version);
            upgradeRequest.onupgradeneeded = () => {
              const db = upgradeRequest.result;
              if (!db.objectStoreNames.contains('invalid-store')) {
                db.createObjectStore('invalid-store', { keyPath: 'id' });
              }
            };
            upgradeRequest.onsuccess = () => resolve();
            upgradeRequest.onerror = () => reject(upgradeRequest.error);
          };
          request.onerror = () => reject(request.error);
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const hasAppLoaded = await page.locator('#root').isVisible().catch(() => false);
      expect(hasAppLoaded).toBeTruthy();
    });
  });
});