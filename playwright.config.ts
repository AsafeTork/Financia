import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 15000,
  expect: { timeout: 8000 },
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    storageState,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 300000,
  },
});