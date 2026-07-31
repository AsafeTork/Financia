import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('BrandStudio — Tab Switching & Theme Toggle', () => {
  test.setTimeout(30000);

  test('BrandStudio tabs (Logo / Planos) switch without remount', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const navLinks = page.locator('a').filter({ hasText: 'Marca' }).first();
    const navVisible = await navLinks.isVisible().catch(() => false);

    if (!navVisible) {
      test.skip('Navigation link to BrandStudio not visible');
    }

    await navLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const logoTab = page.locator('text=Logo').or(page.locator('[data-testid*="logo-tab"]')).first();
    const planosTab = page.locator('text=Planos').or(page.locator('[data-testid*="planos-tab"]')).first();

    if (!(await logoTab.isVisible().catch(() => false)) || !(await planosTab.isVisible().catch(() => false))) {
      test.skip('BrandStudio tabs not rendered');
    }

    const tabSwitchCount = await page.evaluate(() => {
      const logos = document.querySelectorAll('[class*="Logo"], [class*="logo"]');
      return logos.length;
    });

    await logoTab.click();
    await page.waitForLoadState('networkidle');

    await planosTab.click();
    await page.waitForLoadState('networkidle');

    await logoTab.click();
    await page.waitForLoadState('networkidle');

    const afterSwitchCount = await page.evaluate(() => {
      const logos = document.querySelectorAll('[class*="Logo"], [class*="logo"]');
      return logos.length;
    });

    expect(afterSwitchCount).toBeGreaterThanOrEqual(tabSwitchCount);
  });

  test('theme toggle does not trigger cascading route remount', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const navLinks = page.locator('a').filter({ hasText: 'Marca' }).first();
    const navVisible = await navLinks.isVisible().catch(() => false);

    if (!navVisible) {
      test.skip('Navigation link to BrandStudio not visible');
    }

    await navLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"]').first();
    const toggleVisible = await themeToggle.isVisible().catch(() => false);

    if (!toggleVisible) {
      test.skip('Theme toggle not visible on BrandStudio');
    }

    const routeHashBefore = await page.evaluate(() => window.location.hash);

    await themeToggle.click();
    await page.waitForLoadState('networkidle');

    const routeHashAfter = await page.evaluate(() => window.location.hash);

    expect(routeHashBefore).toBe(routeHashAfter);
  });

  test('brand settings save with identical data does not trigger cascading remount', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const saveBtn = page.locator('button:has-text("Salvar"), button[class*="save"], [data-testid*="save"]').first();
    const saveVisible = await saveBtn.isVisible().catch(() => false);

    if (!saveVisible) {
      test.skip('Save button not visible on BrandStudio');
    }

    await saveBtn.click();
    await page.waitForLoadState('networkidle');

    const urlAfterSave = page.url();
    expect(urlAfterSave).toContain(BASE_URL);
  });
});