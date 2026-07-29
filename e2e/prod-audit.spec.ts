import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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

interface ErrorEntry {
  url: string;
  message: string;
  source: string;
}

class RouteErrors {
  private errors: Map<string, ErrorEntry[]> = new Map();
  private currentLabel: string = 'setup';
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'prod-audit-errors.json');
  }

  setLabel(label: string): void {
    this.currentLabel = label;
  }

  add(entry: { message: string; source: string }): void {
    const label = this.currentLabel;
    if (!this.errors.has(label)) {
      this.errors.set(label, []);
    }
    this.errors.get(label)!.push({
      url: label,
      message: entry.message,
      source: entry.source,
    });
  }

  getAll(): Record<string, ErrorEntry[]> {
    const result: Record<string, ErrorEntry[]> = {};
    for (const [route, entries] of this.errors) {
      result[route] = entries;
    }
    return result;
  }

  getFlat(): ErrorEntry[] {
    return Array.from(this.errors.values()).flat();
  }

  getSummary(): { total: number; bySource: Record<string, number> } {
    const bySource: Record<string, number> = {};
    let total = 0;
    for (const entries of this.errors.values()) {
      for (const e of entries) {
        bySource[e.source] = (bySource[e.source] || 0) + 1;
        total++;
      }
    }
    return { total, bySource };
  }

  save(): void {
    const payload = {
      routes: this.getAll(),
      flat: this.getFlat(),
      summary: this.getSummary(),
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2));
  }

  generateReport(): string {
    const flat = this.getFlat();
    const summary = this.getSummary();
    const lines: string[] = [
      '=== PRODUCTION AUDIT REPORT ===',
      `Total errors: ${summary.total}`,
      '',
      '--- Page Errors ---',
      ...flat.filter(e => e.source === 'pageerror').map(e => `  [${e.url}] ${e.message}`),
      '',
      '--- Console Errors ---',
      ...flat.filter(e => e.source === 'error').map(e => `  [${e.url}] ${e.message}`),
      '',
      '--- Console Warnings ---',
      ...flat.filter(e => e.source === 'warning').map(e => `  [${e.url}] ${e.message}`),
      '',
      '--- Audit Failures ---',
      ...flat.filter(e => e.source === 'audit').map(e => `  [${e.url}] ${e.message}`),
    ];
    return lines.join('\n');
  }
}

function captureConsole(page: Page, collector: RouteErrors): void {
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      collector.add({ message: msg.text(), source: msg.type() });
    }
  });
  page.on('pageerror', (err) => {
    collector.add({ message: err.message, source: 'pageerror' });
  });
}

async function clickAllButtons(page: Page): Promise<void> {
  const buttons = page.locator('button, a[href], [role="button"], input[type="submit"], input[type="button"]');
  const count = await buttons.count();
  for (let i = 0; i < Math.min(count, 30); i++) {
    try {
      const btn = buttons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click({ timeout: 2000, force: true });
        await page.waitForTimeout(200);
      }
    } catch {
      // Best-effort probe during audit — element may be stale or not interactable
    }
  }
}

async function clickAllTabsAndAccordions(page: Page): Promise<void> {
  const interactables = page.locator('[role="tab"], [role="button"][aria-expanded], summary, .accordion-trigger');
  const count = await interactables.count();
  for (let i = 0; i < Math.min(count, 20); i++) {
    try {
      const el = interactables.nth(i);
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        await el.click({ timeout: 2000, force: true });
        await page.waitForTimeout(150);
      }
    } catch {
      // Best-effort probe during audit — element may be stale or not interactable
    }
  }
}

async function fillInputs(page: Page): Promise<void> {
  const inputs = page.locator('input:not([type="hidden"]):not([type="color"])');
  const count = await inputs.count();
  for (let i = 0; i < Math.min(count, 10); i++) {
    try {
      const input = inputs.nth(i);
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        const type = await input.getAttribute('type');
        if (type === 'email') {
          await input.fill('test@example.com', { timeout: 1000 });
        } else if (type === 'tel') {
          await input.fill('11999999999', { timeout: 1000 });
        } else if (!type || type === 'text') {
          await input.fill('test', { timeout: 1000 });
        }
        await page.waitForTimeout(100);
      }
    } catch {
      // Best-effort probe during audit — element may be stale or not interactable
    }
  }
}

async function auditRoute(page: Page, route: string, label: string, collector: RouteErrors): Promise<void> {
  collector.setLabel(label);
  try {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    await clickAllTabsAndAccordions(page);
    await fillInputs(page);
    await clickAllButtons(page);
    await page.waitForTimeout(500);
  } catch (err) {
    collector.add({ message: `Failed to load/audit: ${err}`, source: 'audit' });
  }
  collector.save();
}

test.setTimeout(600000);

test.describe('Production Audit - All Browsers', () => {
  test('full audit on chromium', async ({ page }, testInfo) => {
    const collector = new RouteErrors();
    captureConsole(page, collector);

    const adminEmail = process.env.PLAYWRIGHT_USERNAME || 'admin@gestao.com';
    const adminPass = process.env.PLAYWRIGHT_PASSWORD || '';

    if (adminPass) {
      collector.setLabel('login');
      try {
        await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch (err) {
        collector.add({ message: `Login goto failed: ${err}`, source: 'audit' });
      }
      try {
        await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch (err) {
        collector.add({ message: `Post-login goto failed: ${err}`, source: 'audit' });
      }
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();

      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill(adminEmail);
        if (await passInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await passInput.fill(adminPass);
          try {
            await submitBtn.click({ timeout: 5000 });
          } catch (err) {
            collector.add({ message: `Login submit failed: ${err}`, source: 'audit' });
          }
          await page.waitForTimeout(3000);
        }
      }
    }

    await page.evaluate(() => {
      try { localStorage.setItem('financia_debug_mode', '1'); } catch (e) { console.warn('localStorage not available (cross-origin?):', e); }
    }).catch(e => collector.add({ message: `localStorage access failed: ${e}`, source: 'audit' }));

    for (const r of ROUTES) {
      const fullUrl = r.path === '/' ? PROD_URL : `${PROD_URL}${r.path}`;
      await auditRoute(page, fullUrl, `chromium-${r.label}`, collector);
    }

    collector.save();

    const report = collector.generateReport();
    console.log(report);
    await testInfo.attach('prod-audit-report', { body: report, contentType: 'text/plain' });

    const flat = collector.getFlat();
    const realPageErrors = flat.filter(e =>
      e.source === 'pageerror' &&
      !e.message.includes('sw.js') &&
      !e.message.includes('service-worker') &&
      !e.message.includes('ServiceWorker') &&
      !e.message.includes('Load failed')
    );
    test.expect.soft(realPageErrors.length).toBe(0);
  });
});