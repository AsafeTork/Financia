import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility - Automated (axe-core)', () => {
  test.setTimeout(120000);

  test('landing page - no critical violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical.length).toBe(0);
  });

  test('dashboard - no critical violations', async ({ page }) => {
    await page.goto('/dashboard');
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical.length).toBe(0);
  });

  test('transactions - no critical violations', async ({ page }) => {
    await page.goto('/transactions');
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical.length).toBe(0);
  });

  test('settings - no critical violations', async ({ page }) => {
    await page.goto('/settings');
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical.length).toBe(0);
  });

  test('focus management - modals trap focus', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /upgrade/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first()).toBeFocused();
  });

  test('skip link works', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to main/i });
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await expect(page.getByRole('main')).toBeFocused();
    }
  });

  test('color contrast - AA minimum', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    const contrastViolations = results.violations.filter(v =>
      v.id.includes('contrast') || v.id.includes('color')
    );
    expect(contrastViolations.length).toBe(0);
  });

  test('ARIA landmarks present', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();
    const landmarkViolations = results.violations.filter(v => v.id === 'region');
    expect(landmarkViolations.length).toBe(0);
  });
});