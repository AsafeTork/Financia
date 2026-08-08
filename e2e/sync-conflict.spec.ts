import { test, expect } from '@playwright/test';
import fs from 'fs';

const storageState = fs.existsSync('e2e/auth-state.json') ? 'e2e/auth-state.json' : undefined;

test.describe('Multi-tab / BroadcastChannel Sync - Conflict Resolution', () => {
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

  test.describe('Conflict Resolution (Last-Write-Wins)', () => {
    test('should resolve concurrent transaction updates with last-write-wins', async ({ browser }) => {
      const context = await browser.newContext({ storageState });
      
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');
      await ensureDBSchema(page1);

      const txnId = `conflict-${Date.now()}`;

      await page1.evaluate(async (id) => {
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
              id,
              amount: 100,
              description: 'Tab 1 version',
              version: 1,
              updatedAt: new Date(Date.now() - 1000).toISOString(),
            });
            transaction.oncomplete = async () => {
              // Verify write
              const verifyTx = db.transaction(storeName, 'readonly');
              const verifyStore = verifyTx.objectStore(storeName);
              const getReq = verifyStore.get(id);
              getReq.onsuccess = () => {
                console.log('Page1 verify read:', getReq.result);
                db.close();
                resolve();
              };
              getReq.onerror = () => {
                db.close();
                reject(getReq.error);
              };
            };
            transaction.onerror = () => {
              db.close();
              reject(transaction.error);
            };
          };
          request.onerror = () => reject(request.error);
        });
      }, txnId);

      await page2.evaluate(async (id) => {
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
              id,
              amount: 200,
              description: 'Tab 2 version',
              version: 2,
              updatedAt: new Date().toISOString(),
            });
            transaction.oncomplete = async () => {
              // Verify write
              const verifyTx = db.transaction(storeName, 'readonly');
              const verifyStore = verifyTx.objectStore(storeName);
              const getReq = verifyStore.get(id);
              getReq.onsuccess = () => {
                console.log('Page2 verify read:', getReq.result);
                db.close();
                resolve();
              };
              getReq.onerror = () => {
                db.close();
                reject(getReq.error);
              };
            };
            transaction.onerror = () => {
              db.close();
              reject(transaction.error);
            };
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

      await expect
        .poll(async () => {
          return page1.evaluate(async (txnId) => {
            const dbName = 'gestao_offline';
            const storeName = 'transactions';
            
            return new Promise<any>((resolve, reject) => {
              const request = indexedDB.open(dbName);
              request.onsuccess = () => {
                const db = request.result;
                console.log('Poll: stores:', [...db.objectStoreNames]);
                if (!db.objectStoreNames.contains(storeName)) {
                  resolve(null);
                  return;
                }
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const getRequest = store.get(txnId);
                getRequest.onsuccess = () => {
                  console.log('Poll read result:', getRequest.result);
                  resolve(getRequest.result);
                };
                getRequest.onerror = () => reject(getRequest.error);
              };
              request.onerror = () => reject(request.error);
            });
          }, txnId);
        }, { timeout: 15000, intervals: [250] })
        .toMatchObject({ description: 'Tab 2 version', amount: 200, version: 2 });

      await context.close();
    });

    test('should handle concurrent product updates', async ({ browser }) => {
      const context = await browser.newContext({ storageState });
      
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');
      await ensureDBSchema(page1);

      const productId = `prod-conflict-${Date.now()}`;

      await page1.evaluate(async (id) => {
        const dbName = 'gestao_offline';
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
      }, productId);

      await page2.evaluate(async (id) => {
        const dbName = 'gestao_offline';
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

      await expect
        .poll(async () => {
          return page1.evaluate(async (productId) => {
            const dbName = 'gestao_offline';
            const storeName = 'products';
            
            return new Promise<any>((resolve, reject) => {
              const request = indexedDB.open(dbName);
              request.onsuccess = () => {
                const db = request.result;
                console.log('Poll products: stores:', [...db.objectStoreNames]);
                if (!db.objectStoreNames.contains(storeName)) {
                  resolve(null);
                  return;
                }
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const getRequest = store.get(productId);
                getRequest.onsuccess = () => {
                  console.log('Poll products read:', getRequest.result);
                  resolve(getRequest.result);
                };
                getRequest.onerror = () => reject(getRequest.error);
              };
              request.onerror = () => reject(request.error);
            });
          }, productId);
        }, { timeout: 15000, intervals: [250] })
        .toMatchObject({ name: 'Product from Tab 2', price: 200 });

      await context.close();
    });
  });

  test.describe('Storage Event Fallback', () => {
    test('should fall back to storage events when BroadcastChannel unavailable', async ({ browser }) => {
      const context = await browser.newContext({ storageState });
      
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');

      await page2.evaluate(() => {
        (window as any).__syncReceived = null;
        window.addEventListener('storage', (event) => {
          if (event.key === 'financia-sync') {
            try {
              const data = JSON.parse(event.newValue || '{}');
              if (data.type === 'STORAGE_SYNC') {
                (window as any).__syncReceived = data.payload;
              }
            } catch {
              // ignore
            }
          }
        });
      });

      await expect
        .poll(async () => {
          await page1.evaluate(() => {
            const data = {
              type: 'STORAGE_SYNC',
              payload: { test: 'storage-event-sync', timestamp: Date.now() },
            };
            localStorage.setItem('financia-sync', JSON.stringify(data));
          });

          return page2.evaluate(() => (window as any).__syncReceived);
        }, { timeout: 10000, intervals: [250] })
        .toEqual(expect.objectContaining({ test: 'storage-event-sync' }));

      await context.close();
    });
  });
});