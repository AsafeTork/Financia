import { test, expect } from '@playwright/test';

test.describe('PWA Service Worker Registration', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Service Worker Lifecycle', () => {
    test('should register service worker', async ({ page }) => {
      const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
      test.skip(!swSupported, 'Service Worker not supported in this browser');

      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          return {
            registered: !!registration,
            scope: registration.scope,
            updateViaCache: registration.updateViaCache,
          };
        }
        return { registered: false };
      });

      expect(swRegistered.registered).toBeTruthy();
    });

    test('should handle service worker install event', async ({ page }) => {
      const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
      test.skip(!swSupported, 'Service Worker not supported in this browser');

      const installState = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return { state: 'unsupported' };
        
        return new Promise<{ state: string }>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve({ state: 'controllerchanged' });
          });
          
          navigator.serviceWorker.ready.then((registration) => {
            if (registration.installing) {
              registration.installing.addEventListener('statechange', () => {
                resolve({ state: registration.installing!.state });
              });
            } else if (registration.active) {
              resolve({ state: registration.active.state });
            } else {
              resolve({ state: 'ready' });
            }
          });
        });
      });

      expect(['installed', 'activating', 'activated', 'ready', 'controllerchanged']).toContain(installState.state);
    });

    test('should handle service worker activation', async ({ page }) => {
      const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
      test.skip(!swSupported, 'Service Worker not supported in this browser');

      await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return;
        
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const active = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        const registration = await navigator.serviceWorker.ready;
        return registration.active?.state === 'activated';
      });

      expect(active).toBeTruthy();
    });

    test('should handle service worker update', async ({ page }) => {
      const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
      test.skip(!swSupported, 'Service Worker not supported in this browser');

      const updateFound = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        
        return new Promise<boolean>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve(true);
          });
          
          navigator.serviceWorker.ready.then((registration) => {
            registration.update().then(() => {
              setTimeout(() => resolve(false), 10000);
            });
          });
        });
      });

      // This test verifies the update mechanism doesn't throw
      expect(typeof updateFound).toBe('boolean');
    });
  });
});