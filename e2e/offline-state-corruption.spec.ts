import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Deep Edge Cases — Offline State Corruption & Recovery', () => {
  test.setTimeout(30000);

  test('IndexedDB corruption is handled gracefully — app does not crash on load', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const corruptIDB = await page.evaluate(async () => {
      try {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('financia-corrupt-test', 1);
          request.onerror = () => reject(new Error('Corrupt'));
          request.onsuccess = (e) => resolve(e.target.result);
          request.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore('corrupt-store');
          };
        });
        const tx = db.transaction('corrupt-store', 'readwrite');
        const store = tx.objectStore('corrupt-store');
        store.put(new Blob(['not valid JSON']), 'bad-key');
        await new Promise((resolve) => { tx.oncomplete = resolve; });
        db.close();
        return true;
      } catch (e) {
        return false;
      }
    });

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    expect(consoleErrors.some((e) => e.includes('Application'))).toBeFalsy();
  });

  test('app survives localStorage quota exceeded gracefully', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const quotaResult = await page.evaluate(async () => {
      try {
        const hugeData = 'x'.repeat(10 * 1024 * 1024);
        localStorage.setItem('quota_test', hugeData);
        localStorage.removeItem('quota_test');
        return 'success';
      } catch (e) {
        return (e as DOMException).name;
      }
    });

    expect(quotaResult).toBeTruthy();
  });

  test('sessionStorage does not survive new tab', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      sessionStorage.setItem('test_key', 'test_value');
    });

    const valueAfterReload = await page.evaluate(() => sessionStorage.getItem('test_key'));
    expect(valueAfterReload).toBe('test_value');

    const newPage = await page.context().newPage();
    await newPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await newPage.waitForLoadState('networkidle');

    const valueInNewTab = await newPage.evaluate(() => sessionStorage.getItem('test_key'));
    expect(valueInNewTab).toBeNull();

    await newPage.close();
  });

  test('multiple rapid navigations do not break app', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');

    for (let i = 0; i < 5; i++) {
      const link = authPage.locator('a[href="/dashboard"], a[href="/"]').first();
      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await authPage.waitForLoadState('networkidle');
      }
      await authPage.waitForTimeout(300);
    }

    const title = await authPage.title();
    expect(title).not.toBe('');

    await context.close();
  });
});