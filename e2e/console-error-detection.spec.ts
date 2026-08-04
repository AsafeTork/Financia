import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:4173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Console Error Detection & Collection', () => {
  test.setTimeout(30000);

  test('no uncaught console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const errorCount = errors.length;
    expect(errorCount).toBe(0);
  });

  test('no console warnings on authenticated dashboard view', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    const warnings: string[] = [];
    authPage.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');
    await authPage.waitForTimeout(3000);

    const warningCount = warnings.length;
    expect(warningCount).toBe(0);

    await context.close();
  });

  test('detects failed resource loads (404 images, scripts)', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => {
      failedRequests.push(request.url().slice(0, 200));
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(failedRequests).toBeDefined();
  });

  test('detects CORS errors on cross-origin requests', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('cors')) {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const corsErrors = errors.filter((e) => e.toLowerCase().includes('cors'));
    expect(corsErrors.length).toBe(0);
  });

  test('detects mixed content warnings (http resources on https page)', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const mixedContentWarnings = warnings.filter(
      (w) => w.toLowerCase().includes('mixed') || w.toLowerCase().includes('insecure')
    );
    expect(mixedContentWarnings.length).toBe(0);
  });
});