let is24Hour = true;
let selectedTimezone = 'America/New_York';
let localTimezoneReverseMap = {}; // For optimized local timezone lookup

// Simple cookie functions
function saveLocationToCookie(continent, country, city) {
    // Encode individual components before stringifying, as per explicit instruction
    const locationObject = {
        continent: encodeURIComponent(continent),
        country: encodeURIComponent(country),
        city: encodeURIComponent(city)
    };
    const locationString = JSON.stringify(locationObject);
    // No need to encode locationString again if individual parts are encoded.
    // However, if the entire string was meant to be encoded after stringify, that's different.
    // Based on "individually passed through encodeURIComponent", locationString is now JSON of encoded parts.
    const cookieAttributes = `max-age=31536000;path=/;SameSite=Lax${window.isSecureContext ? ';Secure' : ''}`;
    document.cookie = `savedLocation=${locationString};${cookieAttributes}`; // 1 year. locationString is JSON of pre-encoded values.
}

function getLocationFromCookie() {
    const match = document.cookie.match(/savedLocation=([^;]+)/);
    if (match && match[1]) {
        try {
            // The cookie value is JSON string of pre-encoded values.
            // No need to decodeURIComponent on match[1] itself if it wasn't encoded after stringify.
            const parsedObject = JSON.parse(match[1]);
            // Decode individual components after parsing
            parsedObject.continent = decodeURIComponent(parsedObject.continent);
            parsedObject.country = decodeURIComponent(parsedObject.country);
            parsedObject.city = decodeURIComponent(parsedObject.city);
            return parsedObject;
        } catch (e) {
            console.error("Error parsing or decoding location cookie:", e);
            return null;
        }
    }
    return null;
}

// Get user's local timezone
const userLocation = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

// Function to build the reverse map for local timezone lookup
function buildTimezoneReverseMap() {
    for (const continent in worldCities) {
        // Skip 'Territories' or other non-geographic top-level keys if necessary
        if (continent === 'Territories' || typeof worldCities[continent] !== 'object') continue;

        for (const country in worldCities[continent]) {
            if (country === 'metadata' || country === 'population_order' || typeof worldCities[continent][country] !== 'object') continue;

            for (const city in worldCities[continent][country]) {
                if (city !== 'population_order' && city !== 'metadata') {
                    const timezone = worldCities[continent][country][city];
                    if (timezone && typeof timezone === 'string') { // Ensure it's a timezone string
                        if (!localTimezoneReverseMap[timezone]) { // Keep first encountered
                            localTimezoneReverseMap[timezone] = { city, country, continent };
                        }
                    }
                }
            }
        }
    }
}


// Initialize select2 dropdowns
$(document).ready(function() {
    buildTimezoneReverseMap(); // Build the map once worldCities is available

    const continentSelect = $('#continentSelect');
    const countrySelect = $('#countrySelect');
    const citySelect = $('#citySelect');

    // Custom matcher function that only matches from the start of the text
    function matchStart(params, data) {
        if ($.trim(params.term) === '') {
            return data;
        }
        
        if (typeof data.text === 'undefined') {
            return null;
        }
        
        if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
            return data;
        }
        
        return null;
    }

    // Initialize all selects with Select2 and custom matcher
    [continentSelect, countrySelect, citySelect].forEach(select => {
        select.select2({
            theme: 'classic',
            matcher: matchStart,
            width: '180px' // Set Select2 width
        });
    });

    // Populate continents (sorted alphabetically)
    Object.keys(worldCities)
        .sort()
        .forEach(continent => {
            continentSelect.append(new Option(continent, continent));
        });

    // Handle continent selection
    continentSelect.on('change', function() {
        const continent = $(this).val();
        countrySelect.empty().append(new Option('', '')).prop('disabled', !continent);
        citySelect.empty().append(new Option('', '')).prop('disabled', true);
        clearLocationInfo();
        
        if (continent) {
            // Sort countries alphabetically
            Object.keys(worldCities[continent])
                .sort()
                .forEach(country => {
                    countrySelect.append(new Option(country, country));
                });
            
            // Only open the dropdown if this was triggered by a user action
            if (!this.hasAttribute('data-programmatic')) {
                countrySelect.select2('open');
            }
            
            if (regionMetadata[continent]) {
                displayRegionInfo(regionMetadata[continent]);
            }
        }
    });

    // Handle country selection
    countrySelect.on('change', function() {
        const continent = continentSelect.val();
        const country = $(this).val();
        citySelect.empty().append(new Option('', '')).prop('disabled', !country);
        clearLocationInfo();
        
        if (country) {
            const countryData = worldCities[continent][country];
            // Get all cities (excluding metadata)
            const cities = Object.keys(countryData)
                .filter(key => key !== 'metadata');
            
            // Sort cities based on population_order if available, otherwise alphabetically
            let sortedCities;
            if (countryData.population_order) {
                // Create a map for O(1) lookup of population order
                const orderMap = new Map(
                    countryData.population_order.map((city, index) => [city, index])
                );
                
                sortedCities = cities
                    .filter(city => city !== 'population_order')
                    .sort((a, b) => {
                        const orderA = orderMap.has(a) ? orderMap.get(a) : Number.MAX_SAFE_INTEGER;
                        const orderB = orderMap.has(b) ? orderMap.get(b) : Number.MAX_SAFE_INTEGER;
                        if (orderA === orderB) {
                            return a.localeCompare(b); // Alphabetical if same order or both not in population_order
                        }
                        return orderA - orderB;
                    });
            } else {
                sortedCities = cities.sort();
            }
            
            sortedCities.forEach(city => {
                citySelect.append(new Option(city, city));
            });
            
            // Ensure the city dropdown is properly initialized
            citySelect.select2({
                theme: 'classic',
                matcher: matchStart
            });
            
            // Only open the dropdown if this was triggered by a user action
            if (!this.hasAttribute('data-programmatic')) {
                setTimeout(() => {
                    citySelect.select2('open');
                }, 100);
            }
        }
    });

    // Handle city selection
    citySelect.on('change', function() {
        const continent = continentSelect.val();
        const country = countrySelect.val();
        const city = $(this).val();
        
        if (city) {
            updateLocationInfo(continent, country, city);
            // Save complete selection to cookie
            saveLocationToCookie(continent, country, city);
        }
    });

    // Try to load saved location or use default
    // Promise-based functions for setting location programmatically
    function setContinentProgrammatic(continent) {
        return new Promise(resolve => {
            continentSelect.attr('data-programmatic', true)
                .val(continent)
                .trigger('change')
                .removeAttr('data-programmatic');
            setTimeout(resolve, 150); // Allow Select2 to process and populate next dropdown
        });
    }

    function setCountryProgrammatic(country) {
        return new Promise(resolve => {
            countrySelect.attr('data-programmatic', true)
                .val(country)
                .trigger('change')
                .removeAttr('data-programmatic');
            setTimeout(resolve, 150); // Allow Select2 to process
        });
    }

    function setCityProgrammatic(city) {
        // No promise needed if it's the last step, unless other actions depend on it
        citySelect.val(city).trigger('change');
    }

    const savedLocation = getLocationFromCookie();
    if (savedLocation && savedLocation.continent && savedLocation.country && savedLocation.city) {
        setContinentProgrammatic(savedLocation.continent)
            .then(() => setCountryProgrammatic(savedLocation.country))
            .then(() => setCityProgrammatic(savedLocation.city))
            .catch(error => console.error("Error setting saved location:", error));
    } else {
        // Set default selection (New York) programmatically
        setContinentProgrammatic('North America')
            .then(() => setCountryProgrammatic('United States'))
            .then(() => setCityProgrammatic('New York'))
            .catch(error => console.error("Error setting default location:", error));
    }

    // Set local timezone information
    updateLocalTimezoneInfo();
});

function updateLocationInfo(continent, country, city) {
    const countryData = worldCities[continent][country];
    selectedTimezone = countryData[city];
    
    // Update flag
    if (countryToCode && countryToCode[country]) { // Check if countryToCode is defined and has the country
        const countryCode = countryToCode[country].toLowerCase();
        $('#selectedFlag').attr('src', `https://flagcdn.com/${countryCode}.svg`).attr('alt', `Flag of ${country}`);
    } else {
        $('#selectedFlag').attr('src', '').attr('alt', 'Country flag not available'); // Clear flag and set alt text
    }
    
    // Update city info
    $('#cityInfo').text(`${city}, ${country} (${continent})`);
    
    // Update timezone info
    const tzInfo = [];
    if (countryData.metadata?.timezone_notes) {
        tzInfo.push(countryData.metadata.timezone_notes);
    }
    if (timeZoneAnomalies[country]) {
        tzInfo.push(timeZoneAnomalies[country]);
    }
    $('#timezoneInfo').text(tzInfo.join(' | '));
    
    // Update region info
    const adminRegion = administrativeRegions[country]?.[city];
    if (adminRegion) {
        const regionText = [];
        if (adminRegion.state) regionText.push(`State: ${adminRegion.state}`);
        if (adminRegion.region) regionText.push(`Region: ${adminRegion.region}`);
        $('#regionInfo').text(regionText.join(' | '));
    }
    
    // Update population info
    if (countryData.population_order) {
        const rank = countryData.population_order.indexOf(city) + 1;
        const population = administrativeRegions[country]?.[city]?.metro_population;
        const popText = [];
        if (rank > 0) popText.push(`#${rank} largest city`);
        if (population) popText.push(`Population: ${population.toLocaleString()}`);
        $('#populationInfo').text(popText.join(' | '));
    }
    
    // Update special notes
    const specialNotes = [];
    if (countryData.metadata?.special_status) {
        specialNotes.push(countryData.metadata.special_status);
    }
    if (adminRegion?.timezone_details?.notes) {
        specialNotes.push(adminRegion.timezone_details.notes);
    }
    $('#specialNotes').text(specialNotes.join(' | '));
    
    updateClock();
}

function clearLocationInfo() {
    $('#timezoneInfo, #regionInfo, #populationInfo, #specialNotes').empty();
}

function displayRegionInfo(metadata) {
    const notes = [];
    if (metadata.description) notes.push(metadata.description);
    if (metadata.special_notes) notes.push(metadata.special_notes);
    $('#specialNotes').text(notes.join(' | '));
}

function updateClock() {
    const now = new Date();
    updateLocalClock(now);
    updateInternationalClock(now);
}

function updateLocalClock(now) {
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    let displayHours;
    if (is24Hour) {
        displayHours = hours.toString().padStart(2, '0');
        document.getElementById('ampm').style.display = 'none';
    } else {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        displayHours = hours.toString().padStart(2, '0');
        document.getElementById('ampm').style.display = 'inline';
        document.getElementById('ampm').textContent = ampm;
    }
    
    document.getElementById('hours').textContent = displayHours;
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

function updateInternationalClock(now) {
    const options = {
        timeZone: selectedTimezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: !is24Hour
    };
    
    // Get local date parts
    const localYear = now.getFullYear();
    const localMonth = now.getMonth(); // 0-indexed
    const localDay = now.getDate();

    // Get date parts in selected timezone
    const intlDateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTimezone,
        year: 'numeric',
        month: 'numeric', // 1-based
        day: 'numeric',
        hourCycle: 'h23' // Ensures no AM/PM in parts if only date is needed
    });

    let intYear, intMonth, intDay;
    try {
        const parts = intlDateFormatter.formatToParts(now);
        for (const part of parts) {
            if (part.type === 'year') intYear = parseInt(part.value);
            else if (part.type === 'month') intMonth = parseInt(part.value); // 1-based
            else if (part.type === 'day') intDay = parseInt(part.value);
        }
    } catch (e) {
        console.error("Error formatting international date parts with timezone:", selectedTimezone, e);
        // Clear international clock display elements as a fallback
        $('#intHours, #intMinutes, #intSeconds').text('--');
        const intAmpmElem = document.getElementById('intAmpm');
        if (intAmpmElem) $(intAmpmElem).hide();
        const dayDiffElem = document.getElementById('dayDiff');
        if (dayDiffElem) $(dayDiffElem).hide();
        return; // Stop further processing for this clock update
    }
    
    let dayDiff = 0;
    if (typeof intYear !== 'undefined' && typeof intMonth !== 'undefined' && typeof intDay !== 'undefined') {
        // Create Date objects at UTC midnight for accurate day comparison
        const localDateUTC = new Date(Date.UTC(localYear, localMonth, localDay)); 
        const intDateUTC = new Date(Date.UTC(intYear, intMonth - 1, intDay)); // intMonth is 1-based, so subtract 1

        const diffMilliseconds = intDateUTC.getTime() - localDateUTC.getTime();
        dayDiff = Math.round(diffMilliseconds / (1000 * 60 * 60 * 24));
    } else {
        console.error("Could not determine all date parts for international time using timezone:", selectedTimezone);
         // Clear international clock display elements as a fallback
        $('#intHours, #intMinutes, #intSeconds').text('--');
        const intAmpmElem = document.getElementById('intAmpm');
        if (intAmpmElem) $(intAmpmElem).hide();
        const dayDiffElem = document.getElementById('dayDiff');
        if (dayDiffElem) $(dayDiffElem).hide();
        return; // Stop further processing for this clock update
    }

    let timeString;
    try {
        timeString = new Intl.DateTimeFormat('en-US', options).format(now);
    } catch (e) {
        console.error("Error formatting international time string with timezone:", selectedTimezone, e);
        // Clear international clock display elements as a fallback
        $('#intHours, #intMinutes, #intSeconds').text('--');
        const intAmpmElem = document.getElementById('intAmpm');
        if (intAmpmElem) $(intAmpmElem).hide();
        const dayDiffElem = document.getElementById('dayDiff');
        if (dayDiffElem) $(dayDiffElem).hide();
        return; // Stop further processing for this clock update
    }
    const [time, period] = timeString.split(' ');
    const [hours, minutes, seconds] = time.split(':');
    
    document.getElementById('intHours').textContent = hours.padStart(2, '0');
    document.getElementById('intMinutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('intSeconds').textContent = seconds.toString().padStart(2, '0');
    
    if (is24Hour) {
        document.getElementById('intAmpm').style.display = 'none';
    } else {
        document.getElementById('intAmpm').style.display = 'inline';
        document.getElementById('intAmpm').textContent = period;
    }

    // Update day difference indicator
    const dayDiffElement = document.getElementById('dayDiff') || (() => {
        const elem = document.createElement('span');
        elem.id = 'dayDiff';
        elem.style.marginLeft = '0.5rem';
        elem.style.fontSize = '1rem';
        elem.style.verticalAlign = 'super';
        document.querySelector('.clock-container:nth-child(2) .clock').appendChild(elem);
        return elem;
    })();
    
    // Update day difference indicator based on the new dayDiff calculation
    if (dayDiffElement) { // Ensure element exists
        if (dayDiff === 1 || dayDiff > 1) {
            dayDiffElement.textContent = `+${dayDiff}`;
            dayDiffElement.style.display = 'inline';
        } else if (dayDiff === -1 || dayDiff < -1) {
            dayDiffElement.textContent = `${dayDiff}`; 
            dayDiffElement.style.display = 'inline';
        } else { // dayDiff is 0
            dayDiffElement.style.display = 'none';
        }
    }
}

// Toggle button functionality
document.getElementById('formatToggle').addEventListener('click', function() {
    is24Hour = !is24Hour;
    this.textContent = is24Hour ? 'Switch to 12H' : 'Switch to 24H';
    updateClock();
});

// Initial button text setup
document.getElementById('formatToggle').textContent = is24Hour ? 'Switch to 12H' : 'Switch to 24H';

// Update the clock every second
setInterval(updateClock, 1000);

// Initial call to avoid delay
updateClock();

function updateLocalTimezoneInfo() {
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locationData = localTimezoneReverseMap[localTimezone];

    if (locationData) {
        const { city, country, continent } = locationData;
        const locationInfo = `${city}, ${country}`;
        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${locationInfo})`;

        // Show timezone information using data from worldCities
        const countryEntry = worldCities[continent]?.[country];
        const tzInfo = [];
        if (countryEntry?.metadata?.timezone_notes) {
            tzInfo.push(countryEntry.metadata.timezone_notes);
        }
        // Check if timeZoneAnomalies is defined and has the country
        if (typeof timeZoneAnomalies !== 'undefined' && timeZoneAnomalies[country]) {
            tzInfo.push(timeZoneAnomalies[country]);
        }
        document.getElementById('localLocationInfo').textContent = tzInfo.join(' | ');
    } else {
        // If we didn't find a match in our data, just show the timezone
        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${localTimezone})`;
        document.getElementById('localLocationInfo').textContent = 'Local timezone (not in city database)';
    }
}