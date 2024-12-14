let is24Hour = true;
let selectedTimezone = 'America/New_York';

// Simple cookie functions
function saveLocationToCookie(continent, country, city) {
    const location = JSON.stringify({ continent, country, city });
    document.cookie = `savedLocation=${location};max-age=31536000;path=/`; // 1 year
}

function getLocationFromCookie() {
    const match = document.cookie.match(/savedLocation=([^;]+)/);
    if (match) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Get user's local timezone
const userLocation = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

// Initialize select2 dropdowns
$(document).ready(function() {
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
            matcher: matchStart
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
    const savedLocation = getLocationFromCookie();
    if (savedLocation) {
        // Set saved location programmatically
        continentSelect.attr('data-programmatic', true)
            .val(savedLocation.continent)
            .trigger('change')
            .removeAttr('data-programmatic');
            
        setTimeout(() => {
            countrySelect.attr('data-programmatic', true)
                .val(savedLocation.country)
                .trigger('change')
                .removeAttr('data-programmatic');
                
            setTimeout(() => {
                citySelect.val(savedLocation.city).trigger('change');
            }, 500);
        }, 500);
    } else {
        // Set default selection (New York) programmatically
        continentSelect.attr('data-programmatic', true)
            .val('North America')
            .trigger('change')
            .removeAttr('data-programmatic');
            
        setTimeout(() => {
            countrySelect.attr('data-programmatic', true)
                .val('United States')
                .trigger('change')
                .removeAttr('data-programmatic');
                
            setTimeout(() => {
                citySelect.val('New York').trigger('change');
            }, 500);
        }, 500);
    }

    // Set local timezone information
    updateLocalTimezoneInfo();
});

function updateLocationInfo(continent, country, city) {
    const countryData = worldCities[continent][country];
    selectedTimezone = countryData[city];
    
    // Update flag
    const countryCode = countryToCode[country].toLowerCase();
    $('#selectedFlag').attr('src', `https://flagcdn.com/${countryCode}.svg`);
    
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
    
    // Get local date
    const localDate = now.getDate();
    
    // Get date in selected timezone
    const intDate = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone })).getDate();
    
    // Calculate day difference
    const dayDiff = intDate - localDate;
    
    const timeString = new Intl.DateTimeFormat('en-US', options).format(now);
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
    
    if (dayDiff === 1) {
        dayDiffElement.textContent = '+1';
        dayDiffElement.style.display = 'inline';
    } else if (dayDiff === -1) {
        dayDiffElement.textContent = '−1';  // Using proper minus sign
        dayDiffElement.style.display = 'inline';
    } else {
        dayDiffElement.style.display = 'none';
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
    let locationInfo = '';

    // Find the continent/country/city from our data that matches this timezone
    for (const continent in worldCities) {
        for (const country in worldCities[continent]) {
            for (const city in worldCities[continent][country]) {
                if (city !== 'population_order' && city !== 'metadata') {
                    if (worldCities[continent][country][city] === localTimezone) {
                        locationInfo = `${city}, ${country}`;
                        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${locationInfo})`;
                        
                        // Show timezone information
                        const countryData = worldCities[continent][country];
                        const tzInfo = [];
                        if (countryData.metadata?.timezone_notes) {
                            tzInfo.push(countryData.metadata.timezone_notes);
                        }
                        if (timeZoneAnomalies[country]) {
                            tzInfo.push(timeZoneAnomalies[country]);
                        }
                        document.getElementById('localLocationInfo').textContent = tzInfo.join(' | ');
                        return;
                    }
                }
            }
        }
    }

    // If we didn't find a match in our data, just show the timezone
    if (!locationInfo) {
        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${localTimezone})`;
        document.getElementById('localLocationInfo').textContent = 'Local timezone';
    }
}
  