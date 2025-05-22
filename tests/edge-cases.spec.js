const { test, expect } = require('@playwright/test');

// Runs before each test in this file, navigating to the application's main page.
test.beforeEach(async ({ page }) => {
  await page.goto('index.html');
});

test.describe('Multiple Timezones in a Country', () => {
  // Tests if selecting cities in different timezones within the same country (USA) displays different times.
  test('selecting cities in different timezones within the USA shows different times', async ({ page }) => {
    // Select New York (Eastern Time).
    await page.selectOption('#continentSelect', { label: 'North America' });
    await page.selectOption('#countrySelect', { label: 'United States' });
    await page.selectOption('#citySelect', { label: 'New York' });
    // Wait for city info to update and capture the displayed hour.
    await expect(page.locator('#cityInfo')).toContainText('New York, United States (North America)', { timeout: 10000 });
    const newYorkHour = await page.locator('#intHours').textContent();
    await expect(newYorkHour).toMatch(/\d{2}/); // Expect a two-digit hour.

    // Select Los Angeles (Pacific Time).
    await page.selectOption('#citySelect', { label: 'Los Angeles' });
    // Wait for city info to update and capture the displayed hour.
    await expect(page.locator('#cityInfo')).toContainText('Los Angeles, United States (North America)', { timeout: 10000 });
    const losAngelesHour = await page.locator('#intHours').textContent();
    await expect(losAngelesHour).toMatch(/\d{2}/);

    // Assertion: The hour displayed for Los Angeles should be different from New York's.
    expect(losAngelesHour).not.toBe(newYorkHour);
    // Note: A more precise check would verify the exact 3-hour difference,
    // but this requires careful handling of current time and potential DST, so difference is a good start.
  });
});

test.describe('Daylight Saving Time (DST)', () => {
  // Tests if a city known to observe DST (London) displays timezone information that reflects this.
  test('displays timezone info that might indicate DST for a DST-observing city (London)', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Europe' });
    await page.selectOption('#countrySelect', { label: 'United Kingdom' });
    await page.selectOption('#citySelect', { label: 'London' });
    await expect(page.locator('#cityInfo')).toContainText('London, United Kingdom (Europe)', { timeout: 10000 });

    const timezoneInfo = await page.locator('#timezoneInfo').textContent();
    // Check for timezone strings like "GMT/BST" or "UTC+0:00/UTC+1:00" or "observes DST",
    // which indicate DST handling, based on how `cities-data.js` might format it.
    expect(timezoneInfo).toMatch(/GMT\/BST|observes DST|UTC\+0:00\/UTC\+1:00/i);
  });

  // Tests if a city known not to observe DST (Reykjavík) displays timezone information reflecting this.
  test('displays timezone info for a non-DST city (Reykjavík)', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Europe' });
    await page.selectOption('#countrySelect', { label: 'Iceland' });
    await page.selectOption('#citySelect', { label: 'Reykjavík' });
    await expect(page.locator('#cityInfo')).toContainText('Reykjavík, Iceland (Europe)', { timeout: 10000 });

    const timezoneInfo = await page.locator('#timezoneInfo').textContent();
    // Check for timezone strings like "GMT (No DST)" or "UTC+0:00", indicating no DST.
    expect(timezoneInfo).toMatch(/GMT \(No DST\)|UTC\+0:00/i);
  });
});

test.describe('Unusual Timezone Offsets', () => {
  // Tests functionality with a city having a .30 hour offset (Mumbai, India - UTC+5:30).
  test('selecting city with a .30 offset (Mumbai, India)', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Asia' });
    await page.selectOption('#countrySelect', { label: 'India' });
    await page.selectOption('#citySelect', { label: 'Mumbai' });
    await expect(page.locator('#cityInfo')).toContainText('Mumbai, India (Asia)', { timeout: 10000 });

    // Ensure time is displayed, and minutes can handle non-zero values like '30'.
    await expect(page.locator('#intHours')).toHaveText(/\d{2}/);
    await expect(page.locator('#intMinutes')).toHaveText(/\d{2}/);

    const timezoneInfo = await page.locator('#timezoneInfo').textContent();
    // Expect "IST" or "UTC+5:30" in the timezone display.
    expect(timezoneInfo).toMatch(/IST|UTC\+5:30/i);
  });

  // Tests functionality with a city having a .45 hour offset (Kathmandu, Nepal - UTC+5:45).
  test('selecting city with a .45 offset (Kathmandu, Nepal)', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Asia' });
    await page.selectOption('#countrySelect', { label: 'Nepal' });
    await page.selectOption('#citySelect', { label: 'Kathmandu' });
    await expect(page.locator('#cityInfo')).toContainText('Kathmandu, Nepal (Asia)', { timeout: 10000 });

    // Ensure time is displayed, and minutes can handle non-zero values like '45'.
    await expect(page.locator('#intHours')).toHaveText(/\d{2}/);
    await expect(page.locator('#intMinutes')).toHaveText(/\d{2}/);

    const timezoneInfo = await page.locator('#timezoneInfo').textContent();
    // Expect "NPT" or "UTC+5:45" in the timezone display.
    expect(timezoneInfo).toMatch(/NPT|UTC\+5:45/i);
  });
});

test.describe('Missing Optional Data', () => {
  // Tests how the UI handles a city (Monaco) that has minimal data in `cities-data.js` (missing population, specific notes).
  test('UI handles missing optional data gracefully for Monaco', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Europe' });
    await page.selectOption('#countrySelect', { label: 'Monaco' });
    await page.selectOption('#citySelect', { label: 'Monaco' }); // 'Monaco' is the city.
    await expect(page.locator('#cityInfo')).toContainText('Monaco, Monaco (Europe)', { timeout: 10000 });

    // Essential information (clock, flag) should still be displayed.
    await expect(page.locator('#intHours')).toBeVisible();
    await expect(page.locator('#intMinutes')).toBeVisible();
    await expect(page.locator('#selectedFlag')).toHaveAttribute('src', /.*/); // Flag image should load.

    // Timezone info should be present (Monaco has 'CET/CEST').
    await expect(page.locator('#timezoneInfo')).not.toBeEmpty();

    // Optional data fields (population, special notes) should be empty or show a default 'N/A' text.
    const populationInfo = await page.locator('#populationInfo').textContent();
    expect(populationInfo === '' || populationInfo === 'N/A' || populationInfo === 'Population: N/A').toBeTruthy();

    const specialNotes = await page.locator('#specialNotes').textContent();
    expect(specialNotes === '' || specialNotes === 'N/A' || specialNotes === 'Notes: N/A').toBeTruthy();

    // Check for no obvious error messages on the page (e.g., "Error", "undefined").
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(page.locator('body')).not.toContainText('undefined');
  });
});

test.describe('Dropdown Search/Filter Functionality (Select2)', () => {
  // Tests if the Select2 search/filter works for the continent dropdown.
  test('searching in continent dropdown filters results', async ({ page }) => {
    await page.locator('#continentSelect').click(); // Open the Select2 dropdown for continents.
    // The search input field is dynamically created by Select2.
    await page.locator('.select2-search__field').fill('asia');
    // After typing, "Asia" should be highlighted or be the primary result.
    await expect(page.locator('.select2-results__options .select2-results__option--highlighted')).toHaveText('Asia');
    // "Asia" should also be present in the list of options.
    await expect(page.locator('.select2-results__options')).toContainText('Asia');
    // Optional: Could check that non-matching options are less prominent or not visible,
    // but this can be complex depending on Select2's filtering strategy.
  });

  // Tests if the Select2 search/filter works for the country dropdown.
  test('searching in country dropdown filters results', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Europe' }); // Prerequisite: select a continent.
    await page.locator('#countrySelect').click(); // Open country dropdown.
    await page.locator('.select2-search__field').fill('Germa');
    await expect(page.locator('.select2-results__options .select2-results__option--highlighted')).toHaveText('Germany');
    await expect(page.locator('.select2-results__options')).toContainText('Germany');
  });

  // Tests if the Select2 search/filter works for the city dropdown.
  test('searching in city dropdown filters results', async ({ page }) => {
    await page.selectOption('#continentSelect', { label: 'Europe' });
    await page.selectOption('#countrySelect', { label: 'Germany' }); // Prerequisites for city dropdown.
    await page.locator('#citySelect').click(); // Open city dropdown.
    await page.locator('.select2-search__field').fill('Berli');
    await expect(page.locator('.select2-results__options .select2-results__option--highlighted')).toHaveText('Berlin');
    await expect(page.locator('.select2-results__options')).toContainText('Berlin');
  });
});
