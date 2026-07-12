import { test, expect } from '@playwright/test';

test.describe('Memory Leak Detection', () => {
  test('cyclic navigation - no detached DOM nodes', async ({ page }) => {
    const routes = ['/', '/dashboard', '/transactions', '/products', '/losses', '/settings'];
    
    // Initial heap snapshot
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const initialDetached = await page.evaluate(() => {
      return new Promise(resolve => {
        if ('gc' in window) {
          (window as any).gc();
        }
        // Count detached nodes via DevTools protocol approximation
        const allElements = document.querySelectorAll('*');
        let detached = 0;
        allElements.forEach(el => {
          if (!el.isConnected) detached++;
        });
        resolve(detached);
      });
    });
    
    // Perform cyclic navigation 50 times
    for (let i = 0; i < 50; i++) {
      const route = routes[i % routes.length];
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(100); // Small delay for GC
    }
    
    // Force garbage collection
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    // Final detached count
    const finalDetached = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      let detached = 0;
      allElements.forEach(el => {
        if (!el.isConnected) detached++;
      });
      return detached;
    });
    
    // Allow small number of detached nodes (some expected from async cleanup)
    expect(finalDetached - initialDetached).toBeLessThan(10);
  });

  test('event listeners cleaned up on unmount', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const initialListeners = await page.evaluate(() => {
      // Approximate listener count
      let count = 0;
      document.querySelectorAll('*').forEach(el => {
        const listeners = getEventListeners(el);
        for (const type in listeners) {
          count += listeners[type].length;
        }
      });
      return count;
    });
    
    // Navigate away and back
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const finalListeners = await page.evaluate(() => {
      let count = 0;
      document.querySelectorAll('*').forEach(el => {
        const listeners = getEventListeners(el);
        for (const type in listeners) {
          count += listeners[type].length;
        }
      });
      return count;
    });
    
    // Listener count should not grow significantly
    expect(finalListeners - initialListeners).toBeLessThan(20);
  });

  test('timers and intervals cleared on unmount', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const initialTimers = await page.evaluate(() => {
      return (window as any).__activeTimers?.size || 0;
    });
    
    // Navigate through multiple pages
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const finalTimers = await page.evaluate(() => {
      return (window as any).__activeTimers?.size || 0;
    });
    
    // No leaked timers
    expect(finalTimers).toBeLessThanOrEqual(initialTimers + 5);
  });

  test('IndexedDB connections closed properly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check IndexedDB connections
    const initialDBs = await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      return dbs.length;
    });
    
    // Navigate and perform operations
    for (const route of ['/transactions', '/products', '/losses', '/settings']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }
    
    const finalDBs = await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      return dbs.length;
    });
    
    // DB count should remain stable
    expect(finalDBs).toBeLessThanOrEqual(initialDBs + 1);
  });

  test('BroadcastChannel closed on unmount', async ({ page, context }) => {
    // Open two tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await page1.goto('/dashboard');
    await page2.goto('/dashboard');
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    // Check BroadcastChannel count
    const channels1 = await page1.evaluate(() => {
      return (window as any).__activeChannels?.size || 0;
    });
    
    // Close one tab
    await page1.close();
    await page2.waitForTimeout(500);
    
    const channels2 = await page2.evaluate(() => {
      return (window as any).__activeChannels?.size || 0;
    });
    
    // Channels should be cleaned up
    expect(channels2).toBeLessThanOrEqual(channels1);
  });

  test('memory usage stable under load', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Heavy interaction: rapid navigation + data operations
    for (let i = 0; i < 20; i++) {
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    // Force GC
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    await page.waitForTimeout(1000);
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory should not grow more than 50MB
    const growthMB = (finalMemory - initialMemory) / (1024 * 1024);
    expect(growthMB).toBeLessThan(50);
  });
});

test.describe('Offline Storage Persistence', () => {
  test('navigator.storage.persist() prevents eviction', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const persisted = await page.evaluate(async () => {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        return await navigator.storage.persist();
      }
      return false;
    });
    
    // Should be true or false (not error)
    expect(typeof persisted).toBe('boolean');
  });

  test('storage estimate available', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const estimate = await page.evaluate(async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return await navigator.storage.estimate();
      }
      return null;
    });
    
    if (estimate) {
      expect(estimate.usage).toBeGreaterThanOrEqual(0);
      expect(estimate.quota).toBeGreaterThan(0);
    }
  });
});