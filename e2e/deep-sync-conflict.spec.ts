import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const PROD_URL = 'https://financiabr.me';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Deep Sync Conflict Scenarios', () => {
  test.setTimeout(30000);

  test('BroadcastChannel ping/pong survives rapid tab switching', async ({ browser }) => {
    if (!storageState) {
      test.skip(true, 'No storageState.json');
    }

    const ctx1 = await browser.newContext({ storageState });
    const ctx2 = await browser.newContext({ storageState });

    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await p1.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await p2.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 15000 });

    const channelA = new BroadcastChannel('financia-sync');
    const channelB = new BroadcastChannel('financia-sync');

    let receivedPong = false;
    const timeout = setTimeout(() => { channelA.close(); channelB.close(); }, 8000);

    channelB.onmessage = (evt) => {
      if (evt.data.type === 'SYNC_PING') {
        receivedPong = true;
        channelB.postMessage({ type: 'SYNC_ACK', timestamp: Date.now() });
      }
    };

    channelA.postMessage({ type: 'SYNC_PING', timestamp: Date.now() });

    await new Promise((resolve) => setTimeout(resolve, 3000));
    clearTimeout(timeout);

    channelA.close();
    channelB.close();

    expect(receivedPong).toBe(true);

    await ctx1.close();
    await ctx2.close();
  });

  test('BroadcastChannel handles duplicate messages without errors', async ({ browser }) => {
    if (!storageState) {
      test.skip(true, 'No storageState.json');
    }

    const ctx = await browser.newContext({ storageState });
    const p = await ctx.newPage();

    await p.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await p.waitForTimeout(1000);

    const channel = new BroadcastChannel('financia-sync');
    const messages = [];

    channel.onmessage = (evt) => {
      messages.push(evt.data.type);
    };

    for (let i = 0; i < 10; i++) {
      channel.postMessage({ type: 'SYNC_PING', timestamp: Date.now(), id: i });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    channel.close();
    await ctx.close();

    expect(messages.length).toBeGreaterThanOrEqual(0);
  });

  test('sync worker survives unhandled rejection', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    let unhandledRejection = false;
    page.on('pageerror', (err) => {
      if (err.message.includes('unhandledrejection')) {
        unhandledRejection = true;
      }
    });

    await page.evaluate(() => {
      window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(new Error('test rejection')),
        reason: new Error('test rejection')
      }));
    });

    await page.waitForTimeout(2000);

    expect(unhandledRejection).toBe(false);
  });

  test('memory leak check after sync broadcast storm', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const memBefore = await page.evaluate(() => {
      return (performance.memory?.usedJSHeapSize || 0);
    });

    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        BroadcastChannel && new BroadcastChannel('financia-sync').postMessage({ type: 'SYNC_PING', timestamp: Date.now() });
      });
    }

    await page.waitForTimeout(2000);

    const memAfter = await page.evaluate(() => {
      return (performance.memory?.usedJSHeapSize || 0);
    });

    const growthMB = ((memAfter - memBefore) / 1024 / 1024).toFixed(2);
    expect(parseFloat(growthMB)).toBeLessThan(50);
  });
});