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
];

interface ButtonMetric {
  index: number;
  text: string;
  clickToPaint: number | null;
  clickToNetworkIdle: number | null;
  triggeredNavigation: boolean;
  selector: string;
}

interface ResourceInfo {
  name: string;
  type: string;
  size: number;
  duration: number;
}

interface RoutePerformance {
  label: string;
  url: string;
  navigationTiming: {
    navigation: number;
    domContentLoaded: number;
    load: number;
  };
  paintTiming: {
    firstPaint: number | null;
    firstContentfulPaint: number | null;
  };
  buttonMetrics: ButtonMetric[];
  longTasks: { duration: number; startTime: number }[];
  memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeMB: string } | null;
  resources: ResourceInfo[];
  largestResources: { name: string; size: number }[];
  totalJSBytes: number;
  lcp: number | null;
  score: string;
}

class PerformanceReport {
  private results: Map<string, RoutePerformance> = new Map();
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'perf-results.json');
  }

  add(label: string, perf: RoutePerformance): void {
    this.results.set(label, perf);
  }

  getAll(): Map<string, RoutePerformance> {
    return this.results;
  }

  save(): void {
    const payload = {
      results: Object.fromEntries(this.results),
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2));
  }

  generateReport(): string {
    const lines: string[] = [];
    lines.push('='.repeat(64));
    lines.push('  PERFORMANCE TEST REPORT');
    lines.push('='.repeat(64));

    for (const [, r] of this.results) {
      lines.push('');
      lines.push(`=== Performance Report: ${r.url} (${r.label}) ===`);
      lines.push(`  Navigation:         ${r.navigationTiming.navigation}ms`);
      lines.push(`  DOM Content Loaded: ${r.navigationTiming.domContentLoaded}ms`);
      lines.push(`  Load:               ${r.navigationTiming.load}ms`);
      const fcp = r.paintTiming.firstContentfulPaint;
      lines.push(`  FCP:                ${fcp !== null ? fcp + 'ms' : 'N/A'}`);
      const fp = r.paintTiming.firstPaint;
      lines.push(`  FP:                 ${fp !== null ? fp + 'ms' : 'N/A'}`);
      const lcp = r.lcp;
      lines.push(`  LCP:                ${lcp !== null ? Math.round(lcp) + 'ms' : 'N/A'}`);
      lines.push(`  Buttons found:      ${r.buttonMetrics.length}`);
      if (r.buttonMetrics.length > 0) {
        const validClicks = r.buttonMetrics.filter(b => b.clickToPaint !== null);
        if (validClicks.length > 0) {
          const avgClick = validClicks.reduce((s, b) => s + (b.clickToPaint || 0), 0) / validClicks.length;
          lines.push(`  Avg click response: ${Math.round(avgClick)}ms`);
          const navTriggers = r.buttonMetrics.filter(b => b.triggeredNavigation).length;
          lines.push(`  Nav-triggering clks: ${navTriggers}`);
        }
      }
      lines.push(`  Long tasks:         ${r.longTasks.length} (>50ms)`);
      if (r.longTasks.length > 0) {
        const maxLt = Math.max(...r.longTasks.map(t => t.duration));
        const totalLt = r.longTasks.reduce((s, t) => s + t.duration, 0);
        lines.push(`    Max duration:     ${Math.round(maxLt)}ms`);
        lines.push(`    Total blocking:   ${Math.round(totalLt)}ms`);
      }
      if (r.memory) {
        lines.push(`  Heap used:          ${r.memory.jsHeapSizeMB}`);
        lines.push(`  Heap total:         ${(r.memory.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB`);
      }
      lines.push(`  Total JS bytes:     ${(r.totalJSBytes / 1024).toFixed(1)}KB (${r.resources.length} resources)`);
      if (r.largestResources.length > 0) {
        for (const lr of r.largestResources.slice(0, 3)) {
          lines.push(`    ${lr.name}: ${(lr.size / 1024).toFixed(1)}KB`);
        }
      }
      lines.push(`  Score:              ${r.score}`);
    }

    lines.push('');
    lines.push('='.repeat(64));
    lines.push('  SUMMARY');
    lines.push('='.repeat(64));

    const allResults = [...this.results.values()];
    const fast = allResults.filter(r => r.score === 'FAST (<1s)');
    const moderate = allResults.filter(r => r.score === 'MODERATE (1-3s)');
    const slow = allResults.filter(r => r.score === 'SLOW (>3s)');
    lines.push(`  Fast:     ${fast.length} page(s)`);
    lines.push(`  Moderate: ${moderate.length} page(s)`);
    lines.push(`  Slow:     ${slow.length} page(s)`);

    if (slow.length > 0) {
      lines.push('');
      lines.push('  --- Slow Pages ---');
      for (const r of slow) {
        lines.push(`    ${r.label}: ${r.navigationTiming.navigation}ms nav, ${r.longTasks.length} long tasks`);
      }
    }

    if (allResults.length > 0) {
      const sortedNav = [...allResults].sort((a, b) => b.navigationTiming.navigation - a.navigationTiming.navigation);
      lines.push('');
      lines.push('  --- Slowest by Navigation Time ---');
      for (const r of sortedNav.slice(0, 3)) {
        lines.push(`    ${r.label}: ${r.navigationTiming.navigation}ms`);
      }

      const sortedLt = [...allResults].sort((a, b) => b.longTasks.length - a.longTasks.length);
      lines.push('');
      lines.push('  --- Most Long Tasks ---');
      for (const r of sortedLt.slice(0, 3)) {
        if (r.longTasks.length > 0) {
          lines.push(`    ${r.label}: ${r.longTasks.length} tasks`);
        }
      }

      const withMem = allResults.filter(r => r.memory !== null);
      if (withMem.length > 0) {
        const sortedMem = [...withMem].sort((a, b) => (b.memory?.usedJSHeapSize || 0) - (a.memory?.usedJSHeapSize || 0));
        lines.push('');
        lines.push('  --- Highest Memory Usage ---');
        for (const r of sortedMem.slice(0, 3)) {
          lines.push(`    ${r.label}: ${r.memory?.jsHeapSizeMB}`);
        }
      }
    }

    return lines.join('\n');
  }
}

function scoreNavigationTime(ms: number | null): string {
  if (ms === null) return 'N/A';
  if (ms < 1000) return 'FAST (<1s)';
  if (ms < 3000) return 'MODERATE (1-3s)';
  return 'SLOW (>3s)';
}

async function measureButtonClicks(page: Page, route: string): Promise<ButtonMetric[]> {
  const buttons = page.locator('button, a[href], [role="button"], input[type="submit"], input[type="button"]');
  const count = await buttons.count();
  const metrics: ButtonMetric[] = [];

  for (let i = 0; i < Math.min(count, 15); i++) {
    try {
      const btn = buttons.nth(i);
      if (!(await btn.isVisible({ timeout: 1000 }).catch(() => false))) continue;

      const text = await btn.textContent().catch(() => '');
      const tagName = await btn.evaluate((el: Element) => el.tagName).catch(() => '');
      const href = await btn.getAttribute('href').catch(() => null);

      const beforeUrl = page.url();
      const beforeTime = await page.evaluate(() => performance.now());

      await btn.click({ timeout: 2000, force: true });

      const afterPaintTime = await page.evaluate(
        () => new Promise<number>(resolve => requestAnimationFrame(() => resolve(performance.now())))
      );

      const navigated = page.url() !== beforeUrl;
      let afterNetworkIdle: number | null = null;

      if (navigated) {
        try {
          await page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch {
          // navigation may not reach networkidle
        }
        afterNetworkIdle = await page.evaluate(() => performance.now());

        try {
          await page.goBack({ timeout: 10000 });
          await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
        } catch {
          await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        }
      }

      metrics.push({
        index: i,
        text: (text || '').trim().slice(0, 50),
        clickToPaint: Math.round(afterPaintTime - beforeTime),
        clickToNetworkIdle: afterNetworkIdle !== null ? Math.round(afterNetworkIdle - beforeTime) : null,
        triggeredNavigation: navigated,
        selector: tagName + (href ? `[href="${href}"]` : ''),
      });
    } catch {
      // skip problematic buttons
    }
  }

  return metrics;
}

async function measureRoute(page: Page, url: string, label: string): Promise<RoutePerformance | null> {
  try {
    // Reset performance observers for the upcoming navigation
    await page.evaluate(() => {
      (window as any).__longTasks = [];
      (window as any).__lcp = 0;
      performance.clearResourceTimings();
    }).catch(() => {});

    const navigationStart = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const navigationWallEnd = Date.now();

    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const navTiming = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation');
      if (!entries || entries.length === 0) return null;
      const e = entries[0] as any;
      return {
        navigation: Math.round(e.responseEnd - e.startTime),
        domContentLoaded: Math.round(e.domContentLoadedEventEnd - e.startTime),
        load: Math.round(e.loadEventEnd - e.startTime),
      };
    }).catch(() => null);

    const paintTiming = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      return {
        firstPaint: (entries.find(e => e.name === 'first-paint') as any)?.startTime || null,
        firstContentfulPaint: (entries.find(e => e.name === 'first-contentful-paint') as any)?.startTime || null,
      };
    }).catch(() => ({ firstPaint: null, firstContentfulPaint: null }));

    const lcp = await page.evaluate(() => (window as any).__lcp || null).catch(() => null);

    const longTasks = await page.evaluate(() => (window as any).__longTasks || []).catch(() => []);

    // Reset for next route
    await page.evaluate(() => {
      (window as any).__longTasks = [];
      (window as any).__lcp = 0;
    }).catch(() => {});

    // Need to wait for any lazy-loaded content
    await page.waitForTimeout(500);

    const buttonMetrics = await measureButtonClicks(page, url);

    const memory = await page.evaluate(() => {
      const m = (performance as any).memory;
      if (!m || typeof m.usedJSHeapSize !== 'number') return null;
      return {
        usedJSHeapSize: m.usedJSHeapSize,
        totalJSHeapSize: m.totalJSHeapSize,
        jsHeapSizeMB: (m.usedJSHeapSize / 1024 / 1024).toFixed(1) + 'MB',
      };
    }).catch(() => null);

    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((r: any) => {
          const name = r.name || '';
          return r.initiatorType === 'script' ||
                 name.endsWith('.js') ||
                 name.endsWith('.css') ||
                 name.includes('.js?') ||
                 name.includes('.css?');
        })
        .map((r: any) => ({
          name: (r.name || '').split('/').pop() || r.name,
          type: r.initiatorType === 'script' ? 'JS' : (r.name || '').includes('.css') ? 'CSS' : 'other',
          size: r.transferSize || r.encodedBodySize || 0,
          duration: Math.round(r.duration),
        }));
    }).catch(() => []);

    await page.evaluate(() => performance.clearResourceTimings()).catch(() => {});

    const sortedBySize = [...resources].sort((a, b) => b.size - a.size);
    const totalJSBytes = resources
      .filter(r => r.type === 'JS')
      .reduce((sum, r) => sum + r.size, 0);

    const navMs = navTiming?.navigation ?? Math.round(navigationWallEnd - navigationStart);
    const score = scoreNavigationTime(navMs);

    return {
      label,
      url,
      navigationTiming: navTiming || { navigation: navMs, domContentLoaded: 0, load: 0 },
      paintTiming,
      buttonMetrics,
      longTasks,
      memory,
      resources,
      largestResources: sortedBySize.slice(0, 5).map(r => ({ name: r.name, size: r.size })),
      totalJSBytes,
      lcp: lcp !== null ? Math.round(lcp) : null,
      score,
    };
  } catch (err) {
    console.log(`  [WARN] Failed to measure ${label}: ${err}`);
    return null;
  }
}

test.setTimeout(600000);

test.describe('Performance Tests', () => {
  test('measure performance across all routes on chromium', async ({ page }, testInfo) => {
    const report = new PerformanceReport();

    await page.addInitScript(() => {
      (window as any).__longTasks = [];
      (window as any).__lcp = 0;

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            (window as any).__longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }).observe({ type: 'longtask' });
      } catch {
        // longtask observer not supported
      }

      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            (window as any).__lcp = entries[entries.length - 1].startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // LCP observer not supported
      }
    });

    // Login
    const adminEmail = process.env.PLAYWRIGHT_USERNAME || 'admin@gestao.com';
    const adminPass = process.env.PLAYWRIGHT_PASSWORD || '';

    if (adminPass) {
      console.log('  [LOGIN] Logging in...');
      try {
        await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const emailInput = page.locator(
          'input[type="email"], input[name="email"], input[placeholder*="email" i]'
        ).first();
        const passInput = page.locator(
          'input[type="password"], input[name="password"]'
        ).first();
        const submitBtn = page.locator(
          'button[type="submit"], button:has-text("Entrar"), button:has-text("Login")'
        ).first();

        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await emailInput.fill(adminEmail);
          if (await passInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await passInput.fill(adminPass);
            try {
              await submitBtn.click({ timeout: 5000 });
            } catch {
              console.log('  [WARN] Login button click failed');
            }
            await page.waitForTimeout(3000);
          }
        }
      } catch (err) {
        console.log(`  [WARN] Login navigation failed: ${err}`);
      }

      // Ensure we're past the login page
      try {
        await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch {
        console.log('  [WARN] Post-login goto failed');
      }
    }

    // Reset accumulators after login navigations
    await page.evaluate(() => {
      (window as any).__longTasks = [];
      (window as any).__lcp = 0;
      performance.clearResourceTimings();
    }).catch(() => {});

    for (const r of ROUTES) {
      const fullUrl = r.path === '/' ? PROD_URL : `${PROD_URL}${r.path}`;
      console.log(`\n  [MEASURE] ${r.label} (${fullUrl})`);
      const perf = await measureRoute(page, fullUrl, r.label);
      if (perf) {
        report.add(r.label, perf);
        console.log(
          `    Nav: ${perf.navigationTiming.navigation}ms | ` +
          `FCP: ${perf.paintTiming.firstContentfulPaint !== null ? perf.paintTiming.firstContentfulPaint + 'ms' : 'N/A'} | ` +
          `LCP: ${perf.lcp !== null ? perf.lcp + 'ms' : 'N/A'} | ` +
          `LongTasks: ${perf.longTasks.length} | ` +
          `Score: ${perf.score}`
        );
      }
    }

    report.save();

    const fullReport = report.generateReport();
    console.log(fullReport);
    await testInfo.attach('performance-report', { body: fullReport, contentType: 'text/plain' });

    const allResults = [...report.getAll().values()];
    test.expect.soft(allResults.length).toBe(ROUTES.length);

    const slowPages = allResults.filter(r => r.score === 'SLOW (>3s)');
    test.expect.soft(slowPages.length).toBe(0);

    const highMemPages = allResults.filter(r => {
      if (!r.memory) return false;
      return r.memory.usedJSHeapSize > 100 * 1024 * 1024;
    });
    if (highMemPages.length > 0) {
      console.log(
        `  [MEM WARN] Pages > 100MB heap: ${highMemPages.map(p => `${p.label} (${p.memory?.jsHeapSizeMB})`).join(', ')}`
      );
    }
  });
});
