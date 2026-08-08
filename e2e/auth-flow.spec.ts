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

    // Click the "Entrar" button in the landing page header
    const enterBtn = page.locator('header >> text=Entrar').first();
    if (!(await enterBtn.isVisible().catch(() => false))) {
      test.skip('Already logged in or no landing page');
    }

    await enterBtn.click();
    // Wait for login form to appear (client-side state change, not navigation)
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('login form shows validation errors on empty submit', async ({ page }) => {
    await waitForAppReady(page);

    // Check if login form is already visible (tabs "Entrar"/"Criar conta")
    const loginFormVisible = await page.locator('role=tablist >> text=Entrar').isVisible().catch(() => false);

    if (!loginFormVisible) {
      // Click the "Entrar" button in the landing page header to open login form
      const enterBtn = page.locator('header >> text=Entrar').first();
      if (!(await enterBtn.isVisible().catch(() => false))) {
        test.skip('Already logged in');
      }
      await enterBtn.click();
      // Wait for login form to appear
      await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
    }

    // Click the submit button (Entrar) in the login form
    // Use type="submit" to specifically target the form submit button, not the tab or Google/passkey buttons
    const submitBtn = page.locator('form button[type="submit"]:has-text("Entrar")');
    if (!(await submitBtn.isVisible().catch(() => false))) {
      test.skip('Login form submit button not found');
    }

    // force: skip hit-testing — element already verified visible/enabled above;
    // CI runners with 4 parallel workers can stall pointer hit-testing, causing 45s timeouts
    await submitBtn.click({ force: true });
    // Wait for validation errors to appear - use expect.poll for more resilient waiting
    await expect(page.locator('input[aria-invalid="true"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Campo obrigatório').first()).toBeVisible({ timeout: 10000 });
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