const { test, expect } = require('playwright/test');
const path = require('path');

test.use({ navigationTimeout: 30000, actionTimeout: 15000 });

test('export kindoo users to CSV', async ({ page }) => {
  test.setTimeout(60000);
  const email = process.env.KINDOO_EMAIL;
  const username = process.env.KINDOO_USERNAME;
  const password = process.env.KINDOO_PASSWORD;

  if (!email || !username || !password) {
    throw new Error('Set KINDOO_EMAIL, KINDOO_USERNAME, and KINDOO_PASSWORD environment variables');
  }

  await page.goto('https://web.kindoo.tech/');

  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByText('Next').click();

  await page.getByRole('textbox', { name: 'Sign in to your church' }).fill(username);
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Verify' }).click();

  await page.waitForURL('**/web.kindoo.tech/**', { timeout: 30000 });
  await page.getByText('Riverton Utah Copperview Stake').click();

  await page.locator('div').filter({ hasText: /^Users\d+\/\d+$/ }).nth(1).click();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('div').filter({ hasText: /^Export to CSV$/ }).nth(1).click();
  const download = await downloadPromise;

  const savePath = path.join(__dirname, '..', 'output', 'kindoo-users.csv');
  await download.saveAs(savePath);

  // Export access rights CSV
  await page.goto('https://web.kindoo.tech/');
  await page.getByText('Riverton Utah Copperview Stake').click();
  await page.getByText('View all access rights').click();
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Export' }).click();

  const accessDownloadPromise = page.waitForEvent('download');
  await page.getByText('Download as CSV').click();
  const accessDownload = await accessDownloadPromise;

  const accessSavePath = path.join(__dirname, '..', 'output', 'kindoo-access-rights.csv');
  await accessDownload.saveAs(accessSavePath);
});
