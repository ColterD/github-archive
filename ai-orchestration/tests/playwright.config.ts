import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Mimir AI Orchestration Stack
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './specs',
  
  /* Maximum time one test can run */
  timeout: 30 * 1000,
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: '../test-results/html' }],
    ['json', { outputFile: '../test-results/results.json' }],
    ['junit', { outputFile: '../test-results/junit.xml' }]
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
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
  ],

  /* Web server configuration for local services */
  webServer: [
    {
      command: 'echo "Neo4j Browser available at http://localhost:7474"',
      port: 7474,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'echo "Mimir MCP available at http://localhost:9042"',
      port: 9042,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    }
  ],
});
