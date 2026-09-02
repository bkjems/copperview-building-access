const { test, expect } = require('playwright/test');

// This test submits to the real Apps Script endpoint and sends a real email.
// 8th Ward + Stake Center routes to the owner, not to another building manager.
// Run manually when you want to verify the email arrives:
//   RUN_REAL=1 npx playwright test tests/submit-real.spec.js --headed

test('submit to real endpoint and verify email manually', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#ward', '8th Ward');
  // Required, and no longer auto-selected from the ward (see commit 2613a11).
  // Without it checkValidity() fails and the form never submits.
  await page.selectOption('#building', 'Stake Center');
  await page.selectOption('#request', 'building_access');
  await page.fill('#name', 'Playwright Test');
  await page.fill('#email', 'test@example.com');
  await page.fill('#accessInfo', 'Tomorrow 8:00 AM - 10:00 PM\nPlaywright real submission test');

  await page.click('.submit-btn');

  await expect(page.locator('#message')).toHaveText('Request submitted successfully!', { timeout: 30000 });

  // Keep browser open so you can see the result
  await page.waitForTimeout(5000);
});
