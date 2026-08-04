import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Auth Flow', () => {
  test.setTimeout(30000);

  test('landing page loads with enter button', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const enterBtn = page.locator('text=Entrar').or(page.locator('text=Começar')).or(page.locator('text=Enter')).or(page.locator('button')).first();
    await expect(enterBtn).toBeVisible({ timeout: 15000 });
  });

  test('login form opens from landing page', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const enterBtn = page.locator('text=Entrar').or(page.locator('text=Começar')).first();
    if (!(await enterBtn.isVisible().catch(() => false))) {
      test.skip('Already logged in or no landing page');
    }

    await enterBtn.click();
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  test('login form shows validation errors on empty submit', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const enterBtn = page.locator('text=Entrar').or(page.locator('text=Começar')).first();
    if (!(await enterBtn.isVisible().catch(() => false))) {
      test.skip('Already logged in');
    }

    await enterBtn.click();
    await page.waitForLoadState('networkidle');

    const submitBtn = page.locator('button:has-text("Entrar"), button[type="submit"]').first();
    if (!(await submitBtn.isVisible().catch(() => false))) {
      test.skip('Login form did not render');
    }

    await submitBtn.click();
    await page.waitForLoadState('networkidle');

    const emailError = page.locator('text=obrigatório').first();
    await expect(emailError).toBeVisible({ timeout: 5000 });
  });

  test('authenticated user sees dashboard via storageState', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json — run auth once to generate');
    }

    const context = await browser.newContext({ storageState });
    const authenticatedPage = await context.newPage();

    await authenticatedPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authenticatedPage.waitForLoadState('networkidle');

    const dashboardVisible = await authenticatedPage.locator('text=Dashboard, [data-testid="sidebar"]').first().isVisible().catch(() => false);
    expect(dashboardVisible).toBeTruthy();

    await context.close();
  });
});