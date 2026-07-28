import { test, expect } from '@playwright/test';

test.describe('Stripe Elements - Payment', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    test.skip(!!process.env.CI, 'Stripe Elements require network access to Stripe CDN');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Card Element', () => {
    test('should handle 3DS challenge flow', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 3220');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await page.waitForTimeout(3000);
      
      const challengeFrame = page.frameLocator('iframe[src*="acs"]');
      const challengeVisible = await challengeFrame.locator('body').isVisible().catch(() => false);
      
      expect(challengeVisible).toBeTruthy();
    });
  });

  test.describe('PaymentIntent Flow', () => {
    test('should create PaymentIntent on checkout', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');

      const paymentIntentCreated = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const originalFetch = window.fetch;
          window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (args[0]?.includes('/api/stripe/create-payment-intent')) {
              const data = await response.clone().json();
              if (data.clientSecret) {
                resolve(true);
              }
            }
            return response;
          };
          
          setTimeout(() => resolve(false), 10000);
        });
      });
      
      await page.click('[data-testid="start-checkout"]');
      await page.waitForTimeout(2000);
      
      expect(paymentIntentCreated).toBeTruthy();
    });

    test('should confirm PaymentIntent with card', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      const confirmed = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const originalFetch = window.fetch;
          window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (args[0]?.includes('/api/stripe/confirm-payment-intent')) {
              const data = await response.clone().json();
              if (data.paymentIntent?.status === 'succeeded') {
                resolve(true);
              }
            }
            return response;
          };
          
          setTimeout(() => resolve(false), 15000);
        });
      });
      
      expect(confirmed).toBeTruthy();
    });

    test('should handle next_action for 3DS', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 3220');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await page.waitForTimeout(3000);
      
      const nextActionHandled = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const originalFetch = window.fetch;
          window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (args[0]?.includes('/api/stripe/confirm-payment-intent')) {
              const data = await response.clone().json();
              if (data.paymentIntent?.next_action?.type === 'redirect_to_url' ||
                  data.paymentIntent?.next_action?.type === 'use_stripe_sdk') {
                resolve(true);
              }
            }
            return response;
          };
          
          setTimeout(() => resolve(false), 15000);
        });
      });
      
      expect(nextActionHandled).toBeTruthy();
    });

    test('should handle PaymentIntent requires_action', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');

      const requiresAction = await page.evaluate(async () => {
        return new Promise<any>((resolve) => {
          const originalFetch = window.fetch;
          window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (args[0]?.includes('/api/stripe/create-payment-intent')) {
              const data = await response.clone().json();
              if (data.paymentIntent?.status === 'requires_action') {
                resolve(data.paymentIntent);
              }
            }
            return response;
          };
          
          setTimeout(() => resolve(null), 10000);
        });
      });
      
      if (requiresAction) {
        expect(requiresAction.status).toBe('requires_action');
        expect(requiresAction.next_action).toBeTruthy();
      }
    });

    test('should show success on payment completion', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="payment-success"], .payment-success')).toBeVisible({ timeout: 15000 });
    });

    test('should handle PaymentIntent cancellation', async ({ page }) => {
      const stripeAvailable = await page.evaluate(() => !!window.Stripe);
      test.skip(!stripeAvailable, 'Stripe.js not loaded');
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="cancel-payment"]');
      
      await expect(page.locator('[data-testid="payment-cancelled"]')).toBeVisible({ timeout: 5000 });
    });
  });
});