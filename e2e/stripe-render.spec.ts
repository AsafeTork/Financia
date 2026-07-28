import { test, expect } from '@playwright/test';

test.describe('Stripe Elements - Render', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    test.skip(!!process.env.CI, 'Stripe Elements require network access to Stripe CDN');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Card Element', () => {
    test('should render Stripe Card Element', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      await expect(cardFrame.locator('input[name="cardnumber"]')).toBeVisible();
      await expect(cardFrame.locator('input[name="exp-date"]')).toBeVisible();
      await expect(cardFrame.locator('input[name="cvc"]')).toBeVisible();
    });

    test('should accept valid card number', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      await cardFrame.locator('input[name="postal"]').fill('12345');
      
      await page.waitForTimeout(500);
      
      const isComplete = await cardFrame.evaluate(() => {
        const input = document.querySelector('input[name="cardnumber"]');
        return input?.value.replace(/\s/g, '').length === 16;
      });
      
      expect(isComplete).toBeTruthy();
    });

    test('should show inline validation errors', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('123');
      await cardFrame.locator('input[name="cardnumber"]').blur();
      
      await page.waitForTimeout(500);
      
      const errorVisible = await cardFrame.locator('[role="alert"], .InputContainer--invalid').isVisible().catch(() => false);
      expect(errorVisible).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on card inputs', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      const cardNumberInput = cardFrame.locator('input[name="cardnumber"]');
      const expDateInput = cardFrame.locator('input[name="exp-date"]');
      const cvcInput = cardFrame.locator('input[name="cvc"]');
      
      await expect(cardNumberInput).toHaveAttribute('aria-label', /card number/i);
      await expect(expDateInput).toHaveAttribute('aria-label', /expiration/i);
      await expect(cvcInput).toHaveAttribute('aria-label', /cvc|security code/i);
    });

    test('should announce errors to screen readers', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('123');
      await cardFrame.locator('input[name="cardnumber"]').blur();
      
      await page.waitForTimeout(500);
      
      const alert = cardFrame.locator('[role="alert"]');
      await expect(alert).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').focus();
      await page.keyboard.press('Tab');
      
      await expect(cardFrame.locator('input[name="exp-date"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(cardFrame.locator('input[name="cvc"]')).toBeFocused();
    });
  });

  test.describe('Stripe Elements Lifecycle', () => {
    test('should mount elements on checkout page', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');

      const elementsMounted = await page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          const checkElements = () => {
            if (window.Stripe && document.querySelector('iframe[name^="__privateStripeFrame"]')) {
              resolve(true);
            } else {
              setTimeout(checkElements, 100);
            }
          };
          checkElements();
          
          setTimeout(() => resolve(false), 10000);
        });
      });
      
      expect(elementsMounted).toBeTruthy();
    });

    test('should unmount elements on navigation away', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const elementsUnmounted = await page.evaluate(() => {
        return !document.querySelector('iframe[name^="__privateStripeFrame"]');
      });
      
      expect(elementsUnmounted).toBeTruthy();
    });

    test('should re-mount elements on return to checkout', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await page.goto('/checkout');
      await page.waitForLoadState('networkidle');
      
      const elementsRemounted = await page.evaluate(() => {
        return !!document.querySelector('iframe[name^="__privateStripeFrame"]');
      });
      
      expect(elementsRemounted).toBeTruthy();
    });
  });
});