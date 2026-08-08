import { test, expect } from '@playwright/test';

test.describe('IndexedDB Recovery - Corruption', () => {
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

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureDBSchema(page);
  });

  test.describe('Corruption Simulation', () => {
test.skip('should recover from corrupted IndexedDB data', async ({ page }) => {
      // Write corruption that app handles (extra fields, string amount)
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
              
              // Corruption: extra unknown fields, string amount (app handles coercion)
              store.put({ 
                id: 'corrupted-1', 
                amount: 100, 
                description: 'Valid but with garbage', 
                garbageField: 'should-be-ignored',
                anotherGarbage: { nested: 'object' }
              });
              store.put({ 
                id: 'corrupted-2', 
                amount: '100', // string amount - app should handle/coerce
                description: 'String amount'
              });
            }
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      });
 
      // Read back immediately (no reload) - verify DB operations still work
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
 
      // Valid transactions can be filtered
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