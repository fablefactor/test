let is24Hour = true;
let selectedTimezone = null; 
let localTimezoneReverseMap = {}; 
let currentSelectionPath = []; 

// Helper function to safely access nested properties
function getObjectFromPath(baseObject, pathArray) {
    if (!baseObject || !pathArray || pathArray.length === 0) {
        return null;
    }
    let current = baseObject;
    for (const key of pathArray) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return null; 
        }
    }
    return current;
}

// Simple cookie functions (remains the same)
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
            const parsedObject = JSON.parse(match[1]); 
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

const userLocation = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

// buildTimezoneReverseMap remains the same
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
                                        territory: territoryKey, 
                                        group: groupKey,       
                                        continent: continentKey 
                                    };
                                }
                            }
                        }
                    }
                }
            }
        } else { 
            for (const countryKey in worldCities[continentKey]) {
                if (countryKey === 'metadata' || countryKey === 'population_order' || typeof worldCities[continentKey][countryKey] !== 'object') continue;
                for (const cityKey in worldCities[continentKey][countryKey]) {
                    if (cityKey !== 'population_order' && cityKey !== 'metadata') {
                        const timezone = worldCities[continentKey][countryKey][cityKey];
                        if (timezone && typeof timezone === 'string') {
                            if (!localTimezoneReverseMap[timezone]) {
                                localTimezoneReverseMap[timezone] = { 
                                    city: cityKey, 
                                    country: countryKey,  
                                    continent: continentKey 
                                };
                            }
                        }
                    }
                }
            }
        }
    }
}

$(document).ready(function() {
    buildTimezoneReverseMap();

    const dropdowns = [
        $('#continentSelect'),    // Level 0
        $('#countrySelect'),      // Level 1
        $('#citySelect'),         // Level 2
        $('#territoryCitySelect') // Level 3
    ];

    const dropdownLabels = [
        $('label[for="continentSelect"]'),
        $('label[for="countrySelect"]'),
        $('label[for="citySelect"]'),
        $('label[for="territoryCitySelect"]')
    ];

    const defaultPlaceholders = [
        "Select Continent/Region",
        "Select Country",
        "Select City",
        "Select City" // For territory cities
    ];

    function matchStart(params, data) {
        if ($.trim(params.term) === '') return data;
        if (typeof data.text === 'undefined') return null;
        if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) return data;
        return null;
    }
    
    function updateSpecificSelect2(selectElement, placeholderText, isDisabled, isVisible = true) {
        selectElement.prop('disabled', isDisabled);
        
        selectElement.find('option[value=""]').remove(); 
        selectElement.prepend(new Option(placeholderText, ''));
        if (!isDisabled && selectElement.val() === '') selectElement.val(''); 
        else if (isDisabled) selectElement.val(null);
        
        selectElement.select2({
            theme: 'classic',
            matcher: matchStart,
            width: 'style', 
            placeholder: placeholderText,
            allowClear: true
        });
         if (selectElement.val() === '') { // Ensure placeholder is shown
             selectElement.trigger('change.select2');
        }

        const parentContainer = selectElement.parent().hasClass('select2-custom-container') ? selectElement.parent() : selectElement.next('.select2-container');
        if (isVisible) {
            parentContainer.show(); 
        } else {
            parentContainer.hide();
        }
    }
    
    function updateAllDropdownStates() {
        const pathLength = currentSelectionPath.length;
        const isTerritoryPath = currentSelectionPath[0] === 'Territories';

        dropdowns.forEach((dd, level) => {
            let labelText = defaultPlaceholders[level];
            let placeholderText = defaultPlaceholders[level];
            let isDisabled = true;
            let isVisible = false;
            let optionsToLoad = null;

            // Determine labels and placeholders based on path
            if (isTerritoryPath) {
                if (level === 1) { labelText = "Select Territory Group"; placeholderText = "Select Territory Group"; }
                if (level === 2) { labelText = "Select Specific Territory"; placeholderText = "Select Specific Territory"; }
                if (level === 3) { labelText = "Select City"; placeholderText = "Select City"; }
            }
            dropdownLabels[level].text(labelText);

            if (level < pathLength) { // This dropdown has a selection in currentPath
                isDisabled = false;
                isVisible = true;
            } else if (level === pathLength) { // This is the next dropdown to populate
                const sourceObject = getObjectFromPath(worldCities, currentSelectionPath);
                if (sourceObject && typeof sourceObject === 'object') {
                    const keys = Object.keys(sourceObject).filter(k => k !== 'metadata' && k !== 'population_order');
                    if (keys.length > 0) {
                        isDisabled = false;
                        isVisible = true;
                        optionsToLoad = keys.sort(); // Basic sort, specific sort handled by handlers if needed
                    }
                }
            }
            // For levels > pathLength, they remain disabled and hidden by default

            dd.empty().append(new Option('', '')); // Clear and add placeholder option
            if (optionsToLoad) {
                optionsToLoad.forEach(item => dd.append(new Option(item, item)));
            }
            // Restore selected value if it's part of the current path
            if (level < pathLength) {
                dd.val(currentSelectionPath[level]);
            } else {
                dd.val(''); // Ensure it's reset if no longer part of path or no options
            }
            updateSpecificSelect2(dd, placeholderText, isDisabled, isVisible);
        });
    }
    
    // Initialize all dropdowns
    dropdowns.forEach((dd, index) => {
        const placeholder = defaultPlaceholders[index];
        dd.select2({ theme: 'classic', matcher: matchStart, width: 'style', placeholder: placeholder, allowClear: true });
    });
    updateAllDropdownStates(); // Set initial state

    // Populate Level 0 (Continents)
    Object.keys(worldCities)
        .filter(key => key !== 'metadata') 
        .sort()
        .forEach(continent => dropdowns[0].append(new Option(continent, continent)));

    // Generic Event Handler Setup
    dropdowns.forEach((dropdown, level) => {
        dropdown.on('change', function() {
            const selectedValue = $(this).val();
            
            // Update currentSelectionPath
            currentSelectionPath = currentSelectionPath.slice(0, level);
            if (selectedValue) {
                currentSelectionPath.push(selectedValue);
            }

            clearLocationInfo(); // Clear info panels before potentially updating

            // Update states of all subsequent dropdowns
            updateAllDropdownStates(); 

            // Check if this selection completes a path to a timezone
            const isTerritoryFinalCity = currentSelectionPath.length === 4 && currentSelectionPath[0] === 'Territories';
            const isStandardFinalCity = currentSelectionPath.length === 3 && currentSelectionPath[0] !== 'Territories';
            
            if (isTerritoryFinalCity) {
                updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], currentSelectionPath[3]);
                saveLocationToCookie(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], currentSelectionPath[3]);
            } else if (isStandardFinalCity) {
                const timezone = getObjectFromPath(worldCities, currentSelectionPath);
                if (typeof timezone === 'string') { // It's a timezone string, so path is complete
                    updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2]);
                    saveLocationToCookie(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2]);
                } else if (currentSelectionPath[0] === 'Territories' && currentSelectionPath.length === 3) {
                    // A specific territory is selected, but not a city yet. Update info partially.
                    updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], null);
                }
            } else if (currentSelectionPath.length === 0) { // All cleared
                 clearLocationInfo();
            }


            // Open next dropdown if applicable
            if (!$(this).data('programmatic-change') && selectedValue) {
                const nextLevel = level + 1;
                if (nextLevel < dropdowns.length && !dropdowns[nextLevel].prop('disabled') && dropdowns[nextLevel].parent().is(':visible')) {
                    setTimeout(() => dropdowns[nextLevel].select2('open'), 0);
                }
            }
        });
    });
    
    function setDropdownProgrammatic(selectElement, value) {
        return new Promise((resolve, reject) => {
            selectElement.data('programmatic-change', true);
            if (selectElement.find(`option[value="${value}"]`).length === 0) {
                 console.warn(`Option "${value}" not found in dropdown #${selectElement.attr('id')}. Attempting to add.`);
                 // This behavior of adding option might be problematic if value is truly invalid.
                 // selectElement.append(new Option(value, value)); 
                 // For now, let's rely on subsequent updateAllDropdownStates to clear if path is invalid
            }
            
            selectElement.val(value).trigger('change'); 
            
            // Value might be reset by 'change' if options are not yet populated for it.
            // The 'change' handler now calls updateAllDropdownStates, which should repopulate and set value.
            
            setTimeout(() => {
                if (selectElement.val() !== value && selectElement.find(`option[value="${value}"]`).length > 0) {
                    // If it was reset by a fast cascade, try setting it again now that options should be there
                    // console.log(`Re-setting ${selectElement.attr('id')} to ${value} after timeout`);
                    selectElement.val(value).trigger('change.select2'); // Just update Select2 display
                } else if (selectElement.val() !== value) {
                     console.warn(`Failed to definitively set value "${value}" on #${selectElement.attr('id')}. Current: ${selectElement.val()}`);
                     // Not rejecting, as the path might still be valid up to a point.
                }
                selectElement.removeData('programmatic-change');
                resolve();
            }, 300); // Increased timeout for stability
        });
    }

    const savedLocation = getLocationFromCookie();
    if (savedLocation && savedLocation.level1) { // Basic check for a saved location
        currentSelectionPath = [savedLocation.level1];
        if (savedLocation.level2) currentSelectionPath.push(savedLocation.level2);
        if (savedLocation.level3) currentSelectionPath.push(savedLocation.level3);
        if (savedLocation.level4 && savedLocation.level1 === 'Territories') currentSelectionPath.push(savedLocation.level4);
        
        updateAllDropdownStates(); // This will populate and set values based on currentSelectionPath

        // Final update for location info based on the fully restored path
        if (currentSelectionPath.length === 4 && currentSelectionPath[0] === 'Territories') {
            updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], currentSelectionPath[3]);
        } else if (currentSelectionPath.length === 3 && currentSelectionPath[0] !== 'Territories') {
             const tz = getObjectFromPath(worldCities, currentSelectionPath);
             if(typeof tz === 'string') {
                updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2]);
             }
        } else if (currentSelectionPath.length === 3 && currentSelectionPath[0] === 'Territories') {
             updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], null);
        }


    } else {
        // Default to New York
        currentSelectionPath = ['North America', 'United States', 'New York'];
        updateAllDropdownStates();
        updateLocationInfo('North America', 'United States', 'New York');
    }
    
    updateLocalTimezoneInfo();
});

// updateLocationInfo, clearLocationInfo, displayRegionInfo, updateClock, etc. remain largely the same
// but updateLocationInfo is now more robust with getObjectFromPath
function updateLocationInfo(level1, level2, level3, level4 = null) {
    let cityForDisplay, countryForDisplay, continentForDisplay;
    let finalCityForTimezone = level4; 
    let metadataSource;
    let anomalyLookupKey;
    let populationOrderSource;
    let populationCityKey;
    let flagCountryName;

    if (level1 === 'Territories') {
        if (!level2 || !level3) { clearLocationInfo(); return; }
        continentForDisplay = level1; 
        countryForDisplay = level2;   
        cityForDisplay = level3;      
        
        const territoryDataObject = getObjectFromPath(worldCities, [level1, level2, level3]);

        metadataSource = territoryDataObject ? territoryDataObject.metadata : null;
        anomalyLookupKey = level3; 
        populationOrderSource = territoryDataObject;
        populationCityKey = level4; 

        if (level4) { 
            selectedTimezone = getObjectFromPath(worldCities, [level1, level2, level3, level4]);
            cityForDisplay = level4; 
            $('#cityInfo').text(`${cityForDisplay}, ${level3} (${level2})`);
        } else { 
            selectedTimezone = null; 
            $('#cityInfo').text(`${level3} (${level2})`); 
        }
        flagCountryName = countryToCode[level3] ? level3 : (countryToCode[level2] ? level2 : null);

    } else { 
        if (!level1 || !level2 || !level3) { clearLocationInfo(); return; }
        continentForDisplay = level1;
        countryForDisplay = level2;
        cityForDisplay = level3;
        // finalCityForTimezone = level3; // Not needed, selectedTimezone is direct

        selectedTimezone = getObjectFromPath(worldCities, [level1, level2, level3]);
        const countryDataObject = getObjectFromPath(worldCities, [level1, level2]);
        metadataSource = countryDataObject ? countryDataObject.metadata : null;
        anomalyLookupKey = level2; 
        populationOrderSource = countryDataObject;
        populationCityKey = level3;
        flagCountryName = level2;
        $('#cityInfo').text(`${cityForDisplay}, ${countryForDisplay} (${continentForDisplay})`);
    }

    if ((level1 === 'Territories' && level4 && !selectedTimezone) || 
        (level1 !== 'Territories' && level3 && !selectedTimezone)) { // Check level3 for non-territory paths
        console.warn("Timezone data not found for the complete path:", level1, level2, level3, level4);
        $('#cityInfo').append(' - Timezone data unavailable');
        $('#timezoneInfo').empty();
        selectedTimezone = null; 
    }
    
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
    
    const adminEntityKey = (level1 === 'Territories') ? level3 : level2; 
    const adminCityKey = (level1 === 'Territories') ? level4 : level3; // Corrected key for admin region city
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
    if (populationOrderSource?.population_order && adminCityKey) { 
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
    updateClock(); 
}

function displayRegionInfo(metadata) { 
    const notes = [];
    if (metadata.description) notes.push(metadata.description);
    if (metadata.special_notes) notes.push(metadata.special_notes);
    const currentTzInfo = $('#timezoneInfo').text();
    const regionalNotesString = notes.join(' | ');
    if (regionalNotesString) {
         // Avoid appending multiple times if this is called without clearing tzInfo
        if (!currentTzInfo.includes(regionalNotesString)) {
             $('#timezoneInfo').text(currentTzInfo ? `${currentTzInfo} | Regional: ${regionalNotesString}` : `Regional: ${regionalNotesString}`);
        }
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

document.getElementById('formatToggle').addEventListener('click', function() {
    is24Hour = !is24Hour;
    this.textContent = is24Hour ? 'Switch to 12H' : 'Switch to 24H';
    updateClock();
});

document.getElementById('formatToggle').textContent = is24Hour ? 'Switch to 12H' : 'Switch to 24H';

setInterval(updateClock, 1000);
updateClock();

function updateLocalTimezoneInfo() {
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locationData = localTimezoneReverseMap[localTimezone];

    if (locationData) {
        let locationInfoText;
        let pathForMetadata;

        if (locationData.continent === 'Territories') {
            locationInfoText = `${locationData.city}, ${locationData.territory} (${locationData.group})`;
            pathForMetadata = [locationData.continent, locationData.group, locationData.territory, 'metadata'];
        } else {
            locationInfoText = `${locationData.city}, ${locationData.country} (${locationData.continent})`;
            pathForMetadata = [locationData.continent, locationData.country, 'metadata'];
        }
        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${locationInfoText})`;

        const tzInfo = [];
        const metadataSource = getObjectFromPath(worldCities, pathForMetadata);

        if (metadataSource?.timezone_notes) {
            tzInfo.push(metadataSource.timezone_notes);
        }
        
        const anomalyKey = locationData.territory || locationData.country; // Use territory for territories, country otherwise
        if (typeof timeZoneAnomalies !== 'undefined' && timeZoneAnomalies[anomalyKey]) {
            tzInfo.push(timeZoneAnomalies[anomalyKey]);
        }
        document.getElementById('localLocationInfo').textContent = tzInfo.join(' | ');

    } else {
        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${localTimezone})`;
        document.getElementById('localLocationInfo').textContent = 'Local timezone (not in city database)';
    }
}