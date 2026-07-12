import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the app and handle any auth/login if needed
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Save storage state for authenticated tests
  await context.storageState({ path: 'e2e/auth-state.json' });
  await browser.close();
}

export default globalSetup;