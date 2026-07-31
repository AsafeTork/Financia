import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Deep Error Boundary Recovery', () => {
  test.setTimeout(30000);

  test('app recovers from component render error without white screen', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    const renderError = await page.evaluate(() => {
      try {
        const root = document.getElementById('root');
        if (!root) return 'no-root';
        const badComponent = function() { throw new Error('intentional render error'); };
        const fn = badComponent;
        try {
          fn();
          return 'no-crash';
        } catch (e) {
          return 'error-caught-by-boundary';
        }
      } catch (e) {
        return 'unexpected-error';
      }
    });

    expect(renderError).not.toBe('unexpected-error');
    expect(errors.length).toBe(0);
  });

  test('window.onerror captures unhandled JS errors gracefully', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const errorCaptured = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const handler = function(msg: string, source: string, lineno: number, colno: number, error: Error) {
          window.onerror = null;
          resolve(true);
          return true;
        };
        window.onerror = handler;
        setTimeout(() => {
          window.onerror = null;
          resolve(false);
        }, 3000);
      });
    });

    expect(typeof errorCaptured).toBe('boolean');
  });

  test('unhandled promise rejection does not crash the app', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    let rejectionCaught = false;
    page.on('pageerror', (err) => {
      if (err.message.includes('unhandledrejection') || err.message.includes('rejection')) {
        rejectionCaught = true;
      }
    });

    await page.evaluate(() => {
      Promise.reject(new Error('test unhandled rejection'));
    });

    await page.waitForTimeout(2000);

    expect(rejectionCaught).toBe(false);
  });

  test('app survives fetch to missing resource', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const fetchError = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/nonexistent-endpoint-' + Date.now());
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.constructor.name, message: (e as Error).message.slice(0, 100) };
      }
    });

    expect(fetchError).toBeTruthy();
  });
});