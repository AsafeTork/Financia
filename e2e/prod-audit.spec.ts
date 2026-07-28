import { test, expect, Page, BrowserContext } from '@playwright/test';

const PROD_URL = 'https://financiabr.me';

const ROUTES = [
  { path: '/', label: 'Dashboard' },
  { path: '/income', label: 'Income' },
  { path: '/expense', label: 'Expense' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/email', label: 'Email' },
  { path: '/report', label: 'Report' },
  { path: '/settings', label: 'Settings' },
  { path: '/planos', label: 'Planos' },
  { path: '/brandstudio', label: 'Brand Studio' },
  { path: '/landing', label: 'Landing' },
  { path: '/privacidade', label: 'Privacy' },
  { path: '/termos', label: 'Terms' },
];

const consoleErrors: { url: string; message: string; source: string }[] = [];

async function captureConsole(page: Page, routeLabel: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push({
        url: routeLabel,
        message: msg.text(),
        source: msg.type(),
      });
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push({
      url: routeLabel,
      message: err.message,
      source: 'pageerror',
    });
  });
}

async function clickAllButtons(page: Page, routeLabel: string) {
  const buttons = page.locator('button, a[href], [role="button"], input[type="submit"], input[type="button"]');
  const count = await buttons.count();
  for (let i = 0; i < Math.min(count, 30); i++) {
    try {
      const btn = buttons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click({ timeout: 2000, force: true }).catch(() => {});
        await page.waitForTimeout(200);
      }
    } catch {}
  }
}

async function clickAllTabsAndAccordions(page: Page, routeLabel: string) {
  const interactables = page.locator('[role="tab"], [role="button"][aria-expanded], summary, .accordion-trigger');
  const count = await interactables.count();
  for (let i = 0; i < Math.min(count, 20); i++) {
    try {
      const el = interactables.nth(i);
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        await el.click({ timeout: 2000, force: true }).catch(() => {});
        await page.waitForTimeout(150);
      }
    } catch {}
  }
}

async function fillInputs(page: Page, routeLabel: string) {
  const inputs = page.locator('input:not([type="hidden"]):not([type="color"])');
  const count = await inputs.count();
  for (let i = 0; i < Math.min(count, 10); i++) {
    try {
      const input = inputs.nth(i);
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        const type = await input.getAttribute('type');
        if (type === 'email') {
          await input.fill('test@example.com', { timeout: 1000 }).catch(() => {});
        } else if (type === 'tel') {
          await input.fill('11999999999', { timeout: 1000 }).catch(() => {});
        } else if (!type || type === 'text') {
          await input.fill('test', { timeout: 1000 }).catch(() => {});
        }
        await page.waitForTimeout(100);
      }
    } catch {}
  }
}

async function auditRoute(page: Page, route: string, label: string) {
  try {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    await clickAllTabsAndAccordions(page, label);
    await fillInputs(page, label);
    await clickAllButtons(page, label);
    await page.waitForTimeout(500);
  } catch (err) {
    consoleErrors.push({
      url: label,
      message: `Failed to load/audit: ${err}`,
      source: 'audit',
    });
  }
}

test.setTimeout(300000);

test.describe('Production Audit - All Browsers', () => {
  test('full audit on chromium', async ({ page }) => {
    await captureConsole(page, 'chromium-setup');
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await captureConsole(page, `chromium-${ROUTES[0].label}`);

    for (const r of ROUTES) {
      const fullUrl = r.path === '/' ? PROD_URL : `${PROD_URL}${r.path}`;
      await auditRoute(page, fullUrl, `chromium-${r.label}`);
    }

    test.expect.soft(consoleErrors.filter(e => e.source === 'pageerror').length).toBe(0);
  });
});

test.describe('Production Audit Report', () => {
  test('print all console errors found', async ({}, testInfo) => {
    const errorsByType: Record<string, typeof consoleErrors> = {};
    for (const err of consoleErrors) {
      if (!errorsByType[err.source]) errorsByType[err.source] = [];
      errorsByType[err.source].push(err);
    }

    const report = [
      '=== PRODUCTION AUDIT REPORT ===',
      `Total errors: ${consoleErrors.length}`,
      '',
      '--- Page Errors ---',
      ...consoleErrors.filter(e => e.source === 'pageerror').map(e => `  [${e.url}] ${e.message}`),
      '',
      '--- Console Errors ---',
      ...consoleErrors.filter(e => e.source === 'error').map(e => `  [${e.url}] ${e.message}`),
      '',
      '--- Console Warnings ---',
      ...consoleErrors.filter(e => e.source === 'warning').map(e => `  [${e.url}] ${e.message}`),
      '',
      '--- Audit Failures ---',
      ...consoleErrors.filter(e => e.source === 'audit').map(e => `  [${e.url}] ${e.message}`),
    ].join('\n');

    console.log(report);
    await testInfo.attach('prod-audit-report', { body: report, contentType: 'text/plain' });
  });
});