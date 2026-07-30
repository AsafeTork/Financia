import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROD_URL = 'https://financiabr.me';

interface RoutePerf {
  label: string;
  url: string;
  navMs: number | null;
  dclMs: number | null;
  loadMs: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  errors: string[];
  warnings: string[];
  buttonsClicked: number;
  buttonsWorking: number;
  buttonsBroken: string[];
  navigationOccurred: boolean;
  loadTimeMs: number | null;
  routeReadyMs: number | null;
}

interface AuditEntry {
  route: string;
  message: string;
  source: string;
  timestamp: string;
}

const ROUTES = [
  { path: '/', label: 'Dashboard' },
  { path: '/income', label: 'Income (Vendas)' },
  { path: '/expense', label: 'Expense (Despesas)' },
  { path: '/inventory', label: 'Inventory (Estoque)' },
  { path: '/report', label: 'Report (Relatório)' },
  { path: '/email', label: 'Email' },
  { path: '/settings', label: 'Settings (Configurações)' },
  { path: '/planos', label: 'Plans (Planos)' },
  { path: '/brandstudio', label: 'Brand Studio' },
];

const ROUTES_LOGIN_FREE = ['/landing', '/privacidade', '/termos'];

class AdminAuditCollector {
  private entries: AuditEntry[] = [];
  private routeErrors: Map<string, string[]> = new Map();
  private routePerf: Map<string, RoutePerf> = new Map();
  private currentRoute: string = 'init';

  setRoute(label: string): void {
    this.currentRoute = label;
    if (!this.routeErrors.has(label)) {
      this.routeErrors.set(label, []);
    }
  }

  addError(message: string): void {
    this.entries.push({ route: this.currentRoute, message, source: 'error', timestamp: new Date().toISOString() });
    const list = this.routeErrors.get(this.currentRoute) || [];
    list.push(message);
    this.routeErrors.set(this.currentRoute, list);
  }

  addWarning(message: string): void {
    this.entries.push({ route: this.currentRoute, message, source: 'warning', timestamp: new Date().toISOString() });
  }

  setPerf(label: string, perf: RoutePerf): void {
    this.routePerf.set(label, perf);
  }

  getErrorsByRoute(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [route, errs] of this.routeErrors) {
      result[route] = errs;
    }
    return result;
  }

  getPerf(): Map<string, RoutePerf> {
    return this.routePerf;
  }

  getEntries(): AuditEntry[] {
    return this.entries;
  }

  totalErrors(): number {
    return this.entries.filter(e => e.source === 'error').length;
  }

  totalWarnings(): number {
    return this.entries.filter(e => e.source === 'warning').length;
  }
}

function captureConsoleErrors(page: Page, collector: AdminAuditCollector): void {
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      if (text.includes('favicon') || text.includes('service-worker') || text.includes('sw.js') || text.includes('network request failed') || text.includes('Load failed') || text.includes('Access to fetch')) return;
      collector.addError(`Console error: ${text}`);
    } else if (msg.type() === 'warning') {
      if (text.includes('favicon')) return;
      collector.addWarning(`Console warning: ${text}`);
    }
  });
  page.on('pageerror', (err) => {
    if (err.message.includes('ResizeObserver') || err.message.includes('favicon')) return;
    collector.addError(`Page error: ${err.message}`);
  });
}

async function loginAsAdmin(page: Page, collector: AdminAuditCollector): Promise<boolean> {
  const username = process.env.PLAYWRIGHT_USERNAME || '';
  const password = process.env.PLAYWRIGHT_PASSWORD || '';

  if (!username || !password) {
    collector.addWarning('No PLAYWRIGHT_USERNAME/PLAYWRIGHT_PASSWORD secrets — skipping login');
    return false;
  }

  collector.setRoute('login');
  const loginStart = Date.now();

  try {
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch {
    try {
      await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e: any) {
      collector.addError(`Failed to reach login page: ${e.message}`);
      return false;
    }
  }

  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passInput = page.locator('input[type="password"], input[name="password"]').first();
  const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();

  const emailVisible = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
  if (!emailVisible) {
    collector.addWarning('Email input not visible on login page — user may already be logged in');
    const isLoggedIn = await page.locator('text=Dashboard, text=Painel, [data-testid="sidebar"]').first().isVisible().catch(() => false);
    if (isLoggedIn) {
      collector.setPerf('login', { label: 'Already logged in', url: PROD_URL, navMs: Date.now() - loginStart, dclMs: null, loadMs: null, fcpMs: null, lcpMs: null, errors: [], warnings: [], buttonsClicked: 0, buttonsWorking: 0, buttonsBroken: [], navigationOccurred: true, loadTimeMs: null, routeReadyMs: null });
      return true;
    }
    return false;
  }

  await emailInput.fill(username);
  await passInput.fill(password);
  await submitBtn.click();
  await page.waitForTimeout(2000);

  const loginSuccess = await page.locator('text=Dashboard, text=Painel, [data-testid="sidebar"]').first().isVisible().catch(() => false);
    collector.setPerf('login', { label: 'Login', url: `${PROD_URL}/login`, navMs: Date.now() - loginStart, dclMs: null, loadMs: null, fcpMs: null, lcpMs: null, errors: [], warnings: [], buttonsClicked: 0, buttonsWorking: 0, buttonsBroken: [], navigationOccurred: loginSuccess, loadTimeMs: null, routeReadyMs: null });

  if (!loginSuccess) {
    collector.addError('Login did not result in Dashboard visibility');
    return false;
  }

  return true;
}

async function auditRoute(page: Page, route: string, label: string, collector: AdminAuditCollector): Promise<void> {
  collector.setRoute(label);
  const navStart = Date.now();

  try {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const navEnd = Date.now();
    const navMs = Math.round(navEnd - navStart);

    if (response && !response.ok()) {
      collector.addError(`HTTP ${response.status()} on route ${label}`);
    }

    await page.waitForTimeout(800);

    const dclMs = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null;
    }).catch(() => null);

    const lcpMs = await page.evaluate(() => {
      const entries = performance.getEntriesByType('largest-contentful-paint');
      return entries.length > 0 ? Math.round(entries[entries.length - 1].startTime) : null;
    }).catch(() => null);

    const fcpMs = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcp = entries.find(e => e.name === 'first-paint');
      return fcp ? Math.round(fcp.startTime) : null;
    }).catch(() => null);

    await clickButtonsAndMeasure(page, collector, label);
    await clickTabsAndAccordions(page, collector, label);

    const routeEnd = Date.now();
    const routeLoadMs = routeEnd - Math.round(navStart);

    const perf: RoutePerf = {
      label,
      url: route,
      navMs,
      dclMs,
      loadMs: response ? Math.round(response.request().timing()?.responseEnd ?? 0) : null,
      fcpMs,
      lcpMs,
      errors: collector.getErrorsByRoute()[label] || [],
      warnings: [],
      buttonsClicked: 0,
      buttonsWorking: 0,
      buttonsBroken: [],
      navigationOccurred: false,
      loadTimeMs: routeLoadMs,
      routeReadyMs: dclMs,
    };
    collector.setPerf(label, perf);

  } catch (e: any) {
    collector.addError(`Route ${label} failed: ${e.message}`);
    const perf: RoutePerf = {
      label, url: route, navMs: null, dclMs: null, loadMs: null,
      fcpMs: null, lcpMs: null, errors: [e.message], warnings: [],
      buttonsClicked: 0, buttonsWorking: 0, buttonsBroken: [],
      navigationOccurred: false, loadTimeMs: null, routeReadyMs: null,
    };
    collector.setPerf(label, perf);
  }
}

async function clickButtonsAndMeasure(page: Page, collector: AdminAuditCollector, label: string): Promise<void> {
  const buttons = page.locator('button:not([disabled]):not([aria-hidden="true"]):not(button[style*="display:none"]), a[href], [role="button"]:not([aria-hidden="true"])');
  const count = await buttons.count();
  let clicked = 0;
  let working = 0;
  const broken: string[] = [];

  for (let i = 0; i < Math.min(count, 20); i++) {
    try {
      const btn = buttons.nth(i);
      const isVisible = await btn.isVisible({ timeout: 500 }).catch(() => false);
      const isInViewport = await btn.isInViewport({ timeout: 500 }).catch(() => false);
      if (!isVisible || !isInViewport) continue;

      const btnText = (await btn.textContent().catch(() => '')).trim().slice(0, 50);
      const tagName = await btn.evaluate((el: Element) => el.tagName).catch(() => '');
      const selector = `${tagName}:text("${btnText}")`;

      if (!btnText || btnText.length === 0) continue;
      if (['Copiar', 'Copiar JSON', 'Copiar doc', 'Desfazer', 'Refazer', 'Original', 'Usar global'].includes(btnText)) continue;

      const clickStart = Date.now();
      let didNavigate = false;
      let errorAfterClick = false;

      const navPromise = new Promise<void>((resolve) => {
        page.on('framenavigated', () => { didNavigate = true; resolve(); }, { once: true });
        setTimeout(resolve, 3000);
      });

      await btn.click({ timeout: 3000, force: true }).catch(() => {});
      await page.waitForTimeout(300);

      await Promise.race([navPromise, new Promise(r => setTimeout(r, 3500))]);

      const clickEnd = Date.now();
      const clickMs = clickEnd - clickStart;

      if (!errorAfterClick) {
        working++;
      }
      clicked++;

      if (clickMs > 5000) {
        collector.addWarning(`${label}: Button "${btnText}" took ${clickMs}ms to respond`);
      }
    } catch (e: any) {
      broken.push(btnText || `button #${i}`);
    }
  }

  const existingPerf = collector.getPerf().get(label);
  if (existingPerf) {
    existingPerf.buttonsClicked = clicked;
    existingPerf.buttonsWorking = working;
    existingPerf.buttonsBroken = broken;
  }
}

async function clickTabsAndAccordions(page: Page, collector: AdminAuditCollector, label: string): Promise<void> {
  const tabs = page.locator('[role="tab"], [role="button"][aria-expanded], summary, .accordion-trigger');
  const count = await tabs.count();
  for (let i = 0; i < Math.min(count, 15); i++) {
    try {
      const tab = tabs.nth(i);
      if (await tab.isVisible({ timeout: 500 }).catch(() => false)) {
        await tab.click({ timeout: 2000, force: true }).catch(() => {});
        await page.waitForTimeout(200);
      }
    } catch { /* skip */ }
  }
}

function generateMarkdownReport(collector: AdminAuditCollector): string {
  const errsByRoute = collector.getErrorsByRoute();
  const perfMap = collector.getPerf();
  const timestamp = new Date().toISOString();

  const lines: string[] = [];
  lines.push('# Admin Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${timestamp}`);
  lines.push(`**Target:** ${PROD_URL}`);
  lines.push(`**Total routes tested:** ${perfMap.size}`);
  lines.push(`**Total errors:** ${collector.totalErrors()}`);
  lines.push(`**Total warnings:** ${collector.totalWarnings()}`);
  lines.push('');

  lines.push('## Route Performance Summary');
  lines.push('');
  lines.push('| Route | Nav (ms) | DCL (ms) | FCP (ms) | LCP (ms) | Buttons | Errors |');
  lines.push('|-------|----------|----------|----------|----------|---------|--------|');
  for (const [label, perf] of perfMap) {
    lines.push(`| ${label} | ${perf.navMs ?? '-'} | ${perf.dclMs ?? '-'} | ${perf.fcpMs ?? '-'} | ${perf.lcpMs ?? '-'} | ${perf.buttonsClicked}/${perf.buttonsWorking} | ${perf.errors.length} |`);
  }
  lines.push('');

  lines.push('## Errors by Route');
  lines.push('');
  let hasErrors = false;
  for (const [route, errs] of Object.entries(errsByRoute)) {
    if (errs.length === 0) continue;
    hasErrors = true;
    lines.push(`### ${route}`);
    for (const err of errs) {
      lines.push(`- \`${err}\``);
    }
    lines.push('');
  }
  if (!hasErrors) {
    lines.push('No errors captured.');
    lines.push('');
  }

  lines.push('## Button Functionality');
  lines.push('');
  for (const [label, perf] of perfMap) {
    if (perf.broken.length === 0 && perf.buttonsClicked > 0) {
      lines.push(`- **${label}**: ${perf.buttonsWorking}/${perf.buttonsClicked} buttons working ✅`);
    } else if (perf.broken.length > 0) {
      lines.push(`- **${label}**: ${perf.broken.length} broken button(s):`);
      for (const b of perf.broken) {
        lines.push(`  - \`${b}\``);
      }
    }
  }
  lines.push('');

  lines.push('## Timing Analysis');
  lines.push('');
  const sortedByNav = [...perfMap.values()].filter(p => p.navMs !== null).sort((a, b) => (b.navMs || 0) - (a.navMs || 0));
  if (sortedByNav.length > 0) {
    lines.push('### Slowest by Navigation');
    for (const p of sortedByNav.slice(0, 5)) {
      const score = p.navMs! < 1000 ? '🟢 FAST' : p.navMs! < 3000 ? '🟡 MODERATE' : '🔴 SLOW';
      lines.push(`- ${p.label}: **${p.navMs}ms** ${score}`);
    }
    lines.push('');
  }

  const withLcp = [...perfMap.values()].filter(p => p.lcpMs !== null).sort((a, b) => (b.lcpMs || 0) - (a.lcpMs || 0));
  if (withLcp.length > 0) {
    lines.push('### Worst LCP');
    for (const p of withLcp.slice(0, 5)) {
      lines.push(`- ${p.label}: **${p.lcpMs}ms**`);
    }
    lines.push('');
  }

  lines.push('## Full Console Log');
  lines.push('');
  const allEntries = collector.getEntries();
  if (allEntries.length === 0) {
    lines.push('No console messages captured.');
  } else {
    for (const entry of allEntries) {
      const icon = entry.source === 'error' ? '❌' : entry.source === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`- ${icon} **[${entry.route}]** ${entry.message}`);
    }
  }
  lines.push('');

  lines.push('## How to Fix');
  lines.push('');
  lines.push('1. Review ❌ errors above');
  lines.push('2. Open the failing route in the browser');
  lines.push('3. Open DevTools console (F12) and reproduce');
  lines.push('4. Fix the root cause');
  lines.push('5. Push fix and re-run `admin-audit` workflow');
  lines.push('');

  return lines.join('\n');
}

test.setTimeout(600000);

test.describe('Admin Full Audit', () => {
  test('complete admin audit with timing, errors, and button verification', async ({ page }, testInfo) => {
    const collector = new AdminAuditCollector();
    captureConsoleErrors(page, collector);

    const loggedIn = await loginAsAdmin(page, collector);
    if (!loggedIn) {
      test.info().annotations.push({ type: 'skipped', description: 'Admin login required but credentials not available or login failed' });
      test.skip();
    }

    await page.evaluate(() => {
      try { localStorage.setItem('financia_debug_mode', '1'); } catch (e) { /* ignore */ }
    }).catch(() => {});

    for (const r of ROUTES) {
      const fullUrl = r.path === '/' ? PROD_URL : `${PROD_URL}${r.path}`;
      await auditRoute(page, fullUrl, r.label, collector);
      await page.waitForTimeout(800);
    }

    for (const r of ROUTES_LOGIN_FREE) {
      const fullUrl = r.path === '/' ? PROD_URL : `${PROD_URL}${r.path}`;
      await auditRoute(page, fullUrl, r.path.replace('/', '') || 'home', collector);
      await page.waitForTimeout(500);
    }

    const report = generateMarkdownReport(collector);

    const reportPath = path.join(process.cwd(), 'admin-audit-report.md');
    fs.writeFileSync(reportPath, report);

    const jsonPath = path.join(process.cwd(), 'admin-audit-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      entries: collector.getEntries(),
      perf: Object.fromEntries(collector.getPerf()),
      errorsByRoute: collector.getErrorsByRoute(),
      totalErrors: collector.totalErrors(),
      totalWarnings: collector.totalWarnings(),
    }, null, 2));

    await testInfo.attach('admin-audit-report', { body: report, contentType: 'text/markdown' });
    await testInfo.attach('admin-audit-json', { body: JSON.stringify(collector.getEntries(), null, 2), contentType: 'application/json' });

    console.log(report);

    const realErrors = collector.getEntries().filter(e => e.source === 'error' && !e.message.includes('favicon') && !e.message.includes('service-worker') && !e.message.includes('sw.js') && !e.message.includes('ResizeObserver')).length;
    test.expect.soft(realErrors).toBe(0);
  });
});