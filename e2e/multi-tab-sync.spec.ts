import { test, expect } from '@playwright/test';

test.describe('Multi-tab / BroadcastChannel Sync Tests', () => {
  test.beforeEach(async ({ browser }) => {
    const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
    const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('/');
    await page2.goto('/');
    
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    test.setTimeout(60000);
  });

  test.describe('BroadcastChannel Communication', () => {
    test('should establish BroadcastChannel between tabs', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const channelConnected = await page1.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const channel = new BroadcastChannel('financia-sync');
          
          channel.onmessage = (event) => {
            if (event.data.type === 'SYNC_ACK') {
              channel.close();
              resolve(true);
            }
          };
          
          setTimeout(() => {
            channel.close();
            resolve(false);
          }, 5000);
          
          channel.postMessage({ type: 'SYNC_PING', timestamp: Date.now() });
        });
      });

      expect(channelConnected).toBeTruthy();
      
      await context1.close();
      await context2.close();
    });

    test('should broadcast transaction creation', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const received = await page2.evaluate(async () => {
        return new Promise<any>((resolve) => {
          const channel = new BroadcastChannel('financia-sync');
          
          channel.onmessage = (event) => {
            if (event.data.type === 'TRANSACTION_CREATED') {
              channel.close();
              resolve(event.data.payload);
            }
          };
          
          setTimeout(() => {
            channel.close();
            resolve(null);
          }, 5000);
        });
      });

      await page1.evaluate(async () => {
        const channel = new BroadcastChannel('financia-sync');
        const transaction = {
          id: `txn-${Date.now()}`,
          amount: 150.00,
          description: 'Test transaction',
          type: 'expense',
          category: 'Food',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        
        channel.postMessage({
          type: 'TRANSACTION_CREATED',
          payload: transaction,
          timestamp: Date.now(),
        });
        channel.close();
      });

      expect(received).toBeTruthy();
      expect(received.amount).toBe(150.00);
      expect(received.description).toBe('Test transaction');
      
      await context1.close();
      await context2.close();
    });

    test('should broadcast product updates', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const received = await page2.evaluate(async () => {
        return new Promise<any>((resolve) => {
          const channel = new BroadcastChannel('financia-sync');
          
          channel.onmessage = (event) => {
            if (event.data.type === 'PRODUCT_UPDATED') {
              channel.close();
              resolve(event.data.payload);
            }
          };
          
          setTimeout(() => {
            channel.close();
            resolve(null);
          }, 5000);
        });
      });

      await page1.evaluate(async () => {
        const channel = new BroadcastChannel('financia-sync');
        const product = {
          id: `prod-${Date.now()}`,
          name: 'Updated Product',
          price: 299.99,
          stock: 50,
          updatedAt: new Date().toISOString(),
        };
        
        channel.postMessage({
          type: 'PRODUCT_UPDATED',
          payload: product,
          timestamp: Date.now(),
        });
        channel.close();
      });

      expect(received).toBeTruthy();
      expect(received.name).toBe('Updated Product');
      expect(received.price).toBe(299.99);
      
      await context1.close();
      await context2.close();
    });

    test('should broadcast loss records', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const received = await page2.evaluate(async () => {
        return new Promise<any>((resolve) => {
          const channel = new BroadcastChannel('financia-sync');
          
          channel.onmessage = (event) => {
            if (event.data.type === 'LOSS_RECORDED') {
              channel.close();
              resolve(event.data.payload);
            }
          };
          
          setTimeout(() => {
            channel.close();
            resolve(null);
          }, 5000);
        });
      });

      await page1.evaluate(async () => {
        const channel = new BroadcastChannel('financia-sync');
        const loss = {
          id: `loss-${Date.now()}`,
          productId: 'prod-1',
          quantity: 5,
          reason: 'Damaged',
          value: 150.00,
          recordedAt: new Date().toISOString(),
        };
        
        channel.postMessage({
          type: 'LOSS_RECORDED',
          payload: loss,
          timestamp: Date.now(),
        });
        channel.close();
      });

      expect(received).toBeTruthy();
      expect(received.reason).toBe('Damaged');
      expect(received.value).toBe(150.00);
      
      await context1.close();
      await context2.close();
    });

    test('should broadcast settings changes', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const received = await page2.evaluate(async () => {
        return new Promise<any>((resolve) => {
          const channel = new BroadcastChannel('financia-sync');
          
          channel.onmessage = (event) => {
            if (event.data.type === 'SETTINGS_CHANGED') {
              channel.close();
              resolve(event.data.payload);
            }
          };
          
          setTimeout(() => {
            channel.close();
            resolve(null);
          }, 5000);
        });
      });

      await page1.evaluate(async () => {
        const channel = new BroadcastChannel('financia-sync');
        const settings = {
          currency: 'USD',
          theme: 'dark',
          notifications: true,
          language: 'en',
          updatedAt: new Date().toISOString(),
        };
        
        channel.postMessage({
          type: 'SETTINGS_CHANGED',
          payload: settings,
          timestamp: Date.now(),
        });
        channel.close();
      });

      expect(received).toBeTruthy();
      expect(received.currency).toBe('USD');
      expect(received.theme).toBe('dark');
      
      await context1.close();
      await context2.close();
    });
  });

  test.describe('IndexedDB Sync via BroadcastChannel', () => {
    test('should sync IndexedDB writes across tabs', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      await page1.evaluate(async () => {
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

      const channel = new BroadcastChannel('financia-sync');
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
      
      await context1.close();
      await context2.close();
    });
  });

  test.describe('Conflict Resolution (Last-Write-Wins)', () => {
    test('should resolve concurrent transaction updates with last-write-wins', async ({ browser }) => {
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
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

      await page2.waitForTimeout(1000);

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
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
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

      await page2.waitForTimeout(1000);

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
      const context1 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      const context2 = await browser.newContext({ storageState: 'e2e/auth-state.json' });
      
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
          
          setTimeout(() => resolve(null), 5000);
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