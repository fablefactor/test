let is24Hour = true;
let selectedTimezone = null; // Initialize to null
let localTimezoneReverseMap = {}; // For optimized local timezone lookup
let currentSelectionPath = []; // Stores the current selection path, e.g., ['Continent', 'Country', 'City'] or ['Territories', 'Group', 'Territory', 'City']

// Simple cookie functions
function saveLocationToCookie(level1, level2, level3, level4 = null) {
    const locationObject = {
        level1: encodeURIComponent(level1),
        level2: encodeURIComponent(level2),
        level3: encodeURIComponent(level3),
    };
    if (level4) {
        locationObject.level4 = encodeURIComponent(level4);
    }
    const locationString = JSON.stringify(locationObject);
    const cookieAttributes = `max-age=31536000;path=/;SameSite=Lax${window.isSecureContext ? ';Secure' : ''}`;
    document.cookie = `savedLocation=${locationString};${cookieAttributes}`;
}

function getLocationFromCookie() {
    const match = document.cookie.match(/savedLocation=([^;]+)/);
    if (match && match[1]) {
        try {
            const parsedObject = JSON.parse(match[1]); // Cookie stores JSON of pre-encoded values
            parsedObject.level1 = decodeURIComponent(parsedObject.level1);
            parsedObject.level2 = decodeURIComponent(parsedObject.level2);
            parsedObject.level3 = decodeURIComponent(parsedObject.level3);
            if (parsedObject.level4) {
                parsedObject.level4 = decodeURIComponent(parsedObject.level4);
            }
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
    for (const continentKey in worldCities) {
        if (typeof worldCities[continentKey] !== 'object') continue;

        if (continentKey === 'Territories') {
            for (const groupKey in worldCities.Territories) {
                if (typeof worldCities.Territories[groupKey] !== 'object' || groupKey === 'metadata') continue;
                for (const territoryKey in worldCities.Territories[groupKey]) {
                    if (typeof worldCities.Territories[groupKey][territoryKey] !== 'object' || territoryKey === 'metadata') continue;
                    for (const cityKey in worldCities.Territories[groupKey][territoryKey]) {
                        if (cityKey !== 'population_order' && cityKey !== 'metadata') {
                            const timezone = worldCities.Territories[groupKey][territoryKey][cityKey];
                            if (timezone && typeof timezone === 'string') {
                                if (!localTimezoneReverseMap[timezone]) {
                                    localTimezoneReverseMap[timezone] = { 
                                        city: cityKey, 
                                        territory: territoryKey, // level3 for territories path
                                        group: groupKey,       // level2 for territories path
                                        continent: continentKey // level1 ('Territories')
                                    };
                                }
                            }
                        }
                    }
                }
            }
        } else { // Regular continents
            for (const countryKey in worldCities[continentKey]) {
                if (countryKey === 'metadata' || countryKey === 'population_order' || typeof worldCities[continentKey][countryKey] !== 'object') continue;
                for (const cityKey in worldCities[continentKey][countryKey]) {
                    if (cityKey !== 'population_order' && cityKey !== 'metadata') {
                        const timezone = worldCities[continentKey][countryKey][cityKey];
                        if (timezone && typeof timezone === 'string') {
                            if (!localTimezoneReverseMap[timezone]) {
                                localTimezoneReverseMap[timezone] = { 
                                    city: cityKey, 
                                    country: countryKey,  // level2 for regular path
                                    continent: continentKey // level1 for regular path
                                };
                            }
                        }
                    }
                }
            }
        }
    }
}


// Initialize select2 dropdowns
$(document).ready(function() {
    buildTimezoneReverseMap();

    const continentSelect = $('#continentSelect'); // Level 1
    const countrySelect = $('#countrySelect');     // Level 2: Country or Territory Group
    const citySelect = $('#citySelect');         // Level 3: City or Specific Territory
    const territoryCitySelect = $('#territoryCitySelect'); // Level 4: City within a Specific Territory

    // Custom matcher function that only matches from the start of the text
    function matchStart(params, data) {
        if ($.trim(params.term) === '') return data;
        if (typeof data.text === 'undefined') return null;
        if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) return data;
        return null;
    }
    
    // Helper to update Select2 placeholder and reinitialize if needed
    function updateSelect2Dropdown(selectElement, placeholderText, isDisabled, isVisible = true) {
        selectElement.prop('disabled', isDisabled);
        
        const firstOption = selectElement.find('option:first-child');
        if (firstOption.length > 0 && firstOption.val() === '') {
            firstOption.text(placeholderText);
        } else {
            // Prepend placeholder if not exists or structure changed
            selectElement.find('option[value=""]').remove(); // Remove old placeholder
            selectElement.prepend(new Option(placeholderText, ''));
            selectElement.val(''); // Select the new placeholder
        }
        
        // Reinitialize Select2 with new placeholder
        selectElement.select2({
            theme: 'classic',
            matcher: matchStart,
            width: '180px',
            placeholder: placeholderText,
            allowClear: true
        });

        if (isVisible) {
            selectElement.parent().show(); // Show the select2 container
        } else {
            selectElement.parent().hide();
        }
    }
    
    // Helper to update dropdown state (labels, placeholders, visibility, enabled/disabled)
    function updateDropdownState(level1Value, level2Value = null, level3Value = null) {
        // Default labels
        $('label[for="countrySelect"]').text('Select Country');
        $('label[for="citySelect"]').text('Select City');
        $('label[for="territoryCitySelect"]').text('Select City');

        if (level1Value === 'Territories') {
            $('label[for="countrySelect"]').text('Select Territory Group');
            updateSelect2Dropdown(countrySelect, 'Select Territory Group', false);

            if (level2Value) {
                $('label[for="citySelect"]').text('Select Specific Territory');
                updateSelect2Dropdown(citySelect, 'Select Specific Territory', false);
            } else {
                updateSelect2Dropdown(citySelect, 'Select Specific Territory', true, false); // Disabled, hidden
            }

            if (level3Value) {
                $('label[for="territoryCitySelect"]').text('Select City');
                updateSelect2Dropdown(territoryCitySelect, 'Select City', false);
            } else {
                updateSelect2Dropdown(territoryCitySelect, 'Select City', true, false); // Disabled, hidden
            }
        } else { // Regular Continent
            updateSelect2Dropdown(countrySelect, 'Select Country', !level1Value);
            
            if (level1Value) { // Continent selected
                updateSelect2Dropdown(citySelect, 'Select City', !level2Value);
            } else { // No continent selected
                updateSelect2Dropdown(citySelect, 'Select City', true, false); // Disabled, hidden
            }
            updateSelect2Dropdown(territoryCitySelect, 'Select City', true, false); // Always disabled & hidden for regular continents
        }
    }

    // Initialize all selects with Select2
    [continentSelect, countrySelect, citySelect, territoryCitySelect].forEach(select => {
        const labelElement = $(`label[for="${select.attr('id')}"]`);
        let placeholderText = 'Select an option'; // Default
        if (labelElement.length) { // Try to get placeholder from label text
             placeholderText = labelElement.text().replace('Select ', 'Select '); // Keep "Select " prefix
        } else if (select.find('option[value=""]').length) { // Or from current placeholder option
            placeholderText = select.find('option[value=""]').text();
        }
        
        select.select2({
            theme: 'classic',
            matcher: matchStart,
            width: '180px',
            placeholder: placeholderText,
            allowClear: true
        });
    });
    updateDropdownState(null); // Set initial state for all dropdowns

    // Populate continents (Level 1)
    Object.keys(worldCities)
        .filter(key => key !== 'metadata') // Ensure metadata isn't treated as a continent
        .sort()
        .forEach(continent => {
            continentSelect.append(new Option(continent, continent));
        });

    // Handle continent selection (Level 1)
    continentSelect.on('change', function() {
        const continent = $(this).val();
        currentSelectionPath = continent ? [continent] : [];
        clearLocationInfo();

        countrySelect.empty().append(new Option('', '')).trigger('change.select2');
        citySelect.empty().append(new Option('', '')).trigger('change.select2');
        territoryCitySelect.empty().append(new Option('', '')).trigger('change.select2');
        
        updateDropdownState(continent);

        if (continent) {
            const source = (continent === 'Territories') ? worldCities.Territories : worldCities[continent];
            Object.keys(source)
                .filter(key => key !== 'metadata' && key !== 'population_order')
                .sort()
                .forEach(item => countrySelect.append(new Option(item, item)));
            
            if (!$(this).data('programmatic-change')) {
                 setTimeout(() => countrySelect.select2('open'), 0);
            }
        }
        countrySelect.trigger('change'); // Reset level 2 and cascade
    });

    // Handle country/territory group selection (Level 2)
    countrySelect.on('change', function() {
        const selectedLevel1 = continentSelect.val();
        const selectedLevel2 = $(this).val();
        
        currentSelectionPath = selectedLevel1 ? [selectedLevel1] : [];
        if (selectedLevel2) currentSelectionPath.push(selectedLevel2); else currentSelectionPath.splice(1);
        clearLocationInfo();

        citySelect.empty().append(new Option('', '')).trigger('change.select2');
        territoryCitySelect.empty().append(new Option('', '')).trigger('change.select2');
        updateDropdownState(selectedLevel1, selectedLevel2);
        
        if (selectedLevel2) {
            const source = (selectedLevel1 === 'Territories') ? 
                worldCities.Territories[selectedLevel2] : 
                worldCities[selectedLevel1][selectedLevel2];
            
            Object.keys(source)
                .filter(key => key !== 'metadata' && key !== 'population_order')
                .sort()
                .forEach(item => citySelect.append(new Option(item, item)));

            if (!$(this).data('programmatic-change')) {
                setTimeout(() => citySelect.select2('open'), 0);
            }
        }
        citySelect.trigger('change'); // Reset level 3 and cascade
    });

    // Handle city/specific territory selection (Level 3)
    citySelect.on('change', function() {
        const selectedLevel1 = continentSelect.val();
        const selectedLevel2 = countrySelect.val();
        const selectedLevel3 = $(this).val();

        currentSelectionPath = (selectedLevel1 && selectedLevel2) ? [selectedLevel1, selectedLevel2] : [];
        if (selectedLevel3) currentSelectionPath.push(selectedLevel3); else currentSelectionPath.splice(2);
        clearLocationInfo();
        
        territoryCitySelect.empty().append(new Option('', '')).trigger('change.select2');
        updateDropdownState(selectedLevel1, selectedLevel2, selectedLevel3);

        if (selectedLevel3) {
            if (selectedLevel1 === 'Territories') {
                const source = worldCities.Territories[selectedLevel2][selectedLevel3];
                Object.keys(source)
                    .filter(key => key !== 'metadata' && key !== 'population_order')
                    .sort()
                    .forEach(city => territoryCitySelect.append(new Option(city, city)));
                
                if (!$(this).data('programmatic-change')) {
                     setTimeout(() => territoryCitySelect.select2('open'), 0);
                }
            } else { // Regular Continent -> City selected
                updateLocationInfo(selectedLevel1, selectedLevel2, selectedLevel3);
                saveLocationToCookie(selectedLevel1, selectedLevel2, selectedLevel3);
            }
        }
        territoryCitySelect.trigger('change'); // Reset level 4 if applicable
    });

    // Handle Territory City selection (Level 4)
    territoryCitySelect.on('change', function() {
        const selectedCity = $(this).val();
        
        currentSelectionPath = (currentSelectionPath.length > 2 && currentSelectionPath[0] === 'Territories') ? 
                               currentSelectionPath.slice(0, 3) : // Keep first 3 elements
                               []; 
        if (selectedCity) currentSelectionPath.push(selectedCity); else currentSelectionPath.splice(3);
        clearLocationInfo();

        if (selectedCity && currentSelectionPath.length === 4 && currentSelectionPath[0] === 'Territories') {
            updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], selectedCity);
            saveLocationToCookie(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], selectedCity);
        }
    });
    
    // --- Programmatic Location Setting ---
    function setDropdownProgrammatic(selectElement, value) {
        return new Promise((resolve, reject) => {
            // Check if the option exists. If not, it might be from an old cookie or data change.
            if (selectElement.find(`option[value="${value}"]`).length === 0) {
                 // Add the option temporarily if it's missing, common for dynamic dropdowns
                // This is a workaround; ideally data should be consistent or cookie migration handled.
                // console.warn(`Option "${value}" not found in dropdown #${selectElement.attr('id')}, attempting to add.`);
                // selectElement.append(new Option(value, value)); // This might not be desired if value is invalid
            }
            selectElement.data('programmatic-change', true);
            selectElement.val(value).trigger('change'); // This will trigger dependent dropdown population
            selectElement.removeData('programmatic-change');
            
            // Wait for dependent dropdowns to potentially populate
            setTimeout(() => {
                 // Verify selection after change, as Select2 might reset if value is invalid post-reinitialization
                if (selectElement.val() !== value && selectElement.find(`option[value="${value}"]`).length > 0) {
                    // Re-apply if Select2 reset it (can happen if options were not ready)
                    // console.log(`Re-applying value "${value}" to #${selectElement.attr('id')}`);
                    selectElement.data('programmatic-change', true);
                    selectElement.val(value).trigger('change');
                    selectElement.removeData('programmatic-change');
                     setTimeout(resolve, 200); // Second timeout after re-apply
                } else if (selectElement.val() !== value) {
                     console.warn(`Failed to set value "${value}" on #${selectElement.attr('id')}. Value after attempt: ${selectElement.val()}`);
                     reject(new Error(`Failed to set value "${value}" on #${selectElement.attr('id')}`));
                }
                else {
                    resolve();
                }
            }, 250); // Increased for stability, esp. for chained programmatic changes
        });
    }

    const savedLocation = getLocationFromCookie();
    if (savedLocation && savedLocation.level1 && savedLocation.level2 && savedLocation.level3) {
        setDropdownProgrammatic(continentSelect, savedLocation.level1)
            .then(() => setDropdownProgrammatic(countrySelect, savedLocation.level2))
            .then(() => setDropdownProgrammatic(citySelect, savedLocation.level3))
            .then(() => {
                if (savedLocation.level1 === 'Territories' && savedLocation.level4) {
                    // Ensure the fourth dropdown is visible if we're setting its value.
                    territoryCitySelect.parent().show(); 
                    return setDropdownProgrammatic(territoryCitySelect, savedLocation.level4);
                }
            })
            .catch(error => {
                console.error("Error setting saved location, falling back to default:", error);
                // Fallback to default if setting saved location fails by resetting and calling default.
                continentSelect.val(null).trigger('change'); 
                updateDropdownState(null); // This should hide unnecessary dropdowns
                setDefaultNewYork();
            });
    } else {
        setDefaultNewYork();
    }
    
    function setDefaultNewYork() {
        setDropdownProgrammatic(continentSelect, 'North America')
            .then(() => setDropdownProgrammatic(countrySelect, 'United States'))
            .then(() => setDropdownProgrammatic(citySelect, 'New York'))
            .catch(error => console.error("Error setting default (New York) location:", error));
    }
    
    // Initial UI setup based on current selections (should be empty or default after load)
    // updateDropdownState(continentSelect.val(), countrySelect.val(), citySelect.val());
    // Done within the load logic now.

    // Set local timezone information
    updateLocalTimezoneInfo();
});

// level1: Continent or 'Territories'
// level2: Country or Territory Group
// level3: City (if regular path) or Specific Territory
// level4: City (if territory path), null otherwise
function updateLocationInfo(level1, level2, level3, level4 = null) {
    let cityForDisplay, countryForDisplay, continentForDisplay;
    let pathForTimezoneData; // This will be the object that holds the timezone string OR city objects
    let finalCityForTimezone = level4; // If territory path
    let metadataSource;
    let anomalyLookupKey;
    let populationOrderSource;
    let populationCityKey;

    if (level1 === 'Territories') {
        if (!level2 || !level3) { // Not enough info for specific territory
            clearLocationInfo(); return;
        }
        continentForDisplay = level1; // "Territories"
        countryForDisplay = level2;   // e.g., "French Territories" (Group)
        cityForDisplay = level3;      // e.g., "French Polynesia" (Specific Territory)
        
        pathForTimezoneData = worldCities[level1]?.[level2]?.[level3];
        metadataSource = pathForTimezoneData?.metadata;
        anomalyLookupKey = level3; // Use specific territory for anomaly
        populationOrderSource = pathForTimezoneData;
        populationCityKey = level4; // City within the territory

        if (level4) { // City selected within territory
            selectedTimezone = pathForTimezoneData?.[level4];
            cityForDisplay = level4; // Actual city name
            // countryForDisplay remains specific territory, continentForDisplay remains group
            // For display: City, Specific Territory (Territory Group)
            $('#cityInfo').text(`${cityForDisplay}, ${level3} (${level2})`);
        } else { // Only specific territory selected, no city yet
            selectedTimezone = null; // No specific city timezone
            $('#cityInfo').text(`${level3} (${level2})`); // Display Specific Territory (Group)
        }
        flagCountryName = countryToCode[level3] ? level3 : (countryToCode[level2] ? level2 : null);


    } else { // Regular Continent -> Country -> City path
        if (!level1 || !level2 || !level3) { // Not enough info
            clearLocationInfo(); return;
        }
        continentForDisplay = level1;
        countryForDisplay = level2;
        cityForDisplay = level3;
        finalCityForTimezone = level3;

        pathForTimezoneData = worldCities[level1]?.[level2];
        selectedTimezone = pathForTimezoneData?.[level3];
        metadataSource = pathForTimezoneData?.metadata;
        anomalyLookupKey = level2; // Country
        populationOrderSource = pathForTimezoneData;
        populationCityKey = level3;
        flagCountryName = level2;
        $('#cityInfo').text(`${cityForDisplay}, ${countryForDisplay} (${continentForDisplay})`);
    }

    if (!selectedTimezone && level4 === null && level1 !== 'Territories') { // If it's not a territory and no city, clear
         clearLocationInfo(); return;
    }
     if (level1 === 'Territories' && !level4) { // If territory path but no final city, still show some info but no clock
        // updateClock will handle null selectedTimezone
    } else if (!selectedTimezone) {
        console.error("Timezone not found for path:", level1, level2, level3, level4);
        $('#cityInfo').append(' - Timezone data not available');
        // Keep flag and other info if available, but clear timezone specific parts
        $('#timezoneInfo').empty();
        updateClock(); // Will clear international clock
        return;
    }


    // Update flag
    if (flagCountryName && countryToCode && countryToCode[flagCountryName]) {
        const countryCode = countryToCode[flagCountryName].toLowerCase();
        $('#selectedFlag').attr('src', `https://flagcdn.com/${countryCode}.svg`).attr('alt', `Flag of ${flagCountryName}`);
    } else {
        $('#selectedFlag').attr('src', '').attr('alt', 'Flag not available');
    }
    
    const tzInfo = [];
    if (metadataSource?.timezone_notes) {
        tzInfo.push(metadataSource.timezone_notes);
    }
    if (typeof timeZoneAnomalies !== 'undefined' && timeZoneAnomalies[anomalyLookupKey]) {
        tzInfo.push(timeZoneAnomalies[anomalyLookupKey]);
    }
    $('#timezoneInfo').text(tzInfo.join(' | '));
    
    const adminEntityKey = (level1 === 'Territories') ? level3 : level2; // Key for administrativeRegions (e.g., 'France' or 'French Polynesia')
    const adminCityKey = populationCityKey; // The actual city name for population/admin details
    const adminRegion = (typeof administrativeRegions !== 'undefined' && administrativeRegions[adminEntityKey]) ? administrativeRegions[adminEntityKey][adminCityKey] : null;
    
    $('#regionInfo').empty(); 
    if (adminRegion) {
        const regionText = [];
        if (adminRegion.state) regionText.push(`State: ${adminRegion.state}`);
        if (adminRegion.province) regionText.push(`Province: ${adminRegion.province}`);
        if (adminRegion.region) regionText.push(`Region: ${adminRegion.region}`);
        $('#regionInfo').text(regionText.join(' | '));
    }
    
    $('#populationInfo').empty();
    if (populationOrderSource?.population_order && adminCityKey) { // Ensure adminCityKey is defined
        const rank = populationOrderSource.population_order.indexOf(adminCityKey) + 1;
        const population = adminRegion?.metro_population;
        const popText = [];
        if (rank > 0) popText.push(`#${rank} largest city`);
        if (population) popText.push(`Population: ${population.toLocaleString()}`);
        $('#populationInfo').text(popText.join(' | '));
    }
    
    $('#specialNotes').empty(); 
    const specialNotesList = [];
    if (metadataSource?.special_status) {
        specialNotesList.push(metadataSource.special_status);
    }
    if (adminRegion?.timezone_details?.notes) {
        specialNotesList.push(adminRegion.timezone_details.notes);
    }
    $('#specialNotes').text(specialNotesList.join(' | '));
    
    updateClock();
}


function clearLocationInfo() {
    $('#timezoneInfo, #regionInfo, #populationInfo, #specialNotes, #cityInfo').empty();
    $('#selectedFlag').attr('src', '').attr('alt', 'Flag');
    selectedTimezone = null; 
    // currentSelectionPath is managed by dropdown handlers, not fully reset here
    // to allow partial selections to persist if a higher level changes.
    updateClock(); // Clear international clock if timezone is now null
}

// This function seems to be for continent-level metadata, adjust if needed
function displayRegionInfo(metadata) { 
    const notes = [];
    if (metadata.description) notes.push(metadata.description);
    if (metadata.special_notes) notes.push(metadata.special_notes);
    // This should ideally go to a dedicated region info display area, not #specialNotes or #timezoneInfo
    // For now, clearing #specialNotes and setting it with this regional info if present.
    if (notes.length > 0) {
        $('#specialNotes').text("Regional Info: " + notes.join(' | '));
    } else {
        $('#specialNotes').empty();
    }
}

function updateClock() {
    const now = new Date();
    updateLocalClock(now);
    if (selectedTimezone) { 
        updateInternationalClock(now);
    } else {
        $('#intHours, #intMinutes, #intSeconds').text('--');
        const intAmpmElem = document.getElementById('intAmpm');
        if (intAmpmElem) $(intAmpmElem).hide();
        const dayDiffElem = document.getElementById('dayDiff');
        if (dayDiffElem) $(dayDiffElem).hide();
    }
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
    if (!selectedTimezone) { 
        $('#intHours, #intMinutes, #intSeconds').text('--');
        $('#intAmpm, #dayDiff').hide();
        return;
    }
    const options = {
        timeZone: selectedTimezone, 
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: !is24Hour
    };
    
    const localYear = now.getFullYear();
    const localMonth = now.getMonth(); 
    const localDay = now.getDate();

    let intYear, intMonth, intDay;
    try {
        const intlDateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: selectedTimezone,
            year: 'numeric',
            month: 'numeric', 
            day: 'numeric',   
            hourCycle: 'h23' 
        });
        const parts = intlDateFormatter.formatToParts(now);
        for (const part of parts) {
            if (part.type === 'year') intYear = parseInt(part.value);
            else if (part.type === 'month') intMonth = parseInt(part.value); 
            else if (part.type === 'day') intDay = parseInt(part.value);
        }
    } catch (e) {
        console.error("Error formatting international date parts with timezone:", selectedTimezone, e);
        $('#intHours, #intMinutes, #intSeconds').text('--');
        const intAmpmElem = document.getElementById('intAmpm');
        if (intAmpmElem) $(intAmpmElem).hide();
        const dayDiffElem = document.getElementById('dayDiff');
        if (dayDiffElem) $(dayDiffElem).hide();
        return; 
    }
    
    let dayDiff = 0;
    if (typeof intYear !== 'undefined' && typeof intMonth !== 'undefined' && typeof intDay !== 'undefined') {
        const localDateUTC = new Date(Date.UTC(localYear, localMonth, localDay));
        const intDateUTC = new Date(Date.UTC(intYear, intMonth - 1, intDay)); 

        const diffMilliseconds = intDateUTC.getTime() - localDateUTC.getTime();
        dayDiff = Math.round(diffMilliseconds / (1000 * 60 * 60 * 24));
    } else {
        console.error("Could not determine all date parts for international time using timezone:", selectedTimezone);
        $('#intHours, #intMinutes, #intSeconds').text('--');
        const intAmpmElem = document.getElementById('intAmpm');
        if (intAmpmElem) $(intAmpmElem).hide();
        const dayDiffElem = document.getElementById('dayDiff');
        if (dayDiffElem) $(dayDiffElem).hide();
         return; 
    }

    let timeString;
    try {
        timeString = new Intl.DateTimeFormat('en-US', options).format(now);
    } catch (e) {
        console.error("Error formatting international time string with timezone:", selectedTimezone, e);
        $('#intHours, #intMinutes, #intSeconds').text('--');
        const intAmpmElem = document.getElementById('intAmpm');
        if (intAmpmElem) $(intAmpmElem).hide();
        const dayDiffElem = document.getElementById('dayDiff');
        if (dayDiffElem) $(dayDiffElem).hide();
        return; 
    }

    const [time, period] = timeString.split(' ');
    const [hours, minutes, seconds] = time.split(':');
    
    $('#intHours').text(hours.padStart(2, '0')).show();
    $('#intMinutes').text(minutes.toString().padStart(2, '0')).show();
    $('#intSeconds').text(seconds.toString().padStart(2, '0')).show();
    
    const intAmpmElem = document.getElementById('intAmpm');
    if (is24Hour) {
        if(intAmpmElem) $(intAmpmElem).hide();
    } else {
        if(intAmpmElem) $(intAmpmElem).text(period).show();
    }

    const dayDiffElement = document.getElementById('dayDiff') || (() => {
        const elem = document.createElement('span');
        elem.id = 'dayDiff';
        elem.style.marginLeft = '0.5rem';
        elem.style.fontSize = '1rem';
        elem.style.verticalAlign = 'super';
        elem.setAttribute('aria-live', 'polite'); 
        const clockDiv = document.querySelector('.clock-container:nth-child(2) .clock');
        if (clockDiv) clockDiv.appendChild(elem);
        return elem;
    })();
    
    if (dayDiffElement) { 
        if (dayDiff === 1 || dayDiff > 1) {
            dayDiffElement.textContent = `+${dayDiff}`;
            $(dayDiffElement).show();
        } else if (dayDiff === -1 || dayDiff < -1) {
            dayDiffElement.textContent = `${dayDiff}`; 
            $(dayDiffElement).show();
        } else { 
            $(dayDiffElement).hide();
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
        let locationInfoText;
        let continentForDataLookup, groupOrCountryForDataLookup, territoryOrCityForDataLookup; // Keys for accessing worldCities
        let anomalyLookupKey;

        if (locationData.continent === 'Territories') {
            locationInfoText = `${locationData.city}, ${locationData.territory} (${locationData.group})`;
            continentForDataLookup = locationData.continent;    // 'Territories'
            groupOrCountryForDataLookup = locationData.group;   // e.g., 'French Territories'
            territoryOrCityForDataLookup = locationData.territory; // e.g., 'French Polynesia'
            anomalyLookupKey = locationData.territory; // Use specific territory for anomaly lookup
        } else {
            locationInfoText = `${locationData.city}, ${locationData.country} (${locationData.continent})`;
            continentForDataLookup = locationData.continent;
            groupOrCountryForDataLookup = locationData.country;
            territoryOrCityForDataLookup = locationData.city; // Not directly used for metadata path here
            anomalyLookupKey = locationData.country;
        }
        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${locationInfoText})`;

        const tzInfo = [];
        let metadataSource;

        if (locationData.continent === 'Territories') {
            // Metadata for territories is usually at the specific territory level
            metadataSource = worldCities[continentForDataLookup]?.[groupOrCountryForDataLookup]?.[territoryOrCityForDataLookup]?.metadata;
        } else {
            // Metadata for regular countries is at the country level
            metadataSource = worldCities[continentForDataLookup]?.[groupOrCountryForDataLookup]?.metadata;
        }

        if (metadataSource?.timezone_notes) {
            tzInfo.push(metadataSource.timezone_notes);
        }
        if (typeof timeZoneAnomalies !== 'undefined' && timeZoneAnomalies[anomalyLookupKey]) {
            tzInfo.push(timeZoneAnomalies[anomalyLookupKey]);
        }
        document.getElementById('localLocationInfo').textContent = tzInfo.join(' | ');

    } else {
        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${localTimezone})`;
        document.getElementById('localLocationInfo').textContent = 'Local timezone (not in city database)';
    }
}