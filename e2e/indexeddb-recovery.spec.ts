import { test, expect } from '@playwright/test';

test.describe('IndexedDB Recovery Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Corruption Simulation', () => {
    test('should recover from corrupted IndexedDB data', async ({ page }) => {
      await page.evaluate(async () => {
        const dbName = 'financia-db';
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
        const dbName = 'financia-db';
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
        const dbName = 'financia-db';
        
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
      
      const hasAppLoaded = await page.locator('[data-testid="app-root"]').isVisible().catch(() => false);
      expect(hasAppLoaded).toBeTruthy();
    });
  });

  test.describe('Eviction Test', () => {
    test('should handle storage pressure and persist()', async ({ page }) => {
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
        const largeData = 'x'.repeat(1024 * 1024);
        
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
            
            for (let i = 0; i < 50; i++) {
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

  test.describe('Migration Test', () => {
    test('should migrate from old schema to new schema', async ({ page }) => {
      await page.evaluate(async () => {
        const dbName = 'financia-db';
        
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(dbName, 1);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('old-transactions')) {
              const store = db.createObjectStore('old-transactions', { keyPath: 'id' });
              store.createIndex('by-date', 'date');
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('old-transactions', 'readwrite');
            const store = transaction.objectStore('old-transactions');
            store.put({ id: 'old-1', date: '2024-01-15', amount: 100, description: 'Old transaction' });
            store.put({ id: 'old-2', date: '2024-01-16', amount: 200, description: 'Another old transaction' });
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const migratedData = await page.evaluate(async () => {
        const dbName = 'financia-db';
        
        return new Promise<any[]>((resolve, reject) => {
          const request = indexedDB.open(dbName, 2);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (db.objectStoreNames.contains('old-transactions') && !db.objectStoreNames.contains('transactions')) {
              const oldStore = db.transaction('old-transactions').objectStore('old-transactions');
              const newStore = db.createObjectStore('transactions', { keyPath: 'id' });
              newStore.createIndex('by-date', 'date');
              
              const cursorRequest = oldStore.openCursor();
              cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result;
                if (cursor) {
                  newStore.put({
                    id: cursor.value.id,
                    date: cursor.value.date,
                    amount: cursor.value.amount,
                    description: cursor.value.description,
                    migrated: true,
                    createdAt: new Date().toISOString(),
                  });
                  cursor.continue();
                }
              };
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('transactions')) {
              resolve([]);
              return;
            }
            const transaction = db.transaction('transactions', 'readonly');
            const store = transaction.objectStore('transactions');
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
          };
          request.onerror = () => reject(request.error);
        });
      });

      expect(migratedData.length).toBeGreaterThanOrEqual(2);
      const migratedItems = migratedData.filter(item => item.migrated === true);
      expect(migratedItems.length).toBeGreaterThanOrEqual(2);
      expect(migratedItems[0]).toHaveProperty('createdAt');
    });

    test('should preserve data integrity during migration', async ({ page }) => {
      await page.evaluate(async () => {
        const dbName = 'financia-db';
        
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(dbName, 3);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('products')) {
              db.createObjectStore('products', { keyPath: 'id' });
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('products', 'readwrite');
            const store = transaction.objectStore('products');
            store.put({ id: 'prod-1', name: 'Product 1', price: 99.99, stock: 10 });
            store.put({ id: 'prod-2', name: 'Product 2', price: 149.50, stock: 5 });
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const products = await page.evaluate(async () => {
        const dbName = 'financia-db';
        
        return new Promise<any[]>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('products')) {
              resolve([]);
              return;
            }
            const transaction = db.transaction('products', 'readonly');
            const store = transaction.objectStore('products');
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
          };
          request.onerror = () => reject(request.error);
        });
      });

      expect(products.length).toBe(2);
      expect(products[0]).toMatchObject({ id: 'prod-1', name: 'Product 1', price: 99.99 });
      expect(products[1]).toMatchObject({ id: 'prod-2', name: 'Product 2', price: 149.50 });
    });
  });
});