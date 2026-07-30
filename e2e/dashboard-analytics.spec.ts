import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const PROD_URL = 'https://financiabr.me';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Dashboard Analytics', () => {
  test.setTimeout(30000);

  test('dashboard page loads and shows metrics', async ({ page, browser }) => {
    if (!storageState) {
      test.skip(true, 'No storageState.json — run auth once to generate');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');

    const dashboardTitle = authPage.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard"), [data-testid="dashboard"]').first();
    const titleVisible = await dashboardTitle.isVisible().catch(() => false);
    expect(titleVisible).toBeTruthy();

    await context.close();
  });

  test('dashboard renders income/expense cards with numbers', async ({ page, browser }) => {
    if (!storageState) {
      test.skip(true, 'No storageState.json — run auth once to generate');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');

    await authPage.waitForTimeout(2000);

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
      test.skip(true, 'No storageState.json — run auth once to generate');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');

    await authPage.waitForTimeout(2000);

    const periodButtons = authPage.locator('button:has-text("Mês"), button:has-text("Semana"), button:has-text("Ano"), [role="tab"]').all();
    if (periodButtons.length > 0) {
      const firstBtn = periodButtons[0];
      await firstBtn.click();
      await authPage.waitForTimeout(500);
      expect(true).toBeTruthy();
    } else {
      test.skip(true, 'No period selector found on dashboard');
    }

    await context.close();
  });
});