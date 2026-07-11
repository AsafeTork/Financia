---
type: REFERENCE
---

# Testing Strategy Research — Financia (React + Vite + Vitest + Playwright)

---

## 1. Playwright E2E vs Vitest + jsdom

**What it tests:** Multi-page user flows in a real browser (Chromium, Firefox, WebKit). Vitest + jsdom tests isolated logic and component rendering in a simulated DOM.

**What Playwright catches that jsdom cannot:**
- Real CSS layout, computed styles, `getComputedStyle()`
- Canvas rendering, Web Components lifecycle
- Real focus management, pointer events, scroll, animations
- Cross-page navigation (login → dashboard → settings)
- Network conditions, service workers, offline behavior
- Browser-specific rendering differences

**Rule of thumb:**
- Pure logic → **Vitest**
- Component + API call → **Vitest + MSW**
- Login → dashboard → checkout flow → **Playwright**

**Pattern:**
```ts
// Vitest: unit/integration
test('formatCurrency formats BRL correctly', () => {
  expect(formatCurrency(1500, 'BRL')).toBe('R$ 15,00');
});

// Playwright: E2E
test('user completes purchase flow', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Compra realizada')).toBeVisible();
});
```

**Tool:** `@playwright/test` + Vitest (complementary, not competing)

---

## 2. Visual Regression Testing

**How it works:** Captures a screenshot of the rendered page/component and compares it pixel-by-pixel against a stored baseline. Any diff above a threshold fails the test.

**What it catches:**
- CSS regressions (padding, margin, color changes)
- Missing/broken images
- Layout shifts across breakpoints
- Unintended side effects of component changes

**Three approaches:**

| Tool | Cost | Review Workflow | Cross-browser | Best for |
|------|------|----------------|---------------|----------|
| Playwright `toHaveScreenshot()` | Free | Git diff of PNGs | Manual projects | Small teams, fast CI |
| Percy (BrowserStack) | Per-snapshot | Cloud dashboard | Chrome, FF, Safari | Teams needing cross-browser |
| Chromatic (Storybook) | Per-snapshot | Web UI with pixel overlay | Chrome only | Design systems, Storybook users |

**Pattern (Playwright native):**
```ts
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: { maxDiffPixels: 100 },
  },
});

// test
test('dashboard matches baseline', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot({ fullPage: true });
});
```

**Best practice:** Run in Docker (same OS/browser every time), disable animations, mock dynamic data, never auto-update baselines in CI.

---

## 3. Console Error Monitoring in Tests

**What it tests:** Asserts that no `console.error()`, `console.warn()`, or unhandled page errors occur during a test.

**Why it matters:** A financial app cannot silently swallow errors. Catches React render errors, failed API calls, missing resources, deprecation warnings.

**Pattern — auto-fail fixture:**
```ts
// fixtures/console.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  failOnConsoleError: [async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await use();

    if (errors.length > 0) {
      testInfo.annotations.push({ type: 'console-errors', description: errors.join('\n') });
      throw new Error(`Console errors:\n${errors.join('\n')}`);
    }
  }, { auto: true }],
});
```

**Pattern — ad-hoc:**
```ts
test('no console errors on transaction page', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/transactions');
  expect(errors, `Errors: ${errors.join(', ')}`).toHaveLength(0);
});
```

**Tool:** Built into Playwright via `page.on('console')` + custom fixture

---

## 4. Network Request Monitoring and Mocking

**What it tests:** Intercepting, mocking, and asserting on HTTP/HTTPS requests made by the page.

**Why it matters:** Makes tests deterministic (no dependency on live backend), enables error-state coverage (500, timeout, malformed response), blocks third-party noise (analytics, ads).

**Playwright primitives:**
- `page.route()` — intercept requests
- `route.fulfill()` — return synthetic response
- `route.abort()` — kill request (simulate offline)
- `route.continue()` — let through (optionally modified)
- `route.fetch()` — perform real request, then mutate
- `routeFromHAR()` — replay recorded traffic
- `waitForResponse()` / `waitForRequest()` — assert on traffic

**Pattern — mock API + assert response:**
```ts
test('transaction list shows mocked data', async ({ page }) => {
  await page.route('**/api/transactions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: '1', amount: 100, description: 'Test' }]),
    });
  });
  await page.goto('/transactions');
  await expect(page.getByText('Test')).toBeVisible();
});

test('error state on 500', async ({ page }) => {
  await page.route('**/api/transactions', async route => {
    await route.fulfill({ status: 500, body: 'Server Error' });
  });
  await page.goto('/transactions');
  await expect(page.getByTestId('error-banner')).toBeVisible();
});
```

**Pattern — GraphQL selective mock:**
```ts
await page.route('**/graphql', async route => {
  const { operationName } = JSON.parse(route.request().postData()!);
  if (operationName === 'GetTransactions') {
    return route.fulfill({ json: { data: { transactions: [] } } });
  }
  return route.continue(); // pass through others
});
```

**Tool:** Built into Playwright (`page.route()`, `waitForResponse`)

---

## 5. Lighthouse CI for Performance Budgets

**What it tests:** Automated Lighthouse audits in CI that fail the build when performance budgets are breached.

**Why it matters:** Prevents performance regressions from reaching production. For a financial app, slow load times = lost transactions + user trust erosion.

**Setup:**
```bash
npm install --save-dev @lhci/cli
```

**Config (`lighthouserc.js`):**
```js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173/', 'http://localhost:5173/dashboard'],
      numberOfRuns: 3,
      settings: { preset: 'desktop' },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 200000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 800000 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

**GitHub Actions:**
```yaml
- run: npm ci && npm run build
- run: npx lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

**Tool:** `@lhci/cli` (Lighthouse CI)

---

## 6. Web Vitals Measurement (CLS, LCP, FID/INP)

**What it tests:** Programmatic capture of Core Web Vitals inside Playwright tests using `PerformanceObserver`.

**Why it matters:** Directly measures user-perceived performance. LCP < 2.5s, CLS < 0.1, INP < 200ms are Google's "good" thresholds and impact SEO + user experience.

**Pattern:**
```ts
test('Core Web Vitals within thresholds', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      (window as any).__vitals.lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
      let cls = 0;
      for (const e of list.getEntries() as any[]) {
        if (!e.hadRecentInput) cls += e.value;
      }
      (window as any).__vitals.cls = cls;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const v = await page.evaluate(() => (window as any).__vitals);
  expect(v.lcp).toBeLessThan(2500);
  expect(v.cls).toBeLessThan(0.1);
});
```

**Alternative:** Use the `playwright-performance-metrics` npm package for a higher-level API with network presets.

**Tool:** Built-in `PerformanceObserver` API or `playwright-performance-metrics` package

---

## 7. Accessibility Testing (axe-core + Playwright)

**What it tests:** Automated WCAG compliance scans using Deque's axe-core engine inside Playwright.

**Why it matters:** Financial apps must be accessible (legal requirement in many jurisdictions). Catches ~30-40% of all accessibility issues automatically: missing ARIA labels, color contrast, missing alt text, landmark structure.

**Setup:**
```bash
npm install --save-dev @axe-core/playwright
```

**Pattern:**
```ts
import AxeBuilder from '@axe-core/playwright';

test('homepage has no WCAG violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

// Scoped scan (modal, form, component)
test('modal is accessible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open' }).click();
  const results = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze();
  expect(results.violations).toEqual([]);
});
```

**Fixture for reuse:**
```ts
export const test = base.extend({
  axe: async ({ page }, use) => {
    await use(async (options?: { include?: string[]; tags?: string[] }) => {
      const builder = new AxeBuilder({ page });
      if (options?.include) builder.include(options.include.join(','));
      if (options?.tags) builder.withTags(options.tags);
      return builder.analyze();
    });
  },
});
```

**Tool:** `@axe-core/playwright`

---

## 8. Keyboard Navigation Testing

**What it tests:** Tab order, focus management, Enter/Space/Escape behavior using only keyboard input (no mouse).

**Why it matters:** WCAG 2.4.3 (Focus Order) requires logical keyboard navigation. Catches focus traps, missing skip links, broken modal focus management.

**Patterns:**
```ts
test('form tab order is logical', async ({ page }) => {
  await page.goto('/signup');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Senha')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cadastrar' })).toBeFocused();
});

test('Escape closes modal and returns focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Open' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('Tab is trapped inside modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open' }).click();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const insideDialog = await page.evaluate(() =>
      document.activeElement?.closest('[role="dialog"]') !== null
    );
    expect(insideDialog).toBe(true);
  }
});
```

**Tool:** Built into Playwright (`page.keyboard.press()`), `expect(locator).toBeFocused()`

---

## 9. Screen Reader Testing

**What it tests:** Validates the accessibility tree that screen readers consume. Two approaches: ARIA snapshots (structural) and Guidepup (real NVDA/VoiceOver automation).

**ARIA snapshots (Playwright built-in):**
```ts
// Capture the accessibility tree as YAML
const snapshot = await page.locator('main').ariaSnapshot();

// Assert against stored baseline
await expect(page.locator('nav')).toMatchAriaSnapshot(`
  - navigation "Main":
    - link "Dashboard"
    - link "Transações"
    - link "Configurações"
`);

// Dynamic content with regex
await expect(page.locator('[role="alert"]')).toMatchAriaSnapshot(`
  - alert: /\\d+ transações encontradas/
`);
```

**Guidepup (real screen reader automation):**
```ts
import { voiceOver } from '@guidepup/guidepup';
import { guidepup } from '@guidepup/playwright';

test('VoiceOver reads transaction list correctly', async ({ page }) => {
  await page.goto('/');
  const { guidepup } = await guidepup(page);
  await voiceOver.interact();
  await voiceOver.next();
  expect(voiceOver.lastSpokenPhrase()).toContain('Renting');
});
```

**Tool:** Playwright `toMatchAriaSnapshot()` for structural assertions; `@guidepup/playwright` for real NVDA/VoiceOver automation

---

## 10. Mobile/Responsive Testing

**What it tests:** Emulates mobile viewports, touch events, gestures, device pixel ratio, safe areas.

**Why it matters:** Over 60% of web traffic is mobile. A financial app must work on small screens with touch input.

**Device emulation config:**
```ts
// playwright.config.ts
import { devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
    { name: 'tablet', use: { ...devices['iPad Pro 11'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**Touch and gesture patterns:**
```ts
test.use({ ...devices['iPhone 15'] });

test('touch target minimum size', async ({ page }) => {
  await page.goto('/');
  const buttons = await page.getByRole('button').all();
  for (const btn of buttons) {
    const box = await btn.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('dropdown opens on tap', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="menu-btn"]').tap();
  await expect(page.locator('[data-testid="dropdown"]')).toBeVisible();
});
```

**Tool:** Playwright built-in `devices` registry, `page.tap()`, `hasTouch` emulation

---

## 11. Offline Mode Testing

**What it tests:** Service worker cache strategy, offline fallback page, background sync queue.

**Why it matters:** A PWA financial app must work offline or show a graceful fallback. Users in areas with poor connectivity depend on this.

**Pattern:**
```ts
test('app loads from cache when offline', async ({ page, context }) => {
  // Step 1: Visit online to prime the cache
  await page.goto('/dashboard');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Step 2: Go offline
  await context.setOffline(true);
  // Step 3: Reload — should serve from cache
  await page.reload();
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expect(page.getByTestId('offline-badge')).toBeVisible();
});

test('offline fallback for uncached route', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto('/unknown-route', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('offline-fallback')).toBeVisible();
});

test('form submission queued offline, synced when online', async ({ page, context }) => {
  await page.goto('/feedback');
  await context.setOffline(true);
  await page.fill('[name="message"]', 'Test offline');
  await page.click('[data-testid="submit"]');
  await expect(page.getByTestId('offline-queue-notice')).toBeVisible();
  await context.setOffline(false);
  await page.waitForResponse(r => r.url().includes('/api/feedback') && r.status() === 200);
  await expect(page.getByTestId('submission-success')).toBeVisible();
});
```

**Tool:** Built into Playwright (`context.setOffline(true)`)

---

## 12. PWA Testing

**What it tests:** Manifest validity, service worker registration, beforeinstallprompt event, installability criteria.

**Why it matters:** If the PWA manifest is broken or the SW fails to register, the app is not installable — users lose offline capabilities.

**Patterns:**
```ts
test('manifest is valid', async ({ page }) => {
  await page.goto('/');
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
  const response = await page.request.get(manifestUrl!);
  const manifest = await response.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons).toHaveLength(2); // 192 + 512
});

test('service worker registers and activates', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const activated = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.state === 'activated';
  });
  expect(activated).toBe(true);
});

test('beforeinstallprompt event fires', async ({ page }) => {
  let prompted = false;
  await page.addInitScript(() => {
    window.addEventListener('beforeinstallprompt', () => {
      (window as any).__installable = true;
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__installable === true);
  expect(await page.evaluate(() => (window as any).__installable)).toBe(true);
});
```

**Tool:** Built into Playwright (`page.evaluate` for SW/manifest, `addInitScript` for beforeinstallprompt)

---

## 13. Memory Leak Detection

**What it tests:** Measures JavaScript heap growth over repeated actions to detect leaked DOM nodes, event listeners, and closures.

**Why it matters:** A SPA financial app that runs for hours must not accumulate memory. Leaks cause slowdowns, crashes, and data loss.

**Pattern:**
```ts
test('no memory leak on repeated navigation', async ({ page }) => {
  const measure = () => page.evaluate(() =>
    (performance as any).memory?.usedJSHeapSize
  );

  await page.goto('/');
  const before = await measure();
  const THRESHOLD = 5 * 1024 * 1024; // 5MB

  for (let i = 0; i < 20; i++) {
    await page.getByRole('link', { name: 'Transações' }).click();
    await page.waitForURL('/transactions');
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('/dashboard');
  }

  await page.requestGC();
  const after = await measure();
  expect(after - before).toBeLessThan(THRESHOLD);
});

// Fixture to auto-close extra pages
export const test = base.extend({
  pages: [async ({ browser }, use) => {
    const created: Page[] = [];
    const origNewPage = browser.newPage.bind(browser);
    browser.newPage = async () => {
      const p = await origNewPage();
      created.push(p);
      return p;
    };
    await use();
    await Promise.all(created.filter(p => !p.isClosed()).map(p => p.close()));
  }, { auto: true }],
});
```

**Tool:** `page.requestGC()` (Chromium), `performance.memory.usedJSHeapSize`, or `playwright-pageman` for automatic page cleanup

---

## 14. Stress/Load Testing for PWA

**What it tests:** Simulates rapid clicks, many transactions, and long-running sessions to find client-side bottlenecks.

**Why it matters:** API load tests miss frontend bottlenecks (JS parse time, DOM rendering, memory). Playwright stress tests catch these.

**Patterns:**
```ts
// Rapid click / double-submit
test('rapid double-click does not create duplicate transactions', async ({ page }) => {
  let apiCalls = 0;
  await page.route('**/api/transactions', async route => {
    apiCalls++;
    await new Promise(r => setTimeout(r, 2000)); // slow response
    await route.fulfill({ status: 201, body: JSON.stringify({ id: `tx-${apiCalls}` }) });
  });
  await page.goto('/transactions/new');
  await page.fill('#amount', '100');
  const btn = page.getByRole('button', { name: 'Salvar' });
  await btn.click({ clickCount: 3 }); // triple click
  await page.waitForTimeout(3000);
  expect(apiCalls).toBe(1); // debounce must prevent duplicates
});

// Concurrent browser sessions (using Artillery + Playwright)
// npx artillery run --config artillery.yml
```

**For high-scale load testing:** Combine Playwright with **Artillery** (`artillery-plugin-playwright`) which runs Playwright scripts at scale (hundreds of concurrent virtual users).

**Tool:** Playwright for browser-level stress; Artillery + Playwright plugin for large-scale load testing

---

## 15. Multi-Tab / Multi-Window Testing

**What it tests:** IndexedDB sync across tabs, BroadcastChannel communication, real-time updates, OAuth popup flows.

**Why it matters:** A financial PWA with Dexie/IndexedDB sync must correctly propagate changes across tabs. Race conditions here cause data loss.

**Key insight:** Same `BrowserContext` = shared IndexedDB/localStorage/BroadcastChannel. Different `BrowserContext` = fully isolated.

**Patterns:**
```ts
test('transaction created in tab A appears in tab B', async ({ context }) => {
  const tabA = await context.newPage();
  const tabB = await context.newPage();
  await tabA.goto('/');
  await tabB.goto('/');

  await tabA.getByRole('button', { name: 'Nova Transação' }).click();
  await tabA.fill('#description', 'Aluguel');
  await tabA.fill('#amount', '1500');
  await tabA.getByRole('button', { name: 'Salvar' }).click();

  // tab B should see the update (via BroadcastChannel or polling)
  await expect(tabB.getByText('Aluguel')).toBeVisible({ timeout: 5000 });
});

test('two isolated users do not share data', async ({ browser }) => {
  const userA = await browser.newContext({ storageState: 'auth/userA.json' });
  const userB = await browser.newContext({ storageState: 'auth/userB.json' });
  const pageA = await userA.newPage();
  const pageB = await userB.newPage();
  // ... assert isolation
  await userA.close();
  await userB.close();
});
```

**Tool:** Built into Playwright (`context.newPage()`, `browser.newContext()`, `context.pages()`)

---

## 16. Multi-Click / Race Condition Testing

**What it tests:** Double-submit prevention, debounced inputs, optimistic update conflicts, concurrent API calls.

**Why it matters:** Financial transactions must be idempotent. A double-click or race condition can create duplicate charges.

**Patterns:**
```ts
test('submit button is disabled while request is pending', async ({ page }) => {
  await page.route('**/api/payments', async route => {
    await new Promise(r => setTimeout(r, 3000));
    await route.fulfill({ status: 200, body: JSON.stringify({ id: 'pay-1' }) });
  });
  await page.goto('/pay');
  const btn = page.getByRole('button', { name: 'Pagar' });
  await btn.click();
  await expect(btn).toBeDisabled();
  await expect(btn).toHaveAttribute('aria-busy', 'true');
  const apiCalls = await page.evaluate(() => (window as any).__apiCallCount || 0);
  expect(apiCalls).toBeLessThanOrEqual(1);
});

test('debounced search fires only one request after typing stops', async ({ page }) => {
  let callCount = 0;
  await page.route('**/api/search**', async route => {
    callCount++;
    await route.fulfill({ json: { results: [] } });
  });
  await page.goto('/search');
  await page.getByPlaceholder('Buscar').pressSequentially('receita federal', { delay: 50 });
  await page.waitForTimeout(1000);
  expect(callCount).toBeLessThanOrEqual(3); // not 14 (one per keystroke)
});
```

**Tool:** Built into Playwright (`page.route` + `Promise.all` for concurrency control)

---

## 17. Security Testing Basics

**What it tests:** XSS, CSRF, SQL injection, security headers, RBAC, session isolation, cookie flags.

**Why it matters:** A financial app is a high-value target. Automated security regression tests catch regressions before they ship.

**Patterns:**
```ts
// XSS — verify payloads are escaped, not executed
test('XSS payloads are sanitized', async ({ page }) => {
  const payloads = ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>'];
  for (const p of payloads) {
    await page.goto('/feedback');
    await page.fill('textarea', p);
    await page.getByRole('button', { name: 'Enviar' }).click();
    const content = await page.locator('.comment').last().textContent();
    expect(content).not.toContain('<script>');
    expect(content).not.toContain('onerror');
  }
});

// Security headers
test('security headers are present', async ({ page }) => {
  const response = await page.goto('/');
  const headers = response!.headers();
  expect(headers['content-security-policy']).toBeTruthy();
  expect(headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['strict-transport-security']).toBeTruthy();
});

// RBAC — low-privilege user cannot access admin
test('regular user cannot access admin endpoint', async ({ page, request }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Senha').fill('password');
  await page.getByRole('button', { name: 'Entrar' }).click();
  const response = await request.get('/api/admin/users');
  expect(response.status()).toBe(403);
});

// Session isolation
test('user A cannot access user B data via IDOR', async ({ browser }) => {
  const userA = await browser.newContext({ storageState: 'auth/userA.json' });
  const userB = await browser.newContext({ storageState: 'auth/userB.json' });
  const pageA = await userA.newPage();
  await pageA.goto('/api/transactions/user-b-id'); // IDOR attempt
  const status = await pageA.evaluate(async () => {
    const res = await fetch('/api/transactions/some-other-user-id');
    return res.status;
  });
  expect(status).toBe(403); // must reject
  await userA.close();
  await userB.close();
});
```

**Tool:** Built into Playwright + `@axe-core/playwright`; pair with **OWASP ZAP** for DAST scanning

---

## 18. QA Test Suite Structure for Financial PWA (Dexie + Supabase)

```text
tests/
├── unit/                          # Vitest — fast, pure logic
│   ├── utils/
│   │   ├── formatCurrency.test.ts
│   │   └── validateCPF.test.ts
│   ├── stores/
│   │   └── transactionStore.test.ts   # Dexie operations mocked
│   └── hooks/
│       └── useTransactions.test.ts
│
├── integration/                   # Vitest + MSW — component + API
│   ├── components/
│   │   ├── TransactionForm.test.tsx
│   │   └── BalanceChart.test.tsx
│   └── pages/
│       ├── Dashboard.test.tsx
│       └── Login.test.tsx
│
├── e2e/                           # Playwright — critical user flows
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── logout.spec.ts
│   │   └── password-reset.spec.ts
│   ├── transactions/
│   │   ├── create.spec.ts
│   │   ├── edit.spec.ts
│   │   ├── delete.spec.ts
│   │   └── list.spec.ts
│   ├── goals/
│   │   └── savings-goal.spec.ts
│   └── onboarding/
│       └── wizard.spec.ts
│
├── pwa/                           # Playwright — PWA-specific
│   ├── offline.spec.ts
│   ├── service-worker.spec.ts
│   ├── manifest.spec.ts
│   └── install-prompt.spec.ts
│
├── visual/                        # Playwright — visual regression
│   ├── homepage.spec.ts
│   ├── dashboard.spec.ts
│   └── transaction-form.spec.ts
│
├── performance/                   # Playwright + LHCI
│   ├── web-vitals.spec.ts
│   └── lighthouse-budget.spec.ts
│
├── security/                      # Playwright — security regression
│   ├── xss.spec.ts
│   ├── csrf.spec.ts
│   ├── rbac.spec.ts
│   ├── session-isolation.spec.ts
│   └── headers.spec.ts
│
├── accessibility/                 # Playwright + axe-core
│   ├── homepage.a11y.spec.ts
│   ├── dashboard.a11y.spec.ts
│   └── forms.a11y.spec.ts
│
├── mobile/                        # Playwright — device emulation
│   ├── responsive-layout.spec.ts
│   └── touch-interactions.spec.ts
│
├── race-conditions/               # Playwright — concurrency
│   ├── double-submit.spec.ts
│   ├── multi-tab-sync.spec.ts
│   └── debounce.spec.ts
│
├── fixtures/                      # Shared test helpers
│   ├── auth.ts
│   ├── console.ts
│   ├── network.ts
│   └── performance.ts
│
└── setup/
    ├── global-setup.ts            # Login once, save storageState
    └── db-seed.ts                 # Seed Supabase test data
```

**CI Pipeline:**
```yaml
# Run order
1. npm run lint               # Static analysis
2. npm test -- --run           # Vitest unit + integration (fast)
3. npx playwright test e2e/   # Critical flows
4. npx playwright test pwa/ visual/ mobile/  # Visual + PWA
5. npx playwright test security/ accessibility/  # Security + a11y
6. npx lhci autorun           # Lighthouse budgets (slowest, run nightly or on main)
```

**Key principles:**
- 40% unit, 35% integration, 25% E2E (shift toward integration boundaries)
- Run Vitest on every push (seconds)
- Run Playwright E2E on PR merge to main (minutes)
- Run performance + Lighthouse nightly or on release branches
- Run security + a11y as blocking gates on every PR that touches relevant files
- Use path filters in CI to run only affected test categories
