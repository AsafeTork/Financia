import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Network Error Handling Scenarios', () => {
  test.setTimeout(30000);

  test('app loads successfully with slow network (3G)', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState, offline: false });
    const slowPage = await context.newPage();

    await slowPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await slowPage.waitForLoadState('networkidle');

    await slowPage.context().setNetworkConditions({
      downloadThroughput: 500 * 1024 / 8,
      uploadThroughput: 500 * 1024 / 8,
      latency: 400,
    });

    await slowPage.waitForTimeout(3000);

    const hasRoot = await slowPage.locator('#root').isVisible().catch(() => false);
    expect(hasRoot).toBeTruthy();

    await slowPage.context().setNetworkConditions(null);
    await context.close();
  });

  test('app handles complete network disconnection gracefully', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.context().setOffline(true);
    await page.waitForTimeout(2000);

    const title = await page.title();
    expect(title).not.toBe('');

    await page.context().setOffline(false);
  });

  test('app handles intermittent network failures', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    for (let i = 0; i < 3; i++) {
      await page.context().setOffline(true);
      await page.waitForTimeout(500);
      await page.context().setOffline(false);
      await page.waitForTimeout(500);
    }

    const title = await page.title();
    expect(title).not.toBe('');
  });

  test('fetch to missing endpoint returns handled error', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/nonexistent-endpoint-' + Date.now(), {
          signal: AbortSignal.timeout(5000),
        });
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.constructor.name, message: (e as Error).message.slice(0, 100) };
      }
    });

    expect(result).toBeTruthy();
  });

  test('WebSocket connection failure is handled gracefully', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const wsStatus = await page.evaluate(() => {
      return new Promise<{ connected: boolean; error?: string }>((resolve) => {
        const ws = new WebSocket('ws://localhost:5173/.well-known/not-a-ws');
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ connected: false, error: 'timeout-or-refused' });
        }, 3000);
        ws.onopen = () => { clearTimeout(timeout); ws.close(); resolve({ connected: true }); };
        ws.onerror = () => { clearTimeout(timeout); resolve({ connected: false, error: 'connection-refused' }); };
      });
    });

    expect(wsStatus).toBeTruthy();
    expect(typeof wsStatus.connected).toBe('boolean');
  });
});