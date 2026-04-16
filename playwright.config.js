const { defineConfig } = require('playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testIgnore: process.env.RUN_REAL ? [] : ['**/submit-real.spec.js'],
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'npx serve -l 3000 -s .',
    port: 3000,
    reuseExistingServer: true,
  },
});
