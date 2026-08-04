import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROD_URL = 'http://localhost:4173';

interface RequestLog {
  url: string;
  method: string;
  timestamp: number;
  resourceType: string;
}

interface NetworkReport {
  totalRequests: number;
  duplicateRequests: { url: string; count: number; interval: number }[];
  syncLoopDetected: boolean;
  iconLoopDetected: boolean;
  heavyResources: { url: string; size: number }[];
  requestsPerSecond: number;
  avgResponseTime: number;
  slowRequests: { url: string; duration: number }[];
  wsConnections: number;
  realtimeEvents: number;
  score: string;
}

class NetworkMonitor {
  private requests: RequestLog[] = [];
  private responseTimes: number[] = [];
  private wsConnections = 0;
  private realtimeEvents = 0;
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async start(): Promise<void> {
    this.page.on('request', (req) => {
      this.requests.push({
        url: req.url(),
        method: req.method(),
        timestamp: Date.now(),
        resourceType: req.resourceType(),
      });
    });

    this.page.on('response', (res) => {
      const timing = res.request().timing();
      if (timing.responseStart > 0) {
        this.responseTimes.push(timing.responseStart);
      }
    });

    await this.page.evaluate(() => {
      const origFetch = window.fetch;
      (window as any).__networkMonitor = {
        wsCount: 0,
        realtimeCount: 0,
      };

      const origWS = window.WebSocket;
      window.WebSocket = function(...args: any[]) {
        (window as any).__networkMonitor.wsCount++;
        return new origWS(...args);
      } as any;
      window.WebSocket.prototype = origWS.prototype;
    });
  }

  async stop(): Promise<void> {
    const monitorData = await this.page.evaluate(() => (window as any).__networkMonitor || {}).catch(() => ({}));
    this.wsConnections = monitorData.wsCount || 0;
    this.realtimeEvents = monitorData.realtimeCount || 0;
  }

  getRequests(): RequestLog[] {
    return this.requests;
  }

  analyze(): NetworkReport {
    const now = Date.now();
    const windowMs = 30000;
    const recentRequests = this.requests.filter(r => now - r.timestamp < windowMs);
    const totalRequests = recentRequests.length;
    const requestsPerSecond = totalRequests / (windowMs / 1000);

    const urlCounts = new Map<string, number[]>();
    for (const req of recentRequests) {
      const key = req.method + ' ' + req.url.split('?')[0];
      if (!urlCounts.has(key)) urlCounts.set(key, []);
      urlCounts.get(key)!.push(req.timestamp);
    }

    const duplicateRequests: { url: string; count: number; interval: number }[] = [];
    let iconLoopDetected = false;
    let syncLoopDetected = false;

    for (const [url, timestamps] of urlCounts) {
      if (timestamps.length >= 3) {
        timestamps.sort((a, b) => a - b);
        const intervals: number[] = [];
        for (let i = 1; i < timestamps.length; i++) {
          intervals.push(timestamps[i] - timestamps[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        duplicateRequests.push({ url, count: timestamps.length, interval: Math.round(avgInterval) });

        if (url.includes('icon-192') && avgInterval < 5000) {
          iconLoopDetected = true;
        }
        if (url.includes('company_profiles') && avgInterval < 5000) {
          syncLoopDetected = true;
        }
      }
    }

    duplicateRequests.sort((a, b) => b.count - a.count);

    const slowRequests = recentRequests
      .filter(r => r.resourceType === 'fetch' || r.resourceType === 'xhr')
      .map(r => {
        const timing = this.page.context().pages()[0]?.url();
        return { url: r.url.split('/').pop() || r.url, duration: 0 };
      })
      .filter(r => r.duration > 2000);

    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    let score = 'GOOD';
    if (iconLoopDetected || syncLoopDetected) score = 'CRITICAL';
    else if (requestsPerSecond > 10) score = 'WARNING';
    else if (duplicateRequests.length > 5) score = 'WARNING';

    return {
      totalRequests,
      duplicateRequests: duplicateRequests.slice(0, 10),
      syncLoopDetected,
      iconLoopDetected,
      heavyResources: [],
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      slowRequests: slowRequests.slice(0, 5),
      wsConnections: this.wsConnections,
      realtimeEvents: this.realtimeEvents,
      score,
    };
  }
}

test.setTimeout(300000);

test.describe('Network Performance & Sync Loop Detection', () => {
  test('detect sync loops, icon loops, and excessive network activity', async ({ page }, testInfo) => {
    const monitor = new NetworkMonitor(page);
    await monitor.start();

    const adminEmail = process.env.PLAYWRIGHT_USERNAME || 'admin@gestao.com';
    const adminPass = process.env.PLAYWRIGHT_PASSWORD || '';

    if (adminPass) {
      try {
        await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passInput = page.locator('input[type="password"]').first();
        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await emailInput.fill(adminEmail);
          if (await passInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await passInput.fill(adminPass);
            await page.locator('button[type="submit"], button:has-text("Entrar")').first().click({ timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(3000);
          }
        }
      } catch {
        console.log('[WARN] Login failed, continuing unauthenticated');
      }
    }

    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    console.log('[MONITOR] Waiting 15s to capture baseline network activity...');
    await page.waitForTimeout(15000);

    const baselineReport = monitor.analyze();
    console.log(`[BASELINE] ${baselineReport.totalRequests} requests, ${baselineReport.requestsPerSecond} req/s, Score: ${baselineReport.score}`);

    if (baselineReport.iconLoopDetected) {
      console.log('[CRITICAL] icon-192.svg LOOP DETECTED! Requests every <5s');
    }
    if (baselineReport.syncLoopDetected) {
      console.log('[CRITICAL] company_profiles SYNC LOOP DETECTED!');
    }
    if (baselineReport.duplicateRequests.length > 0) {
      console.log('[DUPLICATES]');
      for (const d of baselineReport.duplicateRequests.slice(0, 5)) {
        console.log(`  ${d.url}: ${d.count}x, avg interval ${d.interval}ms`);
      }
    }

    console.log('\n[TEST] Navigating all routes to check for per-route network issues...');
    const routes = ['/#/', '/#/vendas', '/#/despesas', '/#/estoque', '/#/relatorios', '/#/configuracoes', '/#/planos'];
    for (const route of routes) {
      const url = `${PROD_URL}${route}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
    }

    console.log('\n[TEST] Simulating theme toggle clicks...');
    const themeToggle = page.locator('[data-theme-toggle], button:has-text("tema"), button:has-text("theme")').first();
    if (await themeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      for (let i = 0; i < 5; i++) {
        await themeToggle.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(5000);
    await monitor.stop();

    const finalReport = monitor.analyze();
    console.log(`\n[FINAL] ${finalReport.totalRequests} total requests, ${finalReport.requestsPerSecond} req/s`);
    console.log(`[FINAL] Score: ${finalReport.score}`);
    console.log(`[FINAL] Icon loop: ${finalReport.iconLoopDetected}, Sync loop: ${finalReport.syncLoopDetected}`);

    const reportText = [
      '=== NETWORK PERFORMANCE REPORT ===',
      `Total requests: ${finalReport.totalRequests}`,
      `Requests/sec: ${finalReport.requestsPerSecond}`,
      `Avg response time: ${finalReport.avgResponseTime}ms`,
      `Icon loop detected: ${finalReport.iconLoopDetected}`,
      `Sync loop detected: ${finalReport.syncLoopDetected}`,
      `Score: ${finalReport.score}`,
      '',
      '--- Duplicate Requests (potential loops) ---',
      ...finalReport.duplicateRequests.map(d =>
        `  ${d.url}: ${d.count}x, avg interval ${d.interval}ms`
      ),
      '',
      '--- Slow Requests ---',
      ...finalReport.slowRequests.map(r => `  ${r.url}: ${r.duration}ms`),
    ].join('\n');

    await testInfo.attach('network-report', { body: reportText, contentType: 'text/plain' });
    fs.writeFileSync(path.join(process.cwd(), 'network-perf-results.json'), JSON.stringify(finalReport, null, 2));

    expect(finalReport.iconLoopDetected, 'icon-192.svg loop detected — theme toggle causes infinite re-fetches').toBe(false);
    expect(finalReport.syncLoopDetected, 'company_profiles sync loop detected — realtime triggers infinite sync').toBe(false);
    expect(finalReport.requestsPerSecond, 'too many requests per second (>15)').toBeLessThan(15);
  });
});
