const { test, expect } = require('@playwright/test');

// Runs before each test in this file, navigating to the application's main page.
test.beforeEach(async ({ page }) => {
  await page.goto('index.html');
});

test.describe('Cascading Dropdowns', () => {
  // Tests the functionality of the continent dropdown enabling and populating the country dropdown.
  test('selecting continent enables country dropdown and loads countries', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Asia' });

    // Country dropdown should be enabled.
    await expect(page.locator('#countrySelect')).toBeEnabled();
    // Verify that specific countries are loaded into the country dropdown.
    await expect(page.locator('#countrySelect')).toContainText('China');
    await expect(page.locator('#countrySelect')).toContainText('India');
    await expect(page.locator('#countrySelect')).toContainText('Japan');
    // City dropdown should remain disabled until a country is selected.
    await expect(page.locator('#citySelect')).toBeDisabled();
  });

  // Tests the functionality of the country dropdown enabling and populating the city dropdown.
  test('selecting country enables city dropdown and loads cities', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Asia' });
    await page.selectOption('#countrySelect', { label: 'India' });

    // City dropdown should be enabled.
    await expect(page.locator('#citySelect')).toBeEnabled();
    // Verify that specific cities are loaded into the city dropdown.
    await expect(page.locator('#citySelect')).toContainText('Mumbai');
    await expect(page.locator('#citySelect')).toContainText('Delhi');
  });

  // Tests that changing the continent selection resets the country and city dropdowns.
  test('changing continent resets country and city dropdowns', async ({ page }) => {
    // Initial selection: Asia -> India -> Mumbai
    await page.selectOption('#continentSelect', { label: 'Asia' });
    await page.selectOption('#countrySelect', { label: 'India' });
    await page.selectOption('#citySelect', { label: 'Mumbai' });
    // Wait for the city info to update to confirm selection.
    await expect(page.locator('#cityInfo')).toContainText('Mumbai, India (Asia)', { timeout: 10000 });

    // Change continent to Europe.
    await page.selectOption('#continentSelect', { label: 'Europe' });

    // Assertions for reset behavior:
    // Country dropdown should be enabled and populated with European countries.
    await expect(page.locator('#countrySelect')).toBeEnabled();
    await expect(page.locator('#countrySelect')).toContainText('United Kingdom');
    await expect(page.locator('#countrySelect')).toContainText('France');
    // Crucially, previously selected Asian countries should no longer be present.
    await expect(page.locator('#countrySelect')).not.toContainText('India');

    // City dropdown should be disabled as no country in Europe is yet selected.
    await expect(page.locator('#citySelect')).toBeDisabled();
    // The city dropdown should revert to its default empty/placeholder state.
    const citySelectValue = await page.locator('#citySelect').inputValue();
    expect(citySelectValue).toBe(""); // Default value for a select when no option is chosen.
  });
});

test.describe('City Selection and Data Display', () => {
  // Define a list of diverse cities to test data display for.
  const citiesToTest = [
    { continent: 'Europe', country: 'United Kingdom', city: 'London' },
    { continent: 'Asia', country: 'Japan', city: 'Tokyo' },
    { continent: 'Oceania', country: 'Australia', city: 'Sydney' },
    { continent: 'Asia', country: 'India', city: 'Mumbai' },
  ];

  // Loop through each city in the list and create a parameterized test.
  for (const cityData of citiesToTest) {
    test(`selecting ${cityData.city}, ${cityData.country} displays correct time and info`, async ({ page }) => {
      // Select the continent, country, and city from the dropdowns.
      await page.selectOption('#continentSelect', { label: cityData.continent });
      await page.selectOption('#countrySelect', { label: cityData.country });
      await page.selectOption('#citySelect', { label: cityData.city });

      // Wait for #cityInfo to update with the selected city name, using an increased timeout for reliability.
      await expect(page.locator('#cityInfo')).toContainText(cityData.city, { timeout: 15000 });

      // Verify that the city info displays the correct full location string.
      await expect(page.locator('#cityInfo')).toContainText(`${cityData.city}, ${cityData.country} (${cityData.continent})`);
      // Check that the flag image has a source attribute (i.e., an image is loaded).
      await expect(page.locator('#selectedFlag')).toHaveAttribute('src', /.*/); // Regex matches any non-empty src.
      expect(await page.locator('#selectedFlag').getAttribute('src')).not.toBe('');

      // Verify that the international clock displays a valid time format.
      await expect(page.locator('#intHours')).toHaveText(/\d{2}/);
      await expect(page.locator('#intMinutes')).toHaveText(/\d{2}/);
      await expect(page.locator('#intSeconds')).toHaveText(/\d{2}/);

      // Verify that other informational fields are populated (not empty).
      // These are generic checks; specific content checks would depend on the exact data.
      const timezoneInfo = await page.locator('#timezoneInfo').textContent();
      expect(timezoneInfo).not.toBe('');
      const regionInfo = await page.locator('#regionInfo').textContent();
      expect(regionInfo).not.toBe('');

      // Population and special notes might be empty for some cities, so check they exist.
      const populationText = await page.locator('#populationInfo').textContent();
      expect(populationText !== null).toBe(true); // Ensures the element is present and has some content (even if empty string).

      const notesText = await page.locator('#specialNotes').textContent();
      expect(notesText !== null).toBe(true); // Ensures the element is present.
    });
  }
});

test.describe('Cookie Functionality', () => {
  // Tests if the application saves the last selected location to a cookie and restores it on page reload.
  test('saves last selected location to cookie and restores it', async ({ page }) => {
    const testCity = { continent: 'Europe', country: 'France', city: 'Paris' };

    // Select a specific city.
    await page.selectOption('#continentSelect', { label: testCity.continent });
    await page.selectOption('#countrySelect', { label: testCity.country });
    await page.selectOption('#citySelect', { label: testCity.city });

    // Wait for the city info to update.
    await expect(page.locator('#cityInfo')).toContainText(`${testCity.city}, ${testCity.country} (${testCity.continent})`, { timeout: 10000 });

    // Reload the page.
    await page.reload();

    // Wait for the page to reload and potentially restore the selected city from the cookie.
    // Increased timeout to allow for cookie processing and UI update.
    await expect(page.locator('#cityInfo')).toContainText(`${testCity.city}, ${testCity.country} (${testCity.continent})`, { timeout: 15000 });
    
    // Verify that the dropdowns also reflect the restored selection.
    expect(await page.inputValue('#continentSelect')).toBe(testCity.continent);
    // For country and city, checking the selected option's text is more robust than inputValue if values are IDs.
    const selectedCountryText = await page.locator('#countrySelect option:checked').textContent();
    expect(selectedCountryText).toBe(testCity.country);
    const selectedCityText = await page.locator('#citySelect option:checked').textContent();
    expect(selectedCityText).toBe(testCity.city);
  });

  // Tests if clearing cookies causes the application to load the default location (New York).
  test('clearing cookies loads default location (New York)', async ({ page }) => {
    const testCity = { continent: 'Europe', country: 'France', city: 'Paris' };

    // Select a specific city.
    await page.selectOption('#continentSelect', { label: testCity.continent });
    await page.selectOption('#countrySelect', { label: testCity.country });
    await page.selectOption('#citySelect', { label: testCity.city });
    await expect(page.locator('#cityInfo')).toContainText(`${testCity.city}, ${testCity.country} (${testCity.continent})`, { timeout: 10000 });

    // Clear cookies in the current browser context.
    await page.context().clearCookies();
    // Reload the page.
    await page.reload();

    // Wait for the page to load and display the default location (New York).
    await expect(page.locator('#cityInfo')).toContainText('New York, United States (North America)', { timeout: 15000 });

    // Verify that the dropdowns are set to the default location.
    expect(await page.inputValue('#continentSelect')).toBe('North America');
    const selectedCountryText = await page.locator('#countrySelect option:checked').textContent();
    expect(selectedCountryText).toBe('United States');
     const selectedCityText = await page.locator('#citySelect option:checked').textContent();
    expect(selectedCityText).toBe('New York');
  });
});
