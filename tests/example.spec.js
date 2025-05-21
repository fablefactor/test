// tests/example.spec.js
const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('index.html'); // Assuming index.html is in the root
  await expect(page).toHaveTitle(/World Clock/);
});
