import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:4173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

const CRITICAL_PATTERNS = [
  /ReferenceError/i,
  /TypeError/i,
  /SyntaxError/i,
  /is not a function/i,
  /Cannot read propert/i,
  /before initialization/i,
  /is not defined/i,
  /Unexpected token/i,
  /ChunkLoadError/i,
];

const IGNORED_WARNINGS = [
  /Warning: An update to .* was not wrapped in act/i,
  /DevTools/i,
  /Download the React DevTools/i,
  /Third-party cookie/i,
  /favicon/i,
];

function isCriticalError(text: string): boolean {
  return CRITICAL_PATTERNS.some((p) => p.test(text));
}

function isIgnoredWarning(text: string): boolean {
  return IGNORED_WARNINGS.some((p) => p.test(text));
}

const APP_ROUTES = [
  '',
  'dashboard',
  'vendas',
  'despesas',
  'estoque',
  'perdas',
  'relatorios',
  'configuracoes',
  'planos',
];

test.describe('Console Error Detection', () => {
  test.setTimeout(60000);

  test('no pageerror (uncaught exceptions) on initial load', async ({ page }) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(err));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const criticalConsole = consoleErrors.filter(isCriticalError);
    expect(criticalConsole, 'Critical console errors on load: ' + JSON.stringify(criticalConsole)).toHaveLength(0);
    expect(pageErrors, 'Uncaught page errors: ' + pageErrors.map((e) => e.message)).toHaveLength(0);
  });

  test('no console errors across all routes', async ({ page }) => {
    const allErrors: { route: string; type: string; message: string }[] = [];

    page.on('pageerror', (err) => {
      allErrors.push({ route: page.url(), type: 'pageerror', message: err.message });
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isIgnoredWarning(msg.text())) {
        allErrors.push({ route: page.url(), type: 'console.error', message: msg.text() });
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    for (const route of APP_ROUTES) {
      const url = route ? `${BASE_URL}/#/${route}` : BASE_URL;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    const criticalErrors = allErrors.filter((e) => isCriticalError(e.message));
    expect(
      criticalErrors,
      'Critical errors found across routes:\n' + criticalErrors.map((e) => `  [${e.route}] ${e.type}: ${e.message}`).join('\n')
    ).toHaveLength(0);
  });

  test('no pageerror on theme toggle', async ({ page }) => {
    const pageErrors: Error[] = [];

    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const toggleBtn = page.locator('button[aria-label*="tema"], button[aria-label*="theme"]').first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      for (let i = 0; i < 3; i++) {
        await toggleBtn.click();
        await page.waitForTimeout(500);
      }
    }

    const criticalErrors = pageErrors.filter((e) => isCriticalError(e.message));
    expect(criticalErrors, 'Errors on theme toggle: ' + criticalErrors.map((e) => e.message)).toHaveLength(0);
  });

  test('no failed resource loads (404/500)', async ({ page }) => {
    const failedRequests: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().includes('supabase') && !response.url().includes('stripe')) {
        failedRequests.push({ url: response.url(), status: response.status() });
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(
      failedRequests,
      'Failed resource loads:\n' + failedRequests.map((r) => `  ${r.status} ${r.url}`).join('\n')
    ).toHaveLength(0);
  });

  if (storageState) {
    test('no errors on authenticated dashboard', async ({ browser }) => {
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();
      const pageErrors: Error[] = [];
      const consoleErrors: string[] = [];

      page.on('pageerror', (err) => pageErrors.push(err));
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !isIgnoredWarning(msg.text())) {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const criticalConsole = consoleErrors.filter(isCriticalError);
      expect(criticalConsole, 'Auth console errors: ' + JSON.stringify(criticalConsole)).toHaveLength(0);
      expect(pageErrors, 'Auth page errors: ' + pageErrors.map((e) => e.message)).toHaveLength(0);

      await context.close();
    });
  }
});
