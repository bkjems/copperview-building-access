const { test, expect } = require('playwright/test');

// This test submits to the real Apps Script endpoint.
// Run manually when you want to verify the email arrives:
//   npx playwright test tests/submit-real.spec.js --headed

test('submit to real endpoint and verify email manually', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#ward', '8th Ward');
  await page.selectOption('#request', 'building_access');
  await page.fill('#name', 'Playwright Test');
  await page.fill('#email', 'test@example.com');
  await page.fill('#accessInfo', 'Tomorrow 8:00 AM - 10:00 PM\nPlaywright real submission test');

  await page.click('.submit-btn');

  await expect(page.locator('#message')).toHaveText('Request submitted successfully!', { timeout: 30000 });

  // Keep browser open so you can see the result
  await page.waitForTimeout(5000);
});
