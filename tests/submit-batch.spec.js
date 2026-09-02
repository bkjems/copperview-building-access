const { test, expect } = require('playwright/test');

function parseRow(row) {
  const parts = row.split(',').map(s => s.trim());
  if (parts.length !== 7) {
    throw new Error(`Expected 7 fields, got ${parts.length}: "${row}"`);
  }
  const [email, description, startDateRaw, startTime, endDateRaw, endTime, building] = parts;

  const [startMonth, startDay, startYear] = startDateRaw.split('/');
  const [endMonth, endDay, endYear] = endDateRaw.split('/');

  const startMatch = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const endMatch = endTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!startMatch || !endMatch) {
    throw new Error(`Invalid time format in: "${row}"`);
  }

  const accessRuleMap = {
    '2700 Building': 'Access 2700 building',
    '3200 Building': 'Access 3200 building',
    'Stake Center': 'Access Stake Center',
  };

  return {
    email,
    description,
    startMonth, startDay, startYear,
    startHour: startMatch[1], startMinute: startMatch[2], startMeridiem: startMatch[3].toUpperCase(),
    endMonth, endDay, endYear,
    endHour: endMatch[1], endMinute: endMatch[2], endMeridiem: endMatch[3].toUpperCase(),
    building,
    accessRule: accessRuleMap[building] || `Access ${building}`,
  };
}

const raw = process.env.BATCH;
if (!raw) {
  test('batch input required', () => {
    throw new Error('Set BATCH environment variable with the submission string');
  });
} else {
  const r = parseRow(raw);

  test.use({ navigationTimeout: 30000, actionTimeout: 15000 });

  test(`submit to kindoo: ${r.description}`, async ({ page }) => {
    test.setTimeout(90000);

    const email = process.env.KINDOO_EMAIL;
    const username = process.env.KINDOO_USERNAME;
    const password = process.env.KINDOO_PASSWORD;
    if (!email || !username || !password) {
      throw new Error('Set KINDOO_EMAIL, KINDOO_USERNAME, and KINDOO_PASSWORD environment variables');
    }

    // Login
    await page.goto('https://web.kindoo.tech/');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByText('Next').click();
    await page.getByRole('textbox', { name: 'Sign in to your church' }).fill(username);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Verify' }).click();

    // Navigate to stake
    await page.waitForURL('**/web.kindoo.tech/**', { timeout: 30000 });
    await page.getByText('Riverton Utah Copperview Stake').click();

    // Add user
    await page.getByText('Users').click();
    await page.getByText('Add Users').click();
    await page.locator('div').filter({ hasText: /^Add a single user$/ }).first().click();

    // Fill email
    await page.getByRole('textbox', { name: 'Email of the new user' }).fill(r.email);

    // Enable temporary user
    await page.getByRole('switch').nth(1).check();

    async function fillSpin(locator, value) {
      await locator.click();
      await page.keyboard.type(value, { delay: 50 });
    }

    // Start date ("Rights activated starting:")
    await fillSpin(page.getByRole('spinbutton', { name: 'Month' }).first(), r.startMonth);
    await fillSpin(page.getByRole('spinbutton', { name: 'Day' }).first(), r.startDay);
    await fillSpin(page.getByRole('spinbutton', { name: 'Year' }).first(), r.startYear);

    // Start time
    await fillSpin(page.getByRole('spinbutton', { name: 'Hours' }).first(), r.startHour);
    await fillSpin(page.getByRole('spinbutton', { name: 'Minutes' }).first(), r.startMinute);
    await fillSpin(page.getByRole('spinbutton', { name: 'Meridiem' }).first(), r.startMeridiem);

    // End date ("User expiry date and time")
    await fillSpin(page.getByRole('spinbutton', { name: 'Month' }).nth(1), r.endMonth);
    await fillSpin(page.getByRole('spinbutton', { name: 'Day' }).nth(1), r.endDay);
    await fillSpin(page.getByRole('spinbutton', { name: 'Year' }).nth(1), r.endYear);

    // End time
    await fillSpin(page.getByRole('spinbutton', { name: 'Hours' }).nth(1), r.endHour);
    await fillSpin(page.getByRole('spinbutton', { name: 'Minutes' }).nth(1), r.endMinute);
    await fillSpin(page.getByRole('spinbutton', { name: 'Meridiem' }).nth(1), r.endMeridiem);

    // Description
    await page.getByRole('textbox', { name: 'Description' }).fill(r.description);

    // Save user
    const saveBtn = page.locator('div').filter({ hasText: /^SAVE$/ }).nth(1);
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    // Existing user: "Yes" prompt. New user: "Confirm" invite prompt first, then "Yes".
    const confirmBtn = page.getByText('Confirm');
    const yesBtn = page.getByText('Yes');
    try {
      await confirmBtn.click({ timeout: 3000 });
    } catch {
      // No invite prompt — existing user
    }
    await yesBtn.click();

    // Assign access rule
    await page.locator('div').filter({ hasText: /^Access rule$/ }).first().click();
    await page.locator('div').filter({ hasText: /^Next$/ }).nth(1).click();

    // Select the correct building access rule by name
    await page.getByText(r.accessRule, { exact: true }).locator('..').getByRole('switch').check();

    // Final save
    await page.locator('div').filter({ hasText: /^SAVE$/ }).nth(4).click();
  });
}
