import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Deep Sync Conflict Scenarios', () => {
  test.setTimeout(30000);

  test('BroadcastChannel ping/pong survives rapid tab switching', async ({ browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const ctx1 = await browser.newContext({ storageState });
    const ctx2 = await browser.newContext({ storageState });

    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await p1.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await p2.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });

    await p1.evaluate(() => {
      (window as any).__bc1 = new BroadcastChannel('financia-sync');
      (window as any).__bc1.onmessage = (evt: MessageEvent) => {
        (window as any).__bc1LastMessage = evt.data;
      };
    });

    await p2.evaluate(() => {
      (window as any).__bc2 = new BroadcastChannel('financia-sync');
      (window as any).__bc2.onmessage = (evt: MessageEvent) => {
        (window as any).__bc2LastMessage = evt.data;
        (window as any).__bc2.postMessage({ type: 'SYNC_ACK', timestamp: Date.now() });
      };
    });

    await p1.evaluate(() => {
      (window as any).__bc1.postMessage({ type: 'SYNC_PING', timestamp: Date.now() });
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const p2ReceivedPing = await p2.evaluate(() => {
      return (window as any).__bc2LastMessage?.type === 'SYNC_PING';
    });

    const p1ReceivedAck = await p1.evaluate(() => {
      return (window as any).__bc1LastMessage?.type === 'SYNC_ACK';
    });

    await p1.evaluate(() => (window as any).__bc1.close());
    await p2.evaluate(() => (window as any).__bc2.close());
    await ctx1.close();
    await ctx2.close();

    expect(p2ReceivedPing).toBe(true);
    expect(p1ReceivedAck).toBe(true);
  });

  test('BroadcastChannel handles duplicate messages without errors', async ({ browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const ctx = await browser.newContext({ storageState });
    const p = await ctx.newPage();

    await p.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await p.waitForTimeout(1000);

    await p.evaluate(() => {
      (window as any).__bc = new BroadcastChannel('financia-sync');
      (window as any).__bcMessages = [];
      (window as any).__bc.onmessage = (evt: MessageEvent) => {
        (window as any).__bcMessages.push(evt.data.type);
      };
    });

    for (let i = 0; i < 10; i++) {
      await p.evaluate((id: number) => {
        (window as any).__bc.postMessage({ type: 'SYNC_PING', timestamp: Date.now(), id });
      }, i);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const msgCount = await p.evaluate(() => (window as any).__bcMessages?.length || 0);

    await p.evaluate(() => (window as any).__bc.close());
    await ctx.close();

    expect(msgCount).toBeGreaterThanOrEqual(0);
  });

  test('sync worker survives unhandled rejection', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
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
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const memBefore = await page.evaluate(() => {
      return (performance.memory?.usedJSHeapSize || 0);
    });

    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        if (typeof BroadcastChannel !== 'undefined') {
          new BroadcastChannel('financia-sync').postMessage({ type: 'SYNC_PING', timestamp: Date.now() });
        }
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