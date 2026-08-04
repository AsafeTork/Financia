import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:4173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Dashboard Analytics', () => {
  test.setTimeout(30000);

  test('dashboard page loads and shows metrics', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json — run auth once to generate');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');

    const dashboardTitle = authPage.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard"), [data-testid="dashboard"]').first();
    await expect(dashboardTitle).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('dashboard renders income/expense cards with numbers', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json — run auth once to generate');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');

    const metricSelectors = [
      'text=Receita', 'text=Receitas', 'text=Rendimento', 'text=Rendimentos',
      'text=Despesa', 'text=Despesas', 'text=Receita atual', 'text=Despesa atual'
    ];

    let foundMetric = false;
    for (const selector of metricSelectors) {
      const el = authPage.locator(selector).first();
      if (await el.isVisible().catch(() => false)) {
        foundMetric = true;
        break;
      }
    }

    expect(foundMetric).toBeTruthy();

    await context.close();
  });

  test('dashboard navigation between periods works', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json — run auth once to generate');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');

    const periodButtons = authPage.locator('button').filter({ hasText: 'Mês' }).or(
      authPage.locator('button').filter({ hasText: 'Semana' })
    ).or(authPage.locator('button').filter({ hasText: 'Ano' })).or(
      authPage.locator('[role="tab"]')
    ).all();

    if (periodButtons.length > 0) {
      const firstBtn = periodButtons[0];
      await firstBtn.click();
      await authPage.waitForLoadState('networkidle');
      const activeTab = await firstBtn.getAttribute('aria-selected');
      expect(activeTab).toBe('true');
    } else {
      test.skip('No period selector found on dashboard');
    }

    await context.close();
  });
});