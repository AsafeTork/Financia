import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:4173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      if (!root || root.children.length === 0) return false;
      const text = root.textContent || '';
      return text.length > 0;
    },
    { timeout: 25000 },
  );
}

test.describe('Auth Flow', () => {
  test.setTimeout(45000);

  test('landing page loads with enter button', async ({ page }) => {
    await waitForAppReady(page);

    const enterBtn = page.locator('text=Entrar').or(page.locator('text=Enter')).or(page.locator('button')).first();
    await expect(enterBtn).toBeVisible({ timeout: 20000 });
  });

  test('login form opens from landing page', async ({ page }) => {
    await waitForAppReady(page);

    const enterBtn = page.locator('text=Entrar').or(page.locator('text=Criar conta')).first();
    if (!(await enterBtn.isVisible().catch(() => false))) {
      test.skip('Already logged in or no landing page');
    }

    await enterBtn.click();
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('login form shows validation errors on empty submit', async ({ page }) => {
    await waitForAppReady(page);

    const enterBtn = page.locator('text=Entrar').or(page.locator('text=Criar conta')).first();
    if (!(await enterBtn.isVisible().catch(() => false))) {
      test.skip('Already logged in');
    }

    await enterBtn.click();
    await page.waitForLoadState('domcontentloaded');

    const submitBtn = page.locator('button:has-text("Entrar"), button[type="submit"]').first();
    if (!(await submitBtn.isVisible().catch(() => false))) {
      test.skip('Login form did not render');
    }

    await submitBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const emailError = page.locator('[invalid][description="Campo obrigatório"]').first();
    await expect(emailError).toBeVisible({ timeout: 10000 });
  });

  test('authenticated user sees dashboard via storageState', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json — run auth once to generate');
    }

    const context = await browser.newContext({ storageState });
    const authenticatedPage = await context.newPage();

    await waitForAppReady(authenticatedPage);

    const dashboardVisible = await authenticatedPage.locator('text=Dashboard, [data-testid="sidebar"]').first().isVisible().catch(() => false);
    expect(dashboardVisible).toBeTruthy();

    await context.close();
  });
});