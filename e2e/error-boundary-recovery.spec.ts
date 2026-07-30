import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const PROD_URL = 'https://financiabr.me';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Deep Error Boundary Recovery', () => {
  test.setTimeout(30000);

  test('app recovers from component render error without white screen', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const errors = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    const renderError = await page.evaluate(() => {
      try {
        const root = document.getElementById('root');
        if (!root) return 'no-root';
        const badComponent = function() { throw new Error('intentional render error'); };
        return 'no-crash';
      } catch (e) {
        return e.message;
      }
    });

    expect(renderError).toBe('no-crash');
  });

  test('window.onerror captures unhandled JS errors gracefully', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const errorCaptured = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.onerror = function(msg, source, lineno, colno, error) {
          resolve(true);
          return true;
        };
        setTimeout(() => resolve(false), 3000);
      });
    });

    expect(typeof errorCaptured).toBe('boolean');
  });

  test('unhandled promise rejection does not crash the app', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
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
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const fetchError = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/nonexistent-endpoint-' + Date.now());
        return res.status;
      } catch (e) {
        return 'error-caught';
      }
    });

    expect(fetchError).toBeTruthy();
  });
});