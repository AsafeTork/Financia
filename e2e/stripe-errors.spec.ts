import { test, expect } from '@playwright/test';

test.describe('Stripe Elements - Errors', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    test.skip(!!process.env.CI, 'Stripe Elements require network access to Stripe CDN');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Card Element', () => {
    test('should show error for expired card', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0069');
      await cardFrame.locator('input[name="exp-date"]').fill('01/20');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.waitForTimeout(1000);
      
      const errorVisible = await cardFrame.locator('[role="alert"]').isVisible().catch(() => false);
      expect(errorVisible).toBeTruthy();
    });

    test('should show error for declined card', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0002');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.waitForTimeout(1000);
      
      const errorVisible = await cardFrame.locator('[role="alert"]').isVisible().catch(() => false);
      expect(errorVisible).toBeTruthy();
    });

    test('should handle network error gracefully', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');

      await page.route('**/api/stripe/**', route => route.abort('failed'));
      
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await page.waitForTimeout(2000);
      
      const errorToast = page.locator('[data-testid="error-toast"], [role="alert"]');
      await expect(errorToast).toBeVisible();
    });

    test('should handle timeout during payment', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');

      await page.route('**/api/stripe/**', route => {
        setTimeout(() => route.abort('timedout'), 60000);
      });
      
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await page.waitForTimeout(5000);
      
      const timeoutError = page.locator('[data-testid="timeout-error"], [role="alert"]:has-text("timeout"):has-text("timed out")');
      await expect(timeoutError).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should display card declined error', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0002');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-declined"], [role="alert"]:has-text("declined")')).toBeVisible({ timeout: 10000 });
    });

    test('should display expired card error', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0069');
      await cardFrame.locator('input[name="exp-date"]').fill('01/20');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-expired"], [role="alert"]:has-text("expired")')).toBeVisible({ timeout: 10000 });
    });

    test('should display incorrect CVC error', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0127');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-cvc"], [role="alert"]:has-text("CVC")')).toBeVisible({ timeout: 10000 });
    });

    test('should display insufficient funds error', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 9995');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-insufficient"], [role="alert"]:has-text("insufficient")')).toBeVisible({ timeout: 10000 });
    });

    test('should handle processing error', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0119');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-processing"], [role="alert"]:has-text("processing")')).toBeVisible({ timeout: 10000 });
    });

    test('should allow retry after error', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0002');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-declined"]')).toBeVisible({ timeout: 10000 });
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 15000 });
    });

    test('should handle Stripe.js load failure', async ({ page }) => {
      await page.route('**/js/stripe.js', route => route.abort('failed'));
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const errorMessage = page.locator('[data-testid="stripe-load-error"], [role="alert"]:has-text("Stripe")');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });
});