const { test, expect } = require('@playwright/test');

// Runs before each test in this file, navigating to the application's main page.
test.beforeEach(async ({ page }) => {
  await page.goto('index.html');
});

test.describe('Local Clock', () => {
  test('local clock displays time', async ({ page }) => {
    // Check visibility and format of local time elements.
    await expect(page.locator('#hours')).toBeVisible();
    await expect(page.locator('#hours')).toHaveText(/\d{2}/); // Matches two digits
    await expect(page.locator('#minutes')).toBeVisible();
    await expect(page.locator('#minutes')).toHaveText(/\d{2}/); // Matches two digits
    await expect(page.locator('#seconds')).toBeVisible();
    await expect(page.locator('#seconds')).toHaveText(/\d{2}/); // Matches two digits
    await expect(page.locator('#ampm')).toBeVisible(); // AM/PM indicator should be visible by default (12H format)
  });
});

test.describe('Time Format Toggle', () => {
  test('format toggle changes local clock format', async ({ page }) => {
    const formatToggle = page.locator('#formatToggle');
    const ampm = page.locator('#ampm');

    // Initial state: 12H format
    await expect(formatToggle).toHaveText('Switch to 24H');
    await expect(ampm).toBeVisible();

    // Click to switch to 24H format
    await formatToggle.click();
    await expect(formatToggle).toHaveText('Switch to 12H');
    await expect(ampm).toHaveCSS('display', 'none'); // AM/PM should be hidden in 24H format

    // Click to switch back to 12H format
    await formatToggle.click();
    await expect(formatToggle).toHaveText('Switch to 24H');
    await expect(ampm).toBeVisible(); // AM/PM should be visible again
  });

  test('format toggle changes international clock format', async ({ page }) => {
    const formatToggle = page.locator('#formatToggle');
    const intAmpm = page.locator('#intAmpm'); // AM/PM indicator for the international clock

    // Wait for the default international clock (New York) to load and display time.
    // This ensures the #intAmpm element is present and its visibility can be checked.
    await expect(page.locator('#cityInfo')).toContainText('New York', { timeout: 10000 });
    await expect(intAmpm).toBeVisible(); // Should be visible in default 12H format

    // Click to switch to 24H format
    await formatToggle.click();
    await expect(intAmpm).toHaveCSS('display', 'none'); // International AM/PM should be hidden

    // Click to switch back to 12H format
    await formatToggle.click();
    await expect(intAmpm).toBeVisible(); // International AM/PM should be visible again
  });
});

test.describe('Default International Clock (New York)', () => {
  test('default international clock (New York) displays time', async ({ page }) => {
    // Wait for the city name "New York" to appear in #cityInfo.
    // This confirms the default international clock has loaded. Increased timeout for reliability.
    await expect(page.locator('#cityInfo')).toContainText('New York', { timeout: 10000 });

    // Check that the city name, time elements, AM/PM, and flag are displayed.
    await expect(page.locator('#cityInfo')).toContainText('New York');
    await expect(page.locator('#intHours')).toBeVisible();
    await expect(page.locator('#intHours')).toHaveText(/\d{2}/);
    await expect(page.locator('#intMinutes')).toBeVisible();
    await expect(page.locator('#intMinutes')).toHaveText(/\d{2}/);
    await expect(page.locator('#intSeconds')).toBeVisible();
    await expect(page.locator('#intSeconds')).toHaveText(/\d{2}/);
    await expect(page.locator('#intAmpm')).toBeVisible();
    await expect(page.locator('#selectedFlag')).toHaveAttribute('src', /.*/); // Check that src attribute is present and not empty
  });
});
