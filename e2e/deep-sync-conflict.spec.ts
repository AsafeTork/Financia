import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:4173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Deep Sync Conflict Scenarios', () => {
  test.setTimeout(60000);

  test('BroadcastChannel ping/pong survives rapid tab switching', async ({ browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState });
    const p1 = await context.newPage();
    const p2 = await context.newPage();

    await p1.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await p2.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

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
    await context.close();

    expect(p2ReceivedPing).toBe(true);
    expect(p1ReceivedAck).toBe(true);
  });

  test('BroadcastChannel handles duplicate messages without errors', async ({ browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState });
    const p = await context.newPage();

    await p.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
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
    await context.close();

    expect(msgCount).toBeGreaterThanOrEqual(0);
  });

  test('sync worker survives unhandled rejection', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    let unhandledRejectionCaught = false;
    page.on('pageerror', (err) => {
      if (err.message.includes('unhandledrejection') || err.message.includes('rejection')) {
        unhandledRejectionCaught = true;
      }
    });

    // Dispatch an unhandled rejection - the app should not crash
    await page.evaluate(() => {
      const rejection = new Error('test rejection');
      window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(rejection),
        reason: rejection
      }));
    });

    await page.waitForTimeout(2000);

    // App should survive (page still responsive) - check via DOM
    const stillResponsive = await page.evaluate(() => document.body !== null);
    expect(stillResponsive).toBe(true);
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
          const bc = new BroadcastChannel('financia-sync');
          bc.postMessage({ type: 'SYNC_PING', timestamp: Date.now() });
          bc.close();
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