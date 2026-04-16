const { test, expect } = require('playwright/test');

// This test submits to the real Apps Script endpoint.
// Run manually when you want to verify the email arrives:
//   npx playwright test tests/submit-real.spec.js --headed

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

test('submit to real endpoint and verify email manually', async ({ page }) => {
  await page.goto('/');

  const date = tomorrow();
  await page.selectOption('#ward', '8th Ward');
  await page.fill('#name', 'Playwright Test');
  await page.fill('#email', 'test@example.com');
  await page.fill('#startDate', date);
  await page.locator('#startDate').dispatchEvent('blur');
  await page.selectOption('#startTime', '8:00 AM');
  await page.fill('#endDate', date);
  await page.locator('#endDate').dispatchEvent('blur');
  await page.selectOption('#endTime', '10:00 PM');
  await page.fill('#purpose', 'Playwright real submission test');

  await page.click('.submit-btn');

  await expect(page.locator('#message')).toHaveText('Request submitted successfully!', { timeout: 30000 });

  // Keep browser open so you can see the result
  await page.waitForTimeout(5000);
});
