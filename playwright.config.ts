import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

const storageState = fs.existsSync('e2e/storageState.json') ? 'e2e/storageState.json' : undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    storageState,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    ...(process.env.CI ? [] : [{
      name: 'screen-reader',
      use: { 
        ...devices['Desktop Chrome'],
        headless: false,
        viewport: { width: 1280, height: 720 },
      },
      workers: 1,
    }]),
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 300000,
  },
});