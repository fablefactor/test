# World Clock Application

This application displays the local time and allows users to view the current time in various cities around the world. It features a 12/24 hour format toggle and remembers the last selected international city.

## Features

*   Displays local time, updating every second.
*   Toggle between 12-hour and 24-hour time formats for both local and international clocks.
*   Select international cities from cascading dropdowns (Continent -> Country -> City).
*   Displays the selected international city's current time, flag, and other relevant information (timezone, population, notes).
*   Saves the last selected international city in a cookie and restores it on page load.
*   Search functionality within dropdowns for easier selection.

## Testing

This project uses Playwright for end-to-end GUI testing.

### Prerequisites

*   Node.js (version 18.x or higher recommended)
*   npm (usually comes with Node.js)

### Setup

1.  Clone the repository (if you haven't already):
    ```bash
    git clone <repository-url> 
    cd <repository-directory>
    ```
    *(Replace `<repository-url>` and `<repository-directory>` with the actual URL and local directory name)*

2.  Install dependencies:
    ```bash
    npm install
    ```
    This will install Playwright and other necessary packages. The first time you install, Playwright will also download browser binaries. If you need to manually install/update browser binaries later, you can run `npx playwright install --with-deps`.

### Running Tests

*   To run all tests in headless mode (as configured for CI and in `playwright.config.js`):
    ```bash
    npm test
    ```

*   To run tests in headed mode (opens browser windows, useful for debugging):
    ```bash
    npx playwright test --headed
    ```

### Viewing Test Reports

After tests have run, you can view a detailed HTML report:
```bash
npx playwright show-report
```
This will open the report in your web browser.
