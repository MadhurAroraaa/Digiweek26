import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  webServer: {
    command: 'node ./node_modules/next/dist/bin/next start -p 3199',
    url: 'http://127.0.0.1:3199',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3199',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'], channel: 'chrome', viewport: { width: 390, height: 844 } } },
  ],
});
