require('dotenv').config();
const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

function waitForEnter(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, () => { rl.close(); resolve(); });
  });
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx]; });
    rows.push(row);
  }
  return rows;
}

(async () => {
  const csvFile = path.join(__dirname, 'users.csv');
  const users = parseCSV(csvFile);
  console.log('Found ' + users.length + ' users to add.');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://web.kindoo.tech/');

  // Login - Step 1: Email
  await page.getByPlaceholder('Email').fill(process.env.KINDOO_EMAIL);
  await page.waitForTimeout(500);
  await page.getByText('Next').click();
  await page.waitForTimeout(2000);

  // Login - Step 2: Username (LDS church sign-in)
  await page.getByLabel('Username').fill(process.env.KINDOO_USERNAME);
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(2000);

  // Login - Step 3: Password
  await page.locator('#password-input').fill(process.env.KINDOO_PASSWORD);
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForTimeout(3000);

  // Click Riverton Utah Copperview Stake
  await page.getByText('Riverton Utah Copperview Stake').click();
  await page.waitForTimeout(2000);

  // Click Users
  await page.getByText('Users').click();
  await page.waitForTimeout(2000);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log('Adding user ' + (i + 1) + '/' + users.length + ': ' + user.email);

    // Click Add Users
    await page.getByText('Add Users').click();
    await page.waitForTimeout(2000);

    // Click Add a single user
    await page.getByText('Add a single user').click();
    await page.waitForTimeout(2000);

    // Fill email
    await page.getByPlaceholder('Email of the new user').fill(user.email);
    await page.waitForTimeout(1000);

    // Scroll down to reveal Temporary user toggle
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);

    // Toggle Temporary user - use checkbox input with force click
    await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
    await page.waitForTimeout(1000);

    // Scroll down more to reveal date fields
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);

    // MUI date/time pickers - click the container div, then type
    const dateTimeSections = page.locator('div[role="group"]');

    // Fill Rights activated starting date (first date picker)
    await dateTimeSections.nth(0).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+a');
    await page.keyboard.type(user.startDate);
    await page.waitForTimeout(500);

    // Fill Rights activated starting time (second picker)
    await dateTimeSections.nth(1).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+a');
    await page.keyboard.type(user.startTime);
    await page.waitForTimeout(500);

    // Fill User expiry date (third picker)
    await dateTimeSections.nth(2).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+a');
    await page.keyboard.type(user.endDate);
    await page.waitForTimeout(500);

    // Fill User expiry time (fourth picker)
    await dateTimeSections.nth(3).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+a');
    await page.keyboard.type(user.endTime);
    await page.waitForTimeout(500);

    // Fill description
    await page.getByPlaceholder('Description').fill(user.description);
    await page.waitForTimeout(500);

    // Click SAVE
    await page.getByText('SAVE').first().click();
    await page.waitForTimeout(2000);

    // Handle possible "not a Kindoo user" Confirm dialog
    const confirmBtn = page.getByText('Confirm', { exact: true });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }

    // Click Yes on User invitation dialog
    await page.getByText('Yes', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Click ACCESS RULE
    await page.getByText('Access rule', { exact: true }).click();
    await page.waitForTimeout(1000);

    // Click Next
    await page.getByText('Next').click();
    await page.waitForTimeout(2000);

    // Toggle the correct building based on CSV
    const buildingMap = {
      '2700 Building': 'Access 2700 building',
      '3200 Building': 'Access 3200 building',
      'Stake Center': 'Access Stake Center'
    };
    const toggleLabel = buildingMap[user.building];
    if (toggleLabel) {
      await page.getByText(toggleLabel).first().click();
      await page.waitForTimeout(1000);
    }

    // Click SAVE on access rule page (use last visible one)
    await page.getByText('SAVE').last().click();
    await page.waitForTimeout(3000);

    console.log('User ' + user.email + ' saved.');
  }

  await waitForEnter('All done. Press Enter to close the browser...');
  await browser.close();
})();
