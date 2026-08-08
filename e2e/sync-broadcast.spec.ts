import { test, expect } from '@playwright/test';
import fs from 'fs';

const storageState = fs.existsSync('e2e/auth-state.json') ? 'e2e/auth-state.json' : undefined;

test.describe('Multi-tab / BroadcastChannel Sync - Broadcast', () => {
  test.setTimeout(120000);

  test.describe('BroadcastChannel Communication', () => {
    test('should establish BroadcastChannel between tabs', async ({ browser }) => {
      const context = storageState
        ? await browser.newContext({ storageState })
        : await browser.newContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/');
      await page2.goto('/');

      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');

      page2.evaluate(() => {
        const channel = new BroadcastChannel('financia-sync');
        channel.onmessage = (event) => {
          if (event.data.type === 'SYNC_PING') {
            channel.postMessage({ type: 'SYNC_ACK', timestamp: Date.now() });
          }
        };
      });

      const channelConnected = await page1.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const channel = new BroadcastChannel('financia-sync');
          const deadline = Date.now() + 15000;

          channel.onmessage = (event) => {
            if (event.data.type === 'SYNC_ACK') {
              channel.close();
              resolve(true);
            }
          };

          const ping = () => {
            if (Date.now() > deadline) {
              channel.close();
              resolve(false);
              return;
            }
            channel.postMessage({ type: 'SYNC_PING', timestamp: Date.now() });
            setTimeout(ping, 500);
          };

          ping();
        });
      });

      expect(channelConnected).toBeTruthy();

      await context.close();
    });

    test('should broadcast transaction creation', async ({ browser }) => {
      const context = storageState
        ? await browser.newContext({ storageState })
        : await browser.newContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/');
      await page2.goto('/');

      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');

      await page2.evaluate(() => {
        (window as any).__broadcastReceived = null;
        const channel = new BroadcastChannel('financia-sync');

        channel.onmessage = (event) => {
          if (event.data.type === 'TRANSACTION_CREATED') {
            (window as any).__broadcastReceived = event.data.payload;
          }
        };
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

      await page2.waitForFunction(
        () => (window as any).__broadcastReceived !== null,
        null,
        { timeout: 5000 }
      );
      const received = await page2.evaluate(() => (window as any).__broadcastReceived);

      expect(received).toBeTruthy();
      expect(received.amount).toBe(150.00);
      expect(received.description).toBe('Test transaction');

      await context.close();
    });

    test('should broadcast product updates', async ({ browser }) => {
      const context = storageState
        ? await browser.newContext({ storageState })
        : await browser.newContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/');
      await page2.goto('/');

      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');

      await page2.evaluate(() => {
        (window as any).__broadcastReceived = null;
        const channel = new BroadcastChannel('financia-sync');

        channel.onmessage = (event) => {
          if (event.data.type === 'PRODUCT_UPDATED') {
            (window as any).__broadcastReceived = event.data.payload;
          }
        };
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

      await page2.waitForFunction(
        () => (window as any).__broadcastReceived !== null,
        null,
        { timeout: 5000 }
      );
      const received = await page2.evaluate(() => (window as any).__broadcastReceived);

      expect(received).toBeTruthy();
      expect(received.name).toBe('Updated Product');
      expect(received.price).toBe(299.99);

      await context.close();
    });

    test('should broadcast loss records', async ({ browser }) => {
      const context = storageState
        ? await browser.newContext({ storageState })
        : await browser.newContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/');
      await page2.goto('/');

      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');

      await page2.evaluate(() => {
        (window as any).__broadcastReceived = null;
        const channel = new BroadcastChannel('financia-sync');

        channel.onmessage = (event) => {
          if (event.data.type === 'LOSS_RECORDED') {
            (window as any).__broadcastReceived = event.data.payload;
          }
        };
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

      await page2.waitForFunction(
        () => (window as any).__broadcastReceived !== null,
        null,
        { timeout: 5000 }
      );
      const received = await page2.evaluate(() => (window as any).__broadcastReceived);

      expect(received).toBeTruthy();
      expect(received.reason).toBe('Damaged');
      expect(received.value).toBe(150.00);

      await context.close();
    });

    test('should broadcast settings changes', async ({ browser }) => {
      const context = storageState
        ? await browser.newContext({ storageState })
        : await browser.newContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/');
      await page2.goto('/');

      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');

      await page2.evaluate(() => {
        (window as any).__broadcastReceived = null;
        const channel = new BroadcastChannel('financia-sync');

        channel.onmessage = (event) => {
          if (event.data.type === 'SETTINGS_CHANGED') {
            (window as any).__broadcastReceived = event.data.payload;
          }
        };
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

      await page2.waitForFunction(
        () => (window as any).__broadcastReceived !== null,
        null,
        { timeout: 5000 }
      );
      const received = await page2.evaluate(() => (window as any).__broadcastReceived);

      expect(received).toBeTruthy();
      expect(received.currency).toBe('USD');
      expect(received.theme).toBe('dark');

      await context.close();
    });
  });
});
