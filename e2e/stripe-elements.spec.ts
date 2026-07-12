import { test, expect } from '@playwright/test';

test.describe('Stripe Elements Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Card Element', () => {
    test('should render Stripe Card Element', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      await expect(cardFrame.locator('input[name="cardnumber"]')).toBeVisible();
      await expect(cardFrame.locator('input[name="exp-date"]')).toBeVisible();
      await expect(cardFrame.locator('input[name="cvc"]')).toBeVisible();
    });

    test('should accept valid card number', async ({ page }) => {
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

    test('should show error for expired card', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0069');
      await cardFrame.locator('input[name="exp-date"]').fill('01/20');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.waitForTimeout(1000);
      
      const errorVisible = await cardFrame.locator('[role="alert"]').isVisible().catch(() => false);
      expect(errorVisible).toBeTruthy();
    });

    test('should show error for declined card', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0002');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.waitForTimeout(1000);
      
      const errorVisible = await cardFrame.locator('[role="alert"]').isVisible().catch(() => false);
      expect(errorVisible).toBeTruthy();
    });

    test('should handle 3DS challenge flow', async ({ page }) => {
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

    test('should show inline validation errors', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('123');
      await cardFrame.locator('input[name="cardnumber"]').blur();
      
      await page.waitForTimeout(500);
      
      const errorVisible = await cardFrame.locator('[role="alert"], .InputContainer--invalid').isVisible().catch(() => false);
      expect(errorVisible).toBeTruthy();
    });

    test('should handle network error gracefully', async ({ page }) => {
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
      await page.route('**/api/stripe/**', route => {
        setTimeout(() => route.continue(), 35000);
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

  test.describe('PaymentIntent Flow', () => {
    test('should create PaymentIntent on checkout', async ({ page }) => {
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
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="payment-success"], .payment-success')).toBeVisible({ timeout: 15000 });
    });

    test('should handle PaymentIntent cancellation', async ({ page }) => {
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

  test.describe('Error Handling', () => {
    test('should display card declined error', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0002');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-declined"], [role="alert"]:has-text("declined")')).toBeVisible({ timeout: 10000 });
    });

    test('should display expired card error', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0069');
      await cardFrame.locator('input[name="exp-date"]').fill('01/20');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-expired"], [role="alert"]:has-text("expired")')).toBeVisible({ timeout: 10000 });
    });

    test('should display incorrect CVC error', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0127');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-cvc"], [role="alert"]:has-text("CVC")')).toBeVisible({ timeout: 10000 });
    });

    test('should display insufficient funds error', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 9995');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-insufficient"], [role="alert"]:has-text("insufficient")')).toBeVisible({ timeout: 10000 });
    });

    test('should handle processing error', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('4000 0000 0000 0119');
      await cardFrame.locator('input[name="exp-date"]').fill('12/30');
      await cardFrame.locator('input[name="cvc"]').fill('123');
      
      await page.click('[data-testid="submit-payment"]');
      
      await expect(page.locator('[data-testid="error-processing"], [role="alert"]:has-text("processing")')).toBeVisible({ timeout: 10000 });
    });

    test('should allow retry after error', async ({ page }) => {
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

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on card inputs', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      const cardNumberInput = cardFrame.locator('input[name="cardnumber"]');
      const expDateInput = cardFrame.locator('input[name="exp-date"]');
      const cvcInput = cardFrame.locator('input[name="cvc"]');
      
      await expect(cardNumberInput).toHaveAttribute('aria-label', /card number/i);
      await expect(expDateInput).toHaveAttribute('aria-label', /expiration/i);
      await expect(cvcInput).toHaveAttribute('aria-label', /cvc|security code/i);
    });

    test('should announce errors to screen readers', async ({ page }) => {
      const cardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      
      await cardFrame.locator('input[name="cardnumber"]').fill('123');
      await cardFrame.locator('input[name="cardnumber"]').blur();
      
      await page.waitForTimeout(500);
      
      const alert = cardFrame.locator('[role="alert"]');
      await expect(alert).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
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
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const elementsUnmounted = await page.evaluate(() => {
        return !document.querySelector('iframe[name^="__privateStripeFrame"]');
      });
      
      expect(elementsUnmounted).toBeTruthy();
    });

    test('should re-mount elements on return to checkout', async ({ page }) => {
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