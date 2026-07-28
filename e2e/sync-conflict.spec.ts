import { test, expect } from '@playwright/test';
import fs from 'fs';

const storageState = fs.existsSync('e2e/auth-state.json') ? 'e2e/auth-state.json' : undefined;

test.describe('Multi-tab / BroadcastChannel Sync - Conflict Resolution', () => {
  test.setTimeout(120000);

  test.describe('Conflict Resolution (Last-Write-Wins)', () => {
    test('should resolve concurrent transaction updates with last-write-wins', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState });
      const context2 = await browser.newContext({ storageState });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const txnId = `conflict-${Date.now()}`;

      await page1.evaluate(async (id) => {
        const dbName = 'financia-db';
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
              id,
              amount: 100,
              description: 'Tab 1 version',
              version: 1,
              updatedAt: new Date(Date.now() - 1000).toISOString(),
            });
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      }, txnId);

      await page2.evaluate(async (id) => {
        const dbName = 'financia-db';
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
              id,
              amount: 200,
              description: 'Tab 2 version',
              version: 2,
              updatedAt: new Date().toISOString(),
            });
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      }, txnId);

      await page1.evaluate((id) => {
        const channel = new BroadcastChannel('financia-sync');
        channel.postMessage({
          type: 'CONFLICT_RESOLVE',
          store: 'transactions',
          key: id,
          strategy: 'last-write-wins',
          timestamp: Date.now(),
        });
        channel.close();
      }, txnId);

      await page2.waitForTimeout(2000);

      const resolved = await page1.evaluate(async (id) => {
        const dbName = 'financia-db';
        const storeName = 'transactions';
        
        return new Promise<any>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
              resolve(null);
              return;
            }
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get(id);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
          };
          request.onerror = () => reject(request.error);
        });
      }, txnId);

      expect(resolved).toBeTruthy();
      expect(resolved.description).toBe('Tab 2 version');
      expect(resolved.amount).toBe(200);
      expect(resolved.version).toBe(2);
      
      await context1.close();
      await context2.close();
    });

    test('should handle concurrent product updates', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState });
      const context2 = await browser.newContext({ storageState });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const productId = `prod-conflict-${Date.now()}`;

      await page1.evaluate(async (id) => {
        const dbName = 'financia-db';
        const storeName = 'products';
        
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
              id,
              name: 'Product from Tab 1',
              price: 100,
              stock: 10,
              updatedAt: new Date(Date.now() - 1000).toISOString(),
            });
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      }, productId);

      await page2.evaluate(async (id) => {
        const dbName = 'financia-db';
        const storeName = 'products';
        
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
              id,
              name: 'Product from Tab 2',
              price: 200,
              stock: 20,
              updatedAt: new Date().toISOString(),
            });
            db.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      }, productId);

      await page1.evaluate((id) => {
        const channel = new BroadcastChannel('financia-sync');
        channel.postMessage({
          type: 'CONFLICT_RESOLVE',
          store: 'products',
          key: id,
          strategy: 'last-write-wins',
          timestamp: Date.now(),
        });
        channel.close();
      }, productId);

      await page2.waitForTimeout(2000);

      const resolved = await page1.evaluate(async (id) => {
        const dbName = 'financia-db';
        const storeName = 'products';
        
        return new Promise<any>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
              resolve(null);
              return;
            }
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get(id);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
          };
          request.onerror = () => reject(request.error);
        });
      }, productId);

      expect(resolved).toBeTruthy();
      expect(resolved.name).toBe('Product from Tab 2');
      expect(resolved.price).toBe(200);
      
      await context1.close();
      await context2.close();
    });
  });

  test.describe('Storage Event Fallback', () => {
    test('should fall back to storage events when BroadcastChannel unavailable', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState });
      const context2 = await browser.newContext({ storageState });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const received = await page2.evaluate(async () => {
        return new Promise<any>((resolve) => {
          window.addEventListener('storage', (event) => {
            if (event.key === 'financia-sync') {
              try {
                const data = JSON.parse(event.newValue || '{}');
                if (data.type === 'STORAGE_SYNC') {
                  resolve(data.payload);
                }
              } catch {
                // ignore
              }
            }
          });
          
          setTimeout(() => resolve(null), 10000);
        });
      });

      await page1.evaluate(() => {
        const data = {
          type: 'STORAGE_SYNC',
          payload: { test: 'storage-event-sync', timestamp: Date.now() },
        };
        localStorage.setItem('financia-sync', JSON.stringify(data));
      });

      expect(received).toBeTruthy();
      expect(received.test).toBe('storage-event-sync');
      
      await context1.close();
      await context2.close();
    });
  });
});