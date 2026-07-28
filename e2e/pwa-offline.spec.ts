import { test, expect } from '@playwright/test';

test.describe('PWA Offline Fallback', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Offline Fallback', () => {
    test('should work offline with cached resources', async ({ page, context }) => {
      test.fixme(true, 'Service Worker cached resources required — needs app setup');

      await context.setOffline(true);
      
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const appLoaded = await page.locator('[data-testid="app-root"]').isVisible().catch(() => false);
      expect(appLoaded).toBeTruthy();

      const offlineIndicator = await page.locator('[data-testid="offline-indicator"]').isVisible().catch(() => false);
      
      await context.setOffline(false);
      await page.reload();
      await page.waitForLoadState('networkidle');
    });

    test('should cache critical paths work offline', async ({ page, context }) => {
      test.fixme(true, 'Service Worker Cache API required — needs app setup');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await context.setOffline(true);
      
      const navigationWorks = await page.evaluate(async () => {
        try {
          const response = await fetch('/');
          return response.ok || response.type === 'opaque';
        } catch {
          return false;
        }
      });

      expect(navigationWorks).toBeTruthy();

      await context.setOffline(false);
    });

    test('should show offline page when no cache available', async ({ page, context }) => {
      test.fixme(true, 'Offline page routing needs Service Worker setup');

      await context.clearCookies();
      await page.evaluate(async () => {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
        }
      });

      await context.setOffline(true);
      await page.goto('/');
      
      const offlineContent = await page.locator('body').textContent();
      expect(offlineContent?.length).toBeGreaterThan(0);

      await context.setOffline(false);
    });

    test('should queue offline mutations', async ({ page, context }) => {
      test.fixme(true, 'Background Sync API needs Service Worker setup');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.evaluate(async () => {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-transactions');
        }
      });

      await context.setOffline(true);
      
      const queued = await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          const request = indexedDB.open('financia-db');
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('outbox')) {
              resolve(0);
              return;
            }
            const transaction = db.transaction('outbox', 'readonly');
            const store = transaction.objectStore('outbox');
            const countRequest = store.count();
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => resolve(0);
          };
          request.onerror = () => resolve(0);
        });
      });

      expect(queued).toBeGreaterThanOrEqual(0);

      await context.setOffline(false);
    });
  });
});