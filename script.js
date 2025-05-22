let is24Hour = true;
let selectedTimezone = null; 
let localTimezoneReverseMap = {}; 
let currentSelectionPath = []; 

// Helper function to safely access nested properties
function getObjectFromPath(baseObject, pathArray) {
    if (!baseObject || !pathArray) { // Allow empty pathArray to return baseObject
        return baseObject;
    }
    if (pathArray.length === 0) return baseObject;

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
            const parsedObject = JSON.parse(match[1]); 
            // Ensure all levels are decoded, even if they were not present originally
            if (parsedObject.level1) parsedObject.level1 = decodeURIComponent(parsedObject.level1);
            if (parsedObject.level2) parsedObject.level2 = decodeURIComponent(parsedObject.level2);
            if (parsedObject.level3) parsedObject.level3 = decodeURIComponent(parsedObject.level3);
            if (parsedObject.level4) parsedObject.level4 = decodeURIComponent(parsedObject.level4);
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

function buildTimezoneReverseMap() {
    localTimezoneReverseMap = {}; // Reset map
    for (const continentKey in worldCities) {
        if (typeof worldCities[continentKey] !== 'object' || continentKey === 'metadata') continue;
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
        "Select City"              
    ];
    
    const territoryPlaceholders = [
        null, 
        "Select Territory Group",  
        "Select Specific Territory", 
        "Select City"              
    ];


    function matchStart(params, data) {
        if ($.trim(params.term) === '') return data;
        if (typeof data.text === 'undefined') return null;
        if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) return data;
        return null;
    }
    
    function updateSpecificSelect2(selectElement, placeholderText, isDisabled, isVisible = true, optionsToLoad = []) {
        selectElement.prop('disabled', isDisabled);
        selectElement.empty(); // Clear all existing options first
        selectElement.append(new Option(placeholderText, '')); // Add the placeholder option

        if (optionsToLoad && optionsToLoad.length > 0) {
            optionsToLoad.forEach(item => {
                // Ensure item is a string to prevent issues with Option constructor
                const itemName = (typeof item === 'string' || typeof item === 'number') ? item : String(item);
                selectElement.append(new Option(itemName, itemName));
            });
        }
        
        // Set value after options are populated
        const currentValueInPath = currentSelectionPath[dropdowns.indexOf(selectElement)];
        if (currentValueInPath && optionsToLoad.includes(currentValueInPath)) {
            selectElement.val(currentValueInPath);
        } else {
            selectElement.val(''); // Select placeholder
        }
        
        // Destroy previous instance if it exists, before re-initializing
        if (selectElement.hasClass("select2-hidden-accessible")) {
            selectElement.select2('destroy');
        }

        selectElement.select2({
            theme: 'classic',
            matcher: matchStart,
            width: 'style', 
            placeholder: placeholderText,
            allowClear: true
        });
        
        if (selectElement.val() === '') {
             selectElement.trigger('change.select2'); // Notify Select2 to update placeholder display
        }

        const select2Container = selectElement.next('.select2-container');
        if (isVisible) {
            select2Container.show(); 
        } else {
            select2Container.hide();
        }
    }
    
    function updateAllDropdownStates() {
        const pathLength = currentSelectionPath.length;
        const isTerritoryPath = currentSelectionPath[0] === 'Territories';

        dropdowns.forEach((dd, level) => {
            let labelText = defaultPlaceholders[level] || "Select an option";
            let currentPlaceholderText = defaultPlaceholders[level] || "Select an option";
            let isDisabled = true;
            let isVisible = false;
            let optionsToLoad = [];

            if (isTerritoryPath && level > 0 && territoryPlaceholders[level]) {
                labelText = territoryPlaceholders[level];
                currentPlaceholderText = territoryPlaceholders[level];
            }
            if(dropdownLabels[level]) dropdownLabels[level].text(labelText);


            if (level === 0) { // Continent/Region dropdown
                isDisabled = false;
                isVisible = true;
                optionsToLoad = Object.keys(worldCities).filter(k => k !== 'metadata').sort();
            } else { // Subsequent dropdowns
                const parentPathSegment = currentSelectionPath.slice(0, level);
                // Only proceed if the parent in the path is selected
                if (parentPathSegment.length === level && currentSelectionPath[level-1]) {
                    const sourceObject = getObjectFromPath(worldCities, parentPathSegment);
                    if (sourceObject && typeof sourceObject === 'object' && Object.keys(sourceObject).length > 0) {
                        const keys = Object.keys(sourceObject).filter(k => k !== 'metadata' && k !== 'population_order');
                        if (keys.length > 0) {
                            isDisabled = false;
                            isVisible = true;
                            optionsToLoad = keys.sort();
                        }
                    }
                }
                 // If this dropdown is part of an already selected path, ensure it's visible and enabled
                if (level < pathLength) {
                    isVisible = true;
                    isDisabled = false;
                     // Options should have been loaded by previous calls or initial load
                    const sourceForSelected = getObjectFromPath(worldCities, currentSelectionPath.slice(0,level));
                     if (sourceForSelected && typeof sourceForSelected === 'object') {
                        optionsToLoad = Object.keys(sourceForSelected).filter(k => k !== 'metadata' && k !== 'population_order').sort();
                    }
                }
            }
            updateSpecificSelect2(dd, currentPlaceholderText, isDisabled, isVisible, optionsToLoad);
        });
    }
    
    dropdowns.forEach((dropdown, level) => {
        dropdown.on('change', function(event) {
            const selectedValue = $(this).val();
             // Prevent processing if Select2 is clearing the value due to allowClear:true
            if (event.originalEvent && !selectedValue && currentSelectionPath[level] === null) { // Check if originalEvent exists
                return; 
            }

            const isProgrammatic = $(this).data('programmatic-change') === true;

            currentSelectionPath = currentSelectionPath.slice(0, level);
            if (selectedValue) {
                currentSelectionPath.push(selectedValue);
            }

            clearLocationInfo(); 
            updateAllDropdownStates(); 

            const pathIsCompleteForUpdate = (currentSelectionPath.length === 4 && currentSelectionPath[0] === 'Territories') ||
                                 (currentSelectionPath.length === 3 && currentSelectionPath[0] !== 'Territories');
            
            if (pathIsCompleteForUpdate) {
                const tzOrCityObj = getObjectFromPath(worldCities, currentSelectionPath);
                if (typeof tzOrCityObj === 'string') { 
                    if (currentSelectionPath.length === 4) { 
                         updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], currentSelectionPath[3]);
                         saveLocationToCookie(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], currentSelectionPath[3]);
                    } else { 
                         updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2]);
                         saveLocationToCookie(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2]);
                    }
                } else if (currentSelectionPath.length === 3 && currentSelectionPath[0] === 'Territories') {
                     updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], null);
                     saveLocationToCookie(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], null); 
                }
            } else if (currentSelectionPath.length === 3 && currentSelectionPath[0] === 'Territories') {
                updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], null);
                saveLocationToCookie(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], null); 
            } else if (currentSelectionPath.length === 0 && level === 0 && !selectedValue) {
                clearLocationInfo();
                document.cookie = "savedLocation=;max-age=0;path=/"; 
            }

            if (!isProgrammatic && selectedValue) {
                const nextLevel = level + 1;
                if (nextLevel < dropdowns.length && !dropdowns[nextLevel].prop('disabled') && dropdowns[nextLevel].next('.select2-container').is(':visible')) {
                    setTimeout(() => dropdowns[nextLevel].select2('open'), 0);
                }
            }
        });
    });
    
    const savedLocation = getLocationFromCookie();
    if (savedLocation && savedLocation.level1) { 
        currentSelectionPath = [savedLocation.level1];
        if (savedLocation.level2) currentSelectionPath.push(savedLocation.level2);
        if (savedLocation.level3) currentSelectionPath.push(savedLocation.level3);
        if (savedLocation.level4 && savedLocation.level1 === 'Territories') currentSelectionPath.push(savedLocation.level4);
        else if (savedLocation.level1 === 'Territories' && !savedLocation.level4 && currentSelectionPath.length ===3) {
            // Cookie is for a territory up to level 3, no city selected
        } else if (savedLocation.level1 !== 'Territories' && savedLocation.level4){
            // Invalid 4th level for non-territory, truncate path
            currentSelectionPath = currentSelectionPath.slice(0,3); 
        }
    } else {
        currentSelectionPath = ['North America', 'United States', 'New York'];
    }
    
    dropdowns.forEach(dd => dd.data('programmatic-change', true));
    updateAllDropdownStates(); 
    dropdowns.forEach(dd => dd.removeData('programmatic-change'));


    const pathIsCompleteForLoad = (currentSelectionPath.length === 4 && currentSelectionPath[0] === 'Territories') ||
                               (currentSelectionPath.length === 3 && currentSelectionPath[0] !== 'Territories');

    if (pathIsCompleteForLoad) {
        const tz = getObjectFromPath(worldCities, currentSelectionPath);
        if (typeof tz === 'string') { 
            if (currentSelectionPath.length === 4) {
                 updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], currentSelectionPath[3]);
            } else {
                 updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2]);
            }
        } else if (currentSelectionPath.length === 3 && currentSelectionPath[0] === 'Territories') { // Path for specific territory, no city
             updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], null);
        } else { // Path was not valid for a timezone
            clearLocationInfo(); 
            currentSelectionPath = ['North America', 'United States', 'New York']; // Fallback to default
            dropdowns.forEach(dd => dd.data('programmatic-change', true));
            updateAllDropdownStates();
            dropdowns.forEach(dd => dd.removeData('programmatic-change'));
            updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2]);
        }
    } else if (currentSelectionPath.length === 3 && currentSelectionPath[0] === 'Territories') { 
        updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2], null);
    } else if (currentSelectionPath.length > 0 && currentSelectionPath.length < (currentSelectionPath[0] === 'Territories' ? 3:3) ) { // Incomplete path
        clearLocationInfo();
    } else if (currentSelectionPath.length === 0) { 
        clearLocationInfo();
    } else { // Default or other invalid path from cookie
        clearLocationInfo(); 
        currentSelectionPath = ['North America', 'United States', 'New York']; 
        dropdowns.forEach(dd => dd.data('programmatic-change', true));
        updateAllDropdownStates();
        dropdowns.forEach(dd => dd.removeData('programmatic-change'));
        updateLocationInfo(currentSelectionPath[0], currentSelectionPath[1], currentSelectionPath[2]);
    }
    
    updateLocalTimezoneInfo();
    updateClock(); // Initial clock update after everything is set
});

function updateLocationInfo(level1, level2, level3, level4 = null) {
    let cityForDisplay, countryForDisplay, continentForDisplay;
    let metadataSource;
    let anomalyLookupKey;
    let populationOrderSource;
    let populationCityKey;
    let flagCountryName;

    selectedTimezone = null; // Reset before setting

    if (level1 === 'Territories') {
        if (!level2 || !level3) { clearLocationInfo(); return; }
        continentForDisplay = level1; 
        countryForDisplay = level2;   // Group
        cityForDisplay = level3;      // Specific Territory
        
        const territoryDataObject = getObjectFromPath(worldCities, [level1, level2, level3]);

        metadataSource = territoryDataObject ? territoryDataObject.metadata : null;
        anomalyLookupKey = level3; 
        populationOrderSource = territoryDataObject;
        populationCityKey = level4; 

        if (level4) { 
            selectedTimezone = getObjectFromPath(worldCities, [level1, level2, level3, level4]);
            cityForDisplay = level4; // Actual city
            $('#cityInfo').text(`${cityForDisplay}, ${level3} (${level2})`);
        } else { 
            // Only territory selected, no city yet
            $('#cityInfo').text(`${level3} (${level2})`); 
        }
        // Try to find a country code for flag: specific territory, then group
        flagCountryName = countryToCode[level3] ? level3 : (countryToCode[level2] ? level2 : null);

    } else { 
        if (!level1 || !level2 || !level3) { clearLocationInfo(); return; }
        continentForDisplay = level1;
        countryForDisplay = level2;
        cityForDisplay = level3;

        selectedTimezone = getObjectFromPath(worldCities, [level1, level2, level3]);
        const countryDataObject = getObjectFromPath(worldCities, [level1, level2]);
        metadataSource = countryDataObject ? countryDataObject.metadata : null;
        anomalyLookupKey = level2; 
        populationOrderSource = countryDataObject;
        populationCityKey = level3;
        flagCountryName = level2;
        $('#cityInfo').text(`${cityForDisplay}, ${countryForDisplay} (${continentForDisplay})`);
    }
    
    // This condition checks if a final selection was expected to yield a timezone, but didn't.
    const finalSelectionMade = (level1 === 'Territories' && level4) || (level1 !== 'Territories' && level3);
    if (finalSelectionMade && !selectedTimezone) {
        const attemptedPath = level4 ? [level1,level2,level3,level4].join('->') : [level1,level2,level3].join('->');
        console.warn("Timezone data not found for path:", attemptedPath);
        const currentCityInfo = $('#cityInfo').text();
        if (currentCityInfo) { 
            $('#cityInfo').text(currentCityInfo + ' - Timezone data unavailable');
        } else { 
             $('#cityInfo').text('Timezone data unavailable');
        }
        $('#timezoneInfo').empty();
    }
    
    if (flagCountryName && countryToCode && countryToCode[flagCountryName]) {
        const countryCode = countryToCode[flagCountryName].toLowerCase();
        $('#selectedFlag').attr('src', `https://flagcdn.com/${countryCode}.svg`).attr('alt', `Flag of ${flagCountryName}`).show();
    } else {
        $('#selectedFlag').attr('src', '').attr('alt', 'Flag not available').hide();
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
    const adminCityKey = (level1 === 'Territories') ? level4 : level3; 
    const adminRegion = (typeof administrativeRegions !== 'undefined' && administrativeRegions[adminEntityKey] && adminCityKey) ? administrativeRegions[adminEntityKey][adminCityKey] : null;
    
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
    $('#selectedFlag').attr('src', '').attr('alt', 'Flag').hide();
    selectedTimezone = null; 
    updateClock(); 
}

function displayRegionInfo(metadata) { 
    // This function is called when a continent is selected.
    // It should ideally display general information about the continent/region.
    // Appending to #timezoneInfo might not be the best place if it's already used for city-specific timezone notes.
    // For now, let's ensure it doesn't break anything or add too much clutter.
    // Consider a dedicated div for regional info if this feature is to be prominent.
    const notes = [];
    if (metadata?.description) notes.push(metadata.description);
    if (metadata?.special_notes) notes.push(metadata.special_notes);
    
    // If we have a dedicated element for region-wide notes, update it here.
    // For now, let's log it or add it to a less critical spot to avoid UI issues.
    // Example: $('#regionWideInfo').text(notes.join(' | '));
    // Or, if #specialNotes should be used for this when no city is selected:
    if (currentSelectionPath.length === 1 && notes.length > 0) { // Only continent selected
        $('#specialNotes').text("Regional Info: " + notes.join(' | '));
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
        $('#ampm').hide(); // Use jQuery hide for consistency
    } else {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        displayHours = hours.toString().padStart(2, '0');
        $('#ampm').text(ampm).show(); // Use jQuery show/text
    }
    
    $('#hours').text(displayHours);
    $('#minutes').text(minutes.toString().padStart(2, '0'));
    $('#seconds').text(seconds.toString().padStart(2, '0'));
}

function updateInternationalClock(now) {
    if (!selectedTimezone) { 
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
            year: 'numeric', month: 'numeric', day: 'numeric',   
            hourCycle: 'h23' 
        });
        const parts = intlDateFormatter.formatToParts(now);
        for (const part of parts) {
            if (part.type === 'year') intYear = parseInt(part.value);
            else if (part.type === 'month') intMonth = parseInt(part.value); 
            else if (part.type === 'day') intDay = parseInt(part.value);
        }
    } catch (e) {
        console.error(`Error formatting date parts for timezone "${selectedTimezone}":`, e);
        $('#intHours, #intMinutes, #intSeconds').text('--');
        $('#intAmpm, #dayDiff').hide();
        return; 
    }
    
    let dayDiff = 0;
    if (typeof intYear === 'number' && typeof intMonth === 'number' && typeof intDay === 'number') {
        const localDateUTC = new Date(Date.UTC(localYear, localMonth, localDay));
        const intDateUTC = new Date(Date.UTC(intYear, intMonth - 1, intDay)); 
        const diffMilliseconds = intDateUTC.getTime() - localDateUTC.getTime();
        dayDiff = Math.round(diffMilliseconds / (1000 * 60 * 60 * 24));
    } else {
        console.error(`Could not determine date parts for timezone "${selectedTimezone}".`);
        $('#intHours, #intMinutes, #intSeconds').text('--');
        $('#intAmpm, #dayDiff').hide();
         return; 
    }

    let timeString;
    try {
        timeString = new Intl.DateTimeFormat('en-US', options).format(now);
    } catch (e) {
        console.error(`Error formatting time string for timezone "${selectedTimezone}":`, e);
        $('#intHours, #intMinutes, #intSeconds').text('--');
        $('#intAmpm, #dayDiff').hide();
        return; 
    }

    const timeParts = timeString.match(/(\d+):(\d+):(\d+)(?:\s+(AM|PM))?/);
    if (!timeParts) {
        console.error("Could not parse formatted time string:", timeString);
        $('#intHours, #intMinutes, #intSeconds').text('--');
        $('#intAmpm, #dayDiff').hide();
        return;
    }

    const hours = timeParts[1];
    const minutes = timeParts[2];
    const seconds = timeParts[3];
    const period = timeParts[4] || null; 
    
    $('#intHours').text(hours.padStart(2, '0')).show();
    $('#intMinutes').text(minutes.padStart(2, '0')).show(); 
    $('#intSeconds').text(seconds.padStart(2, '0')).show(); 
    
    if (is24Hour || !period) {
        $('#intAmpm').hide();
    } else {
        $('#intAmpm').text(period).show();
    }

    let dayDiffElement = document.getElementById('dayDiff');
    if (!dayDiffElement) {
        const clockDiv = document.querySelector('.clock-container:nth-child(2) .clock');
        if (clockDiv) {
            dayDiffElement = document.createElement('span');
            dayDiffElement.id = 'dayDiff';
            dayDiffElement.style.marginLeft = '0.5rem';
            dayDiffElement.style.fontSize = '1rem';
            dayDiffElement.style.verticalAlign = 'super';
            dayDiffElement.setAttribute('aria-live', 'polite'); 
            clockDiv.appendChild(dayDiffElement);
        }
    }
    
    if (dayDiffElement) { 
        if (dayDiff > 0) {
            dayDiffElement.textContent = `+${dayDiff}`; $(dayDiffElement).show();
        } else if (dayDiff < 0) {
            dayDiffElement.textContent = String(dayDiff); $(dayDiffElement).show();
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
// updateClock(); // Initial call done after location is set in $(document).ready()

function updateLocalTimezoneInfo() {
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locationData = localTimezoneReverseMap[localTimezone];

    if (locationData) {
        let locationInfoText;
        let pathForMetadata; 
        let anomalyKey;

        if (locationData.continent === 'Territories') {
            locationInfoText = `${locationData.city}, ${locationData.territory} (${locationData.group})`;
            pathForMetadata = [locationData.continent, locationData.group, locationData.territory, 'metadata'];
            anomalyKey = locationData.territory;
        } else {
            locationInfoText = `${locationData.city}, ${locationData.country} (${locationData.continent})`;
            pathForMetadata = [locationData.continent, locationData.country, 'metadata'];
            anomalyKey = locationData.country;
        }
        document.querySelector('.clock-container:first-child h2').textContent = `Local Time (${locationInfoText})`;

        const tzInfo = [];
        const metadataSource = getObjectFromPath(worldCities, pathForMetadata);

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