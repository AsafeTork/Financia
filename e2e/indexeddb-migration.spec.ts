import { test, expect } from '@playwright/test';

test.describe('IndexedDB Recovery - Migration', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
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