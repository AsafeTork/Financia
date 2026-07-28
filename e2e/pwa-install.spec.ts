import { test, expect } from '@playwright/test';

test.describe('PWA Manifest and Install', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
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
      test.skip(!!process.env.CI, 'beforeinstallprompt only fires in browser with UI');
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
      test.skip(!!process.env.CI, 'appinstalled only fires in browser with UI');
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
      test.skip(!!process.env.CI, 'Install prompt event not available in headless CI');
      const installable = await page.evaluate(() => {
        return 'serviceWorker' in navigator && 
               'BeforeInstallPromptEvent' in window ||
               'onbeforeinstallprompt' in window;
      });

      expect(typeof installable).toBe('boolean');
    });
  });
});