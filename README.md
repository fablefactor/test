# World Clock Application

A simple web-based world clock application that displays the local time and the time in a user-selected international city.

## Key Features

*   Displays current local time with date information.
*   Allows selection of international locations through a series of dropdowns:
    *   Continent/Region
    *   Country / Territory Group
    *   City / Specific Territory
    *   City (for multi-level territories)
*   Dynamically updates to show time, timezone information, country flag, and other relevant details for the selected international location.
*   Supports 12-hour and 24-hour time formats, switchable via a toggle button.
*   Remembers the last selected location using browser cookies.
*   Responsive design that adapts to different screen sizes.
*   Includes data for a wide range of cities, countries, and territories, including those with complex administrative structures.

## Tech Stack

*   HTML5
*   CSS3 (including Flexbox, Grid, Custom Properties)
*   JavaScript (ES6+)
*   jQuery 3.6.0
*   Select2 4.1.0-rc.0 (for enhanced dropdowns)

## How to Run

1.  Clone or download the repository.
2.  Open the `index.html` file in a modern web browser.
    *   No build process or local server is strictly required for basic functionality.

## Data Sources

The city, country, timezone, and administrative data in `cities-data.js` is aggregated and adapted from various sources, conceptually including:
*   Timezone information: IANA Time Zone Database
*   Population data: UN World Population Prospects (conceptual basis)
*   Geographical/Country Codes: ISO 3166-1 alpha-2 (for flags)

## Development Notes (Optional)

*   The application uses Select2 for user-friendly searchable dropdowns.
*   JavaScript handles dynamic content updates, timezone calculations, and cookie management.
*   CSS variables are used for theming and maintainability.
