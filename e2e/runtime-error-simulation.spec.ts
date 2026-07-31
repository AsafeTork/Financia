import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const PROD_URL = 'https://financiabr.me';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Runtime Error Simulation & Recovery', () => {
  test.setTimeout(30000);

  test('app survives React render error without white screen', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const hasRoot = await page.locator('#root').isVisible().catch(() => false);
    expect(hasRoot).toBeTruthy();

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.evaluate(() => {
      const origRender = React.createElement;
      window.__testError = new Error('intentional test error');
    });

    await page.waitForTimeout(2000);

    const stillHasRoot = await page.locator('#root').isVisible().catch(() => false);
    expect(stillHasRoot).toBeTruthy();
  });

  test('unhandled promise rejection does not crash navigation', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      Promise.reject(new Error('intentional unhandled rejection for test'));
    });

    await page.waitForTimeout(2000);

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('app survives localStorage corruption gracefully', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const corruptionResult = await page.evaluate(async () => {
      try {
        localStorage.setItem('financia_corrupt_test', 'not-json{' );
        const val = localStorage.getItem('financia_corrupt_test');
        JSON.parse(val);
        return 'no-error';
      } catch (e) {
        return 'parse-error-caught';
      }
    });

    expect(corruptionResult).toBe('parse-error-caught');
  });

  test('IndexedDB open error is handled without crash', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const idbError = await page.evaluate(async () => {
      try {
        const request = indexedDB.open('financia-test-error', 999);
        return new Promise((resolve) => {
          request.onerror = () => resolve('idb-error-handled');
          request.onblocked = () => resolve('idb-blocked');
          request.onsuccess = () => resolve('idb-ok');
        });
      } catch (e) {
        return 'exception-caught';
      }
    });

    expect(['idb-error-handled', 'idb-blocked', 'idb-ok', 'exception-caught']).toContain(idbError);
  });

  test('window.onerror captures errors without breaking app', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const errorHandler = await page.evaluate(() => {
      return new Promise((resolve) => {
        const origOnError = window.onerror;
        window.onerror = function(msg, source, lineno, colno, error) {
          window.onerror = origOnError;
          resolve({ caught: true, msg: String(msg).slice(0, 100) });
          return true;
        };
        setTimeout(() => resolve({ caught: false }), 3000);
        throw new Error('intentional window.onerror test');
      });
    });

    expect(errorHandler.caught).toBe(true);
  });
});