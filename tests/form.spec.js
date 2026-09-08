const { test, expect } = require('playwright/test');

// What the Apps Script endpoint actually returns on success.
const SUCCESS_BODY = JSON.stringify({ message: 'Request submitted successfully!' });

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

  test('access note tells users to allow 24 hours', async ({ page }) => {
    await expect(page.locator('.access-note').last()).toHaveText('Allow 24 hours for access.');
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
    // Hidden until the Apps Script side ships; see #acknowledgeRow in index.html.
    await expect(page.locator('#acknowledge')).not.toBeVisible();
    await expect(page.locator('#acknowledge')).not.toBeChecked();
  });

  test('selecting building_lockup shows bulkChanges and hides name/email', async ({ page }) => {
    await page.selectOption('#request', 'building_lockup');
    await expect(page.locator('#requestContent')).not.toHaveClass(/hidden/);
    await expect(page.locator('#nameEmailFields')).toHaveClass(/hidden/);
    await expect(page.locator('#temporaryFields')).toHaveClass(/hidden/);
    await expect(page.locator('#lockupFields')).not.toHaveClass(/hidden/);
    await expect(page.locator('#bulkHint')).toHaveText('Enter 1 or more: Name, Email, Date Range.');
    await expect(page.locator('#acknowledge')).not.toBeVisible();
  });

  // Un-skip these three when #acknowledgeRow loses its "hidden" class —
  // page.check() can't act on a hidden element.
  test.skip('switching away from building_access clears the acknowledgement box', async ({ page }) => {
    await page.selectOption('#request', 'building_access');
    await page.check('#acknowledge');
    await page.selectOption('#request', 'building_lockup');
    await page.selectOption('#request', 'building_access');
    await expect(page.locator('#acknowledge')).not.toBeChecked();
  });

  test('request dropdown offers only building access and lockup', async ({ page }) => {
    const options = page.locator('#request option');
    await expect(options).toHaveCount(3);
    // toHaveValue is for inputs; an <option>'s value is a plain attribute.
    await expect(options.nth(1)).toHaveAttribute('value', 'building_access');
    await expect(options.nth(2)).toHaveAttribute('value', 'building_lockup');
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
      await route.fulfill({ status: 200, contentType: 'application/json', body: SUCCESS_BODY });
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
    expect(data.acknowledge).toBe(false);
  });

  // Apps Script checks for an explicit true, so the key must be a real boolean
  // in both directions — not omitted when the box is left alone.
  test.skip('ticking the acknowledgement box sends acknowledge: true', async ({ page }) => {
    let capturedBody = null;

    await page.route('**/macros/s/**', async (route) => {
      capturedBody = route.request().postData();
      await route.fulfill({ status: 200, contentType: 'application/json', body: SUCCESS_BODY });
    });

    await page.goto('/');
    await fillValidForm(page);
    await page.check('#acknowledge');

    await page.click('.submit-btn');

    await expect(page.locator('#message')).toHaveText('Request submitted successfully!');

    const data = JSON.parse(decodeURIComponent(capturedBody).replace('data=', ''));
    expect(data.acknowledge).toBe(true);
  });

  // Lockup is a bulk submission with no single requester address, so the key
  // must not appear at all.
  test('lockup submission omits acknowledge', async ({ page }) => {
    let capturedBody = null;

    await page.route('**/macros/s/**', async (route) => {
      capturedBody = route.request().postData();
      await route.fulfill({ status: 200, contentType: 'application/json', body: SUCCESS_BODY });
    });

    await page.goto('/');
    await page.selectOption('#ward', '8th Ward');
    await page.selectOption('#building', 'Stake Center');
    await page.selectOption('#request', 'building_lockup');
    await page.fill('#bulkChanges', 'John Smith, js@example.com 4/24/26 - 4/26/26');

    await page.click('.submit-btn');

    await expect(page.locator('#message')).toHaveText('Request submitted successfully!');

    const data = JSON.parse(decodeURIComponent(capturedBody).replace('data=', ''));
    expect(data.acknowledge).toBeUndefined();
  });

  test('form resets after successful submission', async ({ page }) => {
    await page.route('**/macros/s/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: SUCCESS_BODY });
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

    await expect(page.locator('#message')).toContainText('Not submitted');
    await expect(page.locator('#message')).toContainText('could not reach the server');
    await expect(page.locator('#message')).toContainText('contact Bro Weston');
    // Browser-specific wording like "Failed to fetch" should not leak through.
    await expect(page.locator('#message')).not.toContainText('fetch');
  });

  // A 403 is what a revoked Apps Script authorization looks like. Before the
  // mode: 'no-cors' fix the response was opaque and this reported success.
  test('403 from the endpoint reports failure, not success', async ({ page }) => {
    await page.route('**/macros/s/**', async (route) => {
      await route.fulfill({ status: 403, contentType: 'text/html', body: '<title>Access Denied</title>' });
    });

    await page.goto('/');
    await fillValidForm(page);
    await page.click('.submit-btn');

    await expect(page.locator('#message')).toContainText('Not submitted');
    await expect(page.locator('#message')).toContainText('403');
    await expect(page.locator('#message')).toContainText('contact Bro Weston');
    await expect(page.locator('#message')).not.toContainText('successfully');

    // The form must stay filled so the request is not silently lost.
    await expect(page.locator('#requestContent')).not.toHaveClass(/hidden/);
    await expect(page.locator('#name')).toHaveValue('John Test');
    await expect(page.locator('.submit-btn')).toBeEnabled();
  });

  test('server error surfaces the status code', async ({ page }) => {
    await page.route('**/macros/s/**', async (route) => {
      await route.fulfill({ status: 500, body: 'boom' });
    });

    await page.goto('/');
    await fillValidForm(page);
    await page.click('.submit-btn');

    await expect(page.locator('#message')).toContainText('500');
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

  // The checkbox is user input too — cancelling must not discard it silently.
  test.skip('cancel with only the acknowledgement box ticked shows confirm dialog', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#request', 'building_access');
    await page.check('#acknowledge');

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
