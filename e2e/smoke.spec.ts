import { test, expect } from '@playwright/test';
test.setTimeout(30000);
test('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeAttached();
});