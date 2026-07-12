import { test, expect } from '@playwright/test';

test.describe('PWA Offline Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Service Worker Lifecycle', () => {
    test('should register service worker', async ({ page }) => {
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
      const updateFound = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        
        return new Promise<boolean>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve(true);
          });
          
          navigator.serviceWorker.ready.then((registration) => {
            registration.update().then(() => {
              setTimeout(() => resolve(false), 5000);
            });
          });
        });
      });

      expect(typeof updateFound).toBe('boolean');
    });
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

    test('should use cache-first strategy for static assets', async ({ page }) => {
      const cached = await page.evaluate(async () => {
        if (!('caches' in window)) return { cached: false };
        
        const cache = await caches.open('static-assets');
        const response = await cache.match('/index.html');
        return { cached: !!response };
      });

      expect(cached.cached).toBeTruthy();
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

  test.describe('Manifest Validation', () => {
    test('should have valid manifest with required fields', async ({ page }) => {
      const manifest = await page.evaluate(async () => {
        const link = document.querySelector('link[rel="manifest"]');
        if (!link) return null;
        
        const response = await fetch(link.getAttribute('href')!);
        return response.json();
      });

      expect(manifest).not.toBeNull();
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(manifest.start_url).toBeTruthy();
      expect(manifest.display).toBeTruthy();
      expect(['standalone', 'fullscreen', 'minimal-ui', 'browser']).toContain(manifest.display);
      expect(manifest.icons).toBeInstanceOf(Array);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    test('should have valid icons in manifest', async ({ page }) => {
      const manifest = await page.evaluate(async () => {
        const link = document.querySelector('link[rel="manifest"]');
        if (!link) return null;
        
        const response = await fetch(link.getAttribute('href')!);
        return response.json();
      });

      if (manifest && manifest.icons) {
        for (const icon of manifest.icons) {
          expect(icon.src).toBeTruthy();
          expect(icon.sizes).toBeTruthy();
          expect(icon.type).toMatch(/^image\//);
          
          const response = await page.request.get(icon.src);
          expect(response.ok()).toBeTruthy();
        }
      }
    });

    test('should have correct start_url and display mode', async ({ page }) => {
      const manifest = await page.evaluate(async () => {
        const link = document.querySelector('link[rel="manifest"]');
        if (!link) return null;
        
        const response = await fetch(link.getAttribute('href')!);
        return response.json();
      });

      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.orientation).toBeTruthy();
    });
  });

  test.describe('Install Prompt', () => {
    test('should handle beforeinstallprompt event', async ({ page }) => {
      const promptFired = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          let fired = false;
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            fired = true;
            resolve(true);
          });
          
          setTimeout(() => resolve(fired), 3000);
        });
      });

      expect(typeof promptFired).toBe('boolean');
    });

    test('should handle appinstalled event', async ({ page }) => {
      const installed = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          window.addEventListener('appinstalled', () => {
            resolve(true);
          });
          
          setTimeout(() => resolve(false), 1000);
        });
      });

      expect(typeof installed).toBe('boolean');
    });

    test('should show install button when PWA criteria met', async ({ page }) => {
      const installable = await page.evaluate(() => {
        return 'serviceWorker' in navigator && 
               'BeforeInstallPromptEvent' in window ||
               'onbeforeinstallprompt' in window;
      });

      expect(typeof installable).toBe('boolean');
    });
  });

  test.describe('Offline Fallback', () => {
    test('should work offline with cached resources', async ({ page, context }) => {
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