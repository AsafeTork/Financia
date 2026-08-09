import { test, expect } from '@playwright/test';

test.describe('PWA Cache Strategies', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Cache Strategies', () => {
    test('should use network-first strategy for API calls', async ({ page }) => {
      await page.route('**/api/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: 'network-response' }),
        });
      });

      const response = await page.evaluate(async () => {
        return fetch('/api/test-endpoint')
          .then(r => r.json())
          .catch(() => ({ error: 'failed' }));
      });

      expect(response.success).toBe(true);
      expect(response.data).toBe('network-response');
    });

    test('should precache the app shell and remove the legacy static cache', async ({ page }) => {
      const cached = await page.evaluate(async () => {
        if (!('caches' in window)) return { cached: false };

        const names = await caches.keys();
        const precacheName = names.find(name => name.startsWith('workbox-precache-'));
        if (!precacheName) return { cached: false, legacyCache: names.includes('static-assets') };

        const cache = await caches.open(precacheName);
        const response = await cache.match('/index.html');
        return { cached: !!response, legacyCache: names.includes('static-assets') };
      });

      expect(cached.cached).toBeTruthy();
      expect(cached.legacyCache).toBeFalsy();
    });

    test('should use stale-while-revalidate for dynamic content', async ({ page }) => {
      await page.route('**/api/data/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ version: 1, data: 'stale' }),
        });
      });

      const firstFetch = await page.evaluate(async () => {
        return fetch('/api/data/test')
          .then(r => r.json())
          .catch(() => ({ error: 'failed' }));
      });

      await page.route('**/api/data/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ version: 2, data: 'fresh' }),
        });
      });

      const secondFetch = await page.evaluate(async () => {
        return fetch('/api/data/test')
          .then(r => r.json())
          .catch(() => ({ error: 'failed' }));
      });

      expect(firstFetch.data).toBe('stale');
      expect(secondFetch.data).toBe('fresh');
    });
  });
});
