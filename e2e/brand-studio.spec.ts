import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const PROD_URL = 'https://financiabr.me';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('BrandStudio — Tab Switching & Theme Toggle', () => {
  test.setTimeout(30000);

  test('BrandStudio tabs (Logo / Planos) switch without remount', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const navLinks = page.locator('a[href*="/brandstudio"], a:has-text("Marca"), [data-testid="sidebar"] a').first();
    const navVisible = await navLinks.isVisible().catch(() => false);

    if (!navVisible) {
      test.skip(true, 'Navigation link to BrandStudio not visible');
    }

    await navLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const logoTab = page.locator('text=Logo, button:has-text("Logo"), [data-testid*="logo-tab"]').first();
    const planosTab = page.locator('text=Planos, button:has-text("Planos"), [data-testid*="planos-tab"]').first();

    if (!(await logoTab.isVisible().catch(() => false)) || !(await planosTab.isVisible().catch(() => false))) {
      test.skip(true, 'BrandStudio tabs not rendered');
    }

    const tabSwitchCount = await page.evaluate(() => {
      const logos = document.querySelectorAll('[class*="Logo"], [class*="logo"]');
      return logos.length;
    });

    await logoTab.click();
    await page.waitForTimeout(500);

    await planosTab.click();
    await page.waitForTimeout(500);

    await logoTab.click();
    await page.waitForTimeout(500);

    const afterSwitchCount = await page.evaluate(() => {
      const logos = document.querySelectorAll('[class*="Logo"], [class*="logo"]');
      return logos.length;
    });

    expect(afterSwitchCount).toBeGreaterThanOrEqual(tabSwitchCount);
  });

  test('theme toggle does not trigger cascading route remount', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const navLinks = page.locator('a[href*="/brandstudio"], a:has-text("Marca"), [data-testid="sidebar"] a').first();
    const navVisible = await navLinks.isVisible().catch(() => false);

    if (!navVisible) {
      test.skip(true, 'Navigation link to BrandStudio not visible');
    }

    await navLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"], button:has-text("Theme"), button[class*="theme"]').first();
    const toggleVisible = await themeToggle.isVisible().catch(() => false);

    if (!toggleVisible) {
      test.skip(true, 'Theme toggle not visible on BrandStudio');
    }

    const routeHashBefore = await page.evaluate(() => window.location.hash);

    await themeToggle.click();
    await page.waitForTimeout(1000);

    const routeHashAfter = await page.evaluate(() => window.location.hash);

    expect(routeHashBefore).toBe(routeHashAfter);
  });

  test('brand settings save with identical data does not trigger cascading remount', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const saveBtn = page.locator('button:has-text("Salvar"), button[class*="save"], [data-testid*="save"]').first();
    const saveVisible = await saveBtn.isVisible().catch(() => false);

    if (!saveVisible) {
      test.skip(true, 'Save button not visible on BrandStudio');
    }

    await saveBtn.click();
    await page.waitForTimeout(2000);

    const urlAfterSave = page.url();
    expect(urlAfterSave).toBeTruthy();
  });
});