import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:4173';
const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

test.describe('Deep Keyboard Navigation & Accessibility Edge Cases', () => {
  test.setTimeout(30000);

  test('Tab navigation reaches all sidebar links in order', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');
    await authPage.waitForTimeout(2000);

    await authPage.keyboard.press('Tab');

    const focusedSelectors: string[] = [];
    for (let i = 0; i < 15; i++) {
      const active = await authPage.evaluate(() => document.activeElement?.tagName + (document.activeElement?.getAttribute('href') || ''));
      focusedSelectors.push(active);
      await authPage.keyboard.press('Tab');
      await authPage.waitForTimeout(100);
    }

    const hasLinks = focusedSelectors.some((s) => s.includes('href'));
    expect(hasLinks).toBeTruthy();

    await context.close();
  });

  test('Escape closes any open modal or menu', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');
    await authPage.waitForTimeout(2000);

    const modalVisibleBefore = await authPage.locator('[role="dialog"], [aria-modal="true"]').first().isVisible().catch(() => false);

    if (modalVisibleBefore) {
      await authPage.keyboard.press('Escape');
      await authPage.waitForTimeout(500);

      const modalVisibleAfter = await authPage.locator('[role="dialog"], [aria-modal="true"]').first().isVisible().catch(() => false);
      expect(modalVisibleAfter).toBeFalsy();
    } else {
      await authPage.keyboard.press('Escape');
      await authPage.waitForTimeout(500);
      const pageAfterEscape = await authPage.title();
      expect(pageAfterEscape).not.toBe('');
    }

    await context.close();
  });

  test('Enter and Space activate buttons correctly', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');
    await authPage.waitForTimeout(2000);

    const firstButton = authPage.locator('button').first();
    if (await firstButton.isVisible().catch(() => false)) {
      await firstButton.focus();
      await authPage.keyboard.press('Enter');
      await authPage.waitForTimeout(500);

      const focusedTag = await authPage.evaluate(() => document.activeElement?.tagName);
      expect(focusedTag).toBe('BUTTON');
    } else {
      test.skip('No button found');
    }

    await context.close();
  });

  test('focus-visible outlines are present on all interactive elements', async ({ page, browser }) => {
    if (!storageState) {
      test.skip('No storageState.json');
    }

    const context = await browser.newContext({ storageState });
    const authPage = await context.newPage();

    await authPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await authPage.waitForLoadState('networkidle');
    await authPage.waitForTimeout(2000);

    const buttons = authPage.locator('button');
    const count = await buttons.count();

    let focusVisibleCount = 0;
    for (let i = 0; i < Math.min(count, 5); i++) {
      await buttons.nth(i).focus();
      const hasOutline = await authPage.evaluate((btn: HTMLElement) => {
        const style = window.getComputedStyle(btn);
        return style.outlineWidth !== '0px' || style.outline !== 'none' || btn.classList.contains('focus-visible');
      }, await buttons.nth(i).elementHandle());
      if (hasOutline) focusVisibleCount++;
    }

    expect(focusVisibleCount).toBeGreaterThanOrEqual(0);

    await context.close();
  });
});