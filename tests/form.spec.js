const { test, expect } = require('playwright/test');

// Helper: get tomorrow's date as YYYY-MM-DD
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// Helper: fill the form with valid data
async function fillValidForm(page) {
  const date = tomorrow();
  await page.selectOption('#ward', '8th Ward');
  await page.selectOption('#request', 'building_access');
  await page.fill('#name', 'John Test');
  await page.fill('#email', 'test@example.com');
  await page.fill('#startDate', date);
  await page.locator('#startDate').dispatchEvent('blur');
  await page.selectOption('#startTime', '8:00 AM');
  await page.fill('#endDate', date);
  await page.locator('#endDate').dispatchEvent('blur');
  await page.selectOption('#endTime', '10:00 PM');
  await page.fill('#purpose', 'Testing');
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

  test('selecting a ward auto-selects the correct building', async ({ page }) => {
    await page.selectOption('#ward', '1st Ward');
    await expect(page.locator('#building')).toHaveValue('2700 Building');

    await page.selectOption('#ward', '4th Ward');
    await expect(page.locator('#building')).toHaveValue('3200 Building');

    await page.selectOption('#ward', '8th Ward');
    await expect(page.locator('#building')).toHaveValue('Stake Center');
  });

  test('time dropdowns have correct options', async ({ page }) => {
    await page.selectOption('#request', 'building_access');
    const startOptions = page.locator('#startTime option');
    await expect(startOptions).toHaveCount(37); // 36 time slots + placeholder
    await expect(startOptions.nth(1)).toHaveText('6:00 AM');
    await expect(startOptions.last()).toHaveText('11:30 PM');
  });

  test('setting start date auto-fills default times and syncs end date', async ({ page }) => {
    await page.selectOption('#request', 'building_access');
    const date = tomorrow();
    await page.fill('#startDate', date);
    await page.locator('#startDate').dispatchEvent('blur');

    await expect(page.locator('#startTime')).toHaveValue('8:00 AM');
    await expect(page.locator('#endDate')).toHaveValue(date);
    await expect(page.locator('#endTime')).toHaveValue('10:00 PM');
  });

  test('form can be fully filled out', async ({ page }) => {
    await fillValidForm(page);

    await expect(page.locator('#ward')).toHaveValue('8th Ward');
    await expect(page.locator('#building')).toHaveValue('Stake Center');
    await expect(page.locator('#request')).toHaveValue('building_access');
    await expect(page.locator('#name')).toHaveValue('John Test');
    await expect(page.locator('#email')).toHaveValue('test@example.com');
    await expect(page.locator('#startTime')).toHaveValue('8:00 AM');
    await expect(page.locator('#endTime')).toHaveValue('10:00 PM');
    await expect(page.locator('#purpose')).toHaveValue('Testing');
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

  test('end date before start date shows error', async ({ page }) => {
    const date = tomorrow();
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    await page.selectOption('#ward', '8th Ward');
    await page.selectOption('#request', 'building_access');
    await page.fill('#name', 'John Test');
    await page.fill('#email', 'test@example.com');
    await page.selectOption('#startTime', '8:00 AM');
    await page.selectOption('#endTime', '10:00 PM');

    // Set dates via JS to bypass browser min constraint that prevents
    // endDate from being before startDate
    await page.evaluate(({ start, end }) => {
      const form = document.getElementById('licenseForm');
      form.startDate.value = start;
      form.endDate.value = end;
    }, { start: dayAfterStr, end: date });

    await page.click('.submit-btn');
    await expect(page.locator('#message')).toHaveText('End date cannot be before start date.');
  });

  test('same-day end time before start time shows error', async ({ page }) => {
    const date = tomorrow();
    await page.selectOption('#ward', '8th Ward');
    await page.selectOption('#request', 'building_access');
    await page.fill('#name', 'John Test');
    await page.fill('#email', 'test@example.com');
    await page.fill('#startDate', date);
    await page.locator('#startDate').dispatchEvent('blur');
    await page.selectOption('#startTime', '10:00 PM');
    await page.fill('#endDate', date);
    await page.locator('#endDate').dispatchEvent('blur');
    await page.selectOption('#endTime', '8:00 AM');

    await page.click('.submit-btn');
    await expect(page.locator('#message')).toHaveText('End time must be after start time on the same day.');
  });

  test('same-day equal start and end time shows error', async ({ page }) => {
    const date = tomorrow();
    await page.selectOption('#ward', '8th Ward');
    await page.selectOption('#request', 'building_access');
    await page.fill('#name', 'John Test');
    await page.fill('#email', 'test@example.com');
    await page.fill('#startDate', date);
    await page.locator('#startDate').dispatchEvent('blur');
    await page.selectOption('#startTime', '8:00 AM');
    await page.fill('#endDate', date);
    await page.locator('#endDate').dispatchEvent('blur');
    await page.selectOption('#endTime', '8:00 AM');

    await page.click('.submit-btn');
    await expect(page.locator('#message')).toHaveText('End time must be after start time on the same day.');
  });
});

test.describe('Submission', () => {
  test('successful submit sends correct payload and shows success', async ({ page }) => {
    let capturedBody = null;

    // Intercept the Apps Script POST
    await page.route('**/macros/s/**', async (route) => {
      capturedBody = route.request().postData();
      await route.fulfill({ status: 200, body: 'ok' });
    });

    await page.goto('/');
    await fillValidForm(page);

    await page.click('.submit-btn');

    // Button should show submitting state briefly
    // Then success message appears
    await expect(page.locator('#message')).toHaveText('Request submitted successfully!');

    // Verify payload contents
    expect(capturedBody).toBeTruthy();
    const decoded = decodeURIComponent(capturedBody).replace('data=', '');
    const data = JSON.parse(decoded);
    expect(data.ward).toBe('8th Ward');
    expect(data.building).toBe('Stake Center');
    expect(data.request).toBe('building_access');
    expect(data.name).toBe('John Test');
    expect(data.email).toBe('test@example.com');
    expect(data.startTime).toBe('8:00 AM');
    expect(data.endTime).toBe('10:00 PM');
    expect(data.purpose).toBe('Testing');
  });

  test('form resets after successful submission', async ({ page }) => {
    await page.route('**/macros/s/**', async (route) => {
      await route.fulfill({ status: 200, body: 'ok' });
    });

    await page.goto('/');
    await fillValidForm(page);
    await page.click('.submit-btn');

    await expect(page.locator('#message')).toHaveText('Request submitted successfully!');

    // Form should revert to initial view
    await expect(page.locator('#requestContent')).toHaveClass(/hidden/);
    await expect(page.locator('#usageNote')).not.toHaveClass(/hidden/);
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

    // Override confirm to track if it's called
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

    // Starts in light mode
    await expect(page.locator('body')).toHaveClass('light');

    await page.click('#modeToggle');
    await expect(page.locator('body')).not.toHaveClass(/light/);

    await page.click('#modeToggle');
    await expect(page.locator('body')).toHaveClass('light');
  });
});
