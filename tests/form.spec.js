const { test, expect } = require('playwright/test');

// Helper: fill the building_access form with valid data
async function fillValidForm(page) {
  await page.selectOption('#ward', '8th Ward');
  await page.selectOption('#building', 'Stake Center');
  await page.selectOption('#request', 'building_access');
  await page.fill('#name', 'John Test');
  await page.fill('#email', 'test@example.com');
  await page.fill('#accessInfo', 'Tomorrow 8am - 10pm\nFamily Party');
}

test.describe('Form filling and auto-select', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page title and header are set from config', async ({ page }) => {
    await expect(page).toHaveTitle('Copperview Stake — Temporary Building Access');
    await expect(page.locator('#stakeName')).toHaveText('Copperview Stake');
  });

  test('ward dropdown has all 9 wards plus placeholder', async ({ page }) => {
    const options = page.locator('#ward option');
    await expect(options).toHaveCount(10);
    await expect(options.first()).toHaveText('-- Select Ward --');
  });

  test('selecting building_access shows name, email, and accessInfo fields', async ({ page }) => {
    await page.selectOption('#request', 'building_access');
    await expect(page.locator('#requestContent')).not.toHaveClass(/hidden/);
    await expect(page.locator('#nameEmailFields')).not.toHaveClass(/hidden/);
    await expect(page.locator('#temporaryFields')).not.toHaveClass(/hidden/);
    await expect(page.locator('#lockupFields')).toHaveClass(/hidden/);
    await expect(page.locator('#schedulerReminder')).not.toHaveClass(/hidden/);
  });

  test('selecting building_lockup shows bulkChanges and hides name/email', async ({ page }) => {
    await page.selectOption('#request', 'building_lockup');
    await expect(page.locator('#requestContent')).not.toHaveClass(/hidden/);
    await expect(page.locator('#nameEmailFields')).toHaveClass(/hidden/);
    await expect(page.locator('#temporaryFields')).toHaveClass(/hidden/);
    await expect(page.locator('#lockupFields')).not.toHaveClass(/hidden/);
    await expect(page.locator('#bulkHint')).toHaveText('Enter 1 or more: Name, Email, Date Range.');
  });

  test('selecting custom_callings shows bulkChanges with calling hint', async ({ page }) => {
    await page.selectOption('#request', 'custom_callings');
    await expect(page.locator('#requestContent')).not.toHaveClass(/hidden/);
    await expect(page.locator('#lockupFields')).not.toHaveClass(/hidden/);
    await expect(page.locator('#bulkHint')).toHaveText('Enter 1 or more: Name, Email, Calling.');
  });

  test('form can be fully filled out', async ({ page }) => {
    await fillValidForm(page);

    await expect(page.locator('#ward')).toHaveValue('8th Ward');
    await expect(page.locator('#building')).toHaveValue('Stake Center');
    await expect(page.locator('#request')).toHaveValue('building_access');
    await expect(page.locator('#name')).toHaveValue('John Test');
    await expect(page.locator('#email')).toHaveValue('test@example.com');
    await expect(page.locator('#accessInfo')).toHaveValue('Tomorrow 8am - 10pm\nFamily Party');
  });
});

test.describe('Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('submitting empty form triggers browser validation', async ({ page }) => {
    await page.selectOption('#request', 'building_access');
    await page.click('.submit-btn');
    await expect(page.locator('#message')).toHaveText('');
  });
});

test.describe('Submission', () => {
  test('successful submit sends correct payload and shows success', async ({ page }) => {
    let capturedBody = null;

    await page.route('**/macros/s/**', async (route) => {
      capturedBody = route.request().postData();
      await route.fulfill({ status: 200, body: 'ok' });
    });

    await page.goto('/');
    await fillValidForm(page);

    await page.click('.submit-btn');

    await expect(page.locator('#message')).toHaveText('Request submitted successfully!');

    expect(capturedBody).toBeTruthy();
    const decoded = decodeURIComponent(capturedBody).replace('data=', '');
    const data = JSON.parse(decoded);
    expect(data.ward).toBe('8th Ward');
    expect(data.building).toBe('Stake Center');
    expect(data.request).toBe('building_access');
    expect(data.name).toBe('John Test');
    expect(data.email).toBe('test@example.com');
    expect(data.accessInfo).toBe('Tomorrow 8am - 10pm\nFamily Party');
  });

  test('form resets after successful submission', async ({ page }) => {
    await page.route('**/macros/s/**', async (route) => {
      await route.fulfill({ status: 200, body: 'ok' });
    });

    await page.goto('/');
    await fillValidForm(page);
    await page.click('.submit-btn');

    await expect(page.locator('#message')).toHaveText('Request submitted successfully!');

    await expect(page.locator('#requestContent')).toHaveClass(/hidden/);
    await expect(page.locator('#usageNote')).toHaveClass(/hidden/);
  });

  test('network error shows error message', async ({ page }) => {
    await page.route('**/macros/s/**', async (route) => {
      await route.abort('connectionrefused');
    });

    await page.goto('/');
    await fillValidForm(page);
    await page.click('.submit-btn');

    await expect(page.locator('#message')).toContainText('Error:');
  });
});

test.describe('Cancel button', () => {
  test('cancel with empty form resets without confirm dialog', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#request', 'building_access');

    await page.evaluate(() => {
      window._confirmCalled = false;
      window.confirm = () => { window._confirmCalled = true; return false; };
    });

    await page.click('.cancel-btn');
    const confirmCalled = await page.evaluate(() => window._confirmCalled);
    expect(confirmCalled).toBe(false);
  });

  test('cancel with filled form shows confirm dialog', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#request', 'building_access');
    await page.fill('#name', 'John Test');

    await page.evaluate(() => {
      window._confirmCalled = false;
      window.confirm = () => { window._confirmCalled = true; return true; };
    });

    await page.click('.cancel-btn');
    const confirmCalled = await page.evaluate(() => window._confirmCalled);
    expect(confirmCalled).toBe(true);
  });

  test('confirming cancel clears the form', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#request', 'building_access');
    await page.fill('#name', 'John Test');

    await page.evaluate(() => {
      window.confirm = () => true;
    });

    await page.click('.cancel-btn');
    await expect(page.locator('#requestContent')).toHaveClass(/hidden/);
    await expect(page.locator('#usageNote')).not.toHaveClass(/hidden/);
  });
});

test.describe('Dark/light mode', () => {
  test('toggle switches between light and dark mode', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).toHaveClass('light');

    await page.click('#modeToggle');
    await expect(page.locator('body')).not.toHaveClass(/light/);

    await page.click('#modeToggle');
    await expect(page.locator('body')).toHaveClass('light');
  });
});
