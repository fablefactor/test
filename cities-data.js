// Schema and data version information
const CITIES_DATA_VERSION = '2.0.0';
const LAST_UPDATED = '2024-01-20';
const DATA_SOURCES = {
    'timezone': 'IANA Time Zone Database 2024a',
    'population': 'UN World Population Prospects 2024',
    'geographical': 'ISO 3166-1 alpha-2 codes'
};

// Data validation schema
const cityDataSchema = {
    type: 'object',
    required: ['name', 'timezone', 'coordinates'],
    properties: {
        name: {
            type: 'string',
            description: 'Official city name in English'
        },
        timezone: {
            type: 'string',
            pattern: '^[A-Za-z]+/[A-Za-z_]+$',
            description: 'IANA timezone identifier'
        },
        coordinates: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
                latitude: { type: 'number', minimum: -90, maximum: 90 },
                longitude: { type: 'number', minimum: -180, maximum: 180 }
            }
        },
        population: {
            type: 'object',
            required: ['total', 'year'],
            properties: {
                total: { type: 'number', minimum: 0 },
                urban: { type: 'number', minimum: 0 },
                metro: { type: 'number', minimum: 0 },
                year: { type: 'number', minimum: 1900 }
            }
        },
        languages: {
            type: 'object',
            required: ['official'],
            properties: {
                official: { type: 'array', items: { type: 'string' } },
                regional: { type: 'array', items: { type: 'string' } }
            }
        }
    }
};

const territorySchema = {
    type: 'object',
    required: ['type', 'status'],
    properties: {
        type: {
            type: 'string',
            enum: [
                'sovereign_state',
                'autonomous_region',
                'overseas_territory',
                'special_administrative_region',
                'disputed_territory'
            ]
        },
        status: {
            type: 'object',
            required: ['current'],
            properties: {
                current: { type: 'string' },
                since: { type: 'number' },
                valid_until: { type: 'number' },
                future_status: { type: 'string' }
            }
        },
        sovereignty: {
            type: 'object',
            properties: {
                state: { type: 'string' },
                agreement: { type: 'string' },
                year_established: { type: 'number' }
            }
        }
    }
};

// Timezone management system
const timezoneManagement = {
    // Standard timezone groups
    groups: {
        'UTC': {
            base_offset: 0,
            description: 'Coordinated Universal Time',
            uses_dst: false
        },
        'GMT': {
            base_offset: 0,
            description: 'Greenwich Mean Time',
            uses_dst: false,
            equivalent_to: 'UTC'
        },
        'CET': {
            base_offset: 1,
            description: 'Central European Time',
            uses_dst: true,
            dst_name: 'CEST',
            dst_offset: 2
        },
        'EET': {
            base_offset: 2,
            description: 'Eastern European Time',
            uses_dst: true,
            dst_name: 'EEST',
            dst_offset: 3
        }
    },

    // DST rules by region
    dst_rules: {
        'EU': {
            start: 'Last Sunday March 02:00 UTC',
            end: 'Last Sunday October 03:00 UTC',
            participating_regions: ['CET', 'EET']
        },
        'US': {
            start: 'Second Sunday March 02:00 Local',
            end: 'First Sunday November 02:00 Local',
            participating_regions: ['EST', 'CST', 'MST', 'PST']
        },
        'None': {
            description: 'Regions that do not observe DST',
            examples: ['Iceland', 'Russia', 'China']
        }
    },

    // Special cases and anomalies
    special_cases: {
        'Half_Hour_Offset': {
            regions: ['India', 'Sri Lanka', 'Afghanistan', 'Iran', 'Myanmar'],
            description: 'Countries using 30-minute offset from standard time'
        },
        'Quarter_Hour_Offset': {
            regions: ['Nepal'],
            description: 'Countries using 15-minute offset from standard time'
        },
        'Split_Timezone': {
            countries: {
                'Russia': {
                    count: 11,
                    spans: 'UTC+2 to UTC+12'
                },
                'USA': {
                    count: 6,
                    spans: 'UTC-10 to UTC-4'
                },
                'France': {
                    count: 12,
                    note: 'Including overseas territories'
                }
            }
        }
    },

    // Historical changes tracking
    historical_changes: {
        'Russia': [
            {
                year: 2014,
                change: 'Abolished DST, moved to permanent winter time',
                affected_regions: 'All'
            }
        ],
        'Turkey': [
            {
                year: 2016,
                change: 'Abolished DST, moved to permanent summer time',
                affected_regions: 'All'
            }
        ]
    },

    // Timezone validation rules
    validation: {
        patterns: {
            iana: '^[A-Za-z]+/[A-Za-z_]+$',
            offset: '^UTC[+-]\\d{1,2}(:30|:45)?$'
        },
        rules: {
            max_offset: 14,
            min_offset: -12,
            requires_region: true,
            allows_military: false
        }
    }
};

// Timezone data organized by continents and regions
const worldCities = {
    'Africa': {
        'Algeria': {
            'Algiers': 'Africa/Algiers',
            'Oran': 'Africa/Algiers',
            'Constantine': 'Africa/Algiers',
            population_order: ['Algiers', 'Oran', 'Constantine'],
            metadata: {
                largest_city: 'Algiers',
                timezone_notes: 'CET (Central European Time)'
            }
        },
        'Egypt': {
            'Cairo': 'Africa/Cairo',
            'Alexandria': 'Africa/Cairo',
            'Giza': 'Africa/Cairo',
            'Luxor': 'Africa/Cairo',
            'Aswan': 'Africa/Cairo',
            population_order: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan'],
            metadata: {
                largest_city: 'Cairo',
                timezone_notes: 'EET (Eastern European Time)',
                population: {
                    'Cairo': 20_900_000 // Metropolitan area
                }
            }
        },
        'South Africa': {
            'Johannesburg': 'Africa/Johannesburg',
            'Cape Town': 'Africa/Johannesburg',
            'Durban': 'Africa/Johannesburg',
            'Pretoria': 'Africa/Johannesburg',
            'Port Elizabeth': 'Africa/Johannesburg',
            'Bloemfontein': 'Africa/Johannesburg',
            population_order: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
            metadata: {
                largest_city: 'Johannesburg',
                timezone_notes: 'SAST (South African Standard Time)',
                multiple_capitals: {
                    executive: 'Pretoria',
                    legislative: 'Cape Town',
                    judicial: 'Bloemfontein'
                }
            }
        },
        'Nigeria': {
            'Lagos': 'Africa/Lagos',
            'Kano': 'Africa/Lagos',
            'Ibadan': 'Africa/Lagos',
            'Abuja': 'Africa/Lagos',
            'Port Harcourt': 'Africa/Lagos',
            population_order: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt'],
            metadata: {
                largest_city: 'Lagos',
                timezone_notes: 'WAT (West Africa Time)'
            }
        },
        'Kenya': {
            'Nairobi': 'Africa/Nairobi',
            'Mombasa': 'Africa/Nairobi',
            'Kisumu': 'Africa/Nairobi',
            'Nakuru': 'Africa/Nairobi',
            population_order: ['Nairobi', 'Mombasa', 'Kisumu'],
            metadata: {
                largest_city: 'Nairobi',
                timezone_notes: 'EAT (East African Time)',
                special_status: 'Regional financial hub'
            }
        },
        'Morocco': {
            'Casablanca': 'Africa/Casablanca',
            'Rabat': 'Africa/Casablanca',
            'Fez': 'Africa/Casablanca',
            'Marrakesh': 'Africa/Casablanca',
            'Tangier': 'Africa/Casablanca',
            population_order: ['Casablanca', 'Rabat', 'Fez'],
            metadata: {
                largest_city: 'Casablanca',
                timezone_notes: 'WET/WEST (Western European Time)',
                special_status: 'Observes daylight saving time'
            }
        },
        'Ethiopia': {
            'Addis Ababa': 'Africa/Addis_Ababa',
            'Dire Dawa': 'Africa/Addis_Ababa',
            'Mek\'ele': 'Africa/Addis_Ababa',
            'Gondar': 'Africa/Addis_Ababa',
            'Bahir Dar': 'Africa/Addis_Ababa',
            population_order: ['Addis Ababa', 'Dire Dawa', 'Mek\'ele', 'Gondar', 'Bahir Dar'],
            metadata: {
                largest_city: 'Addis Ababa',
                timezone_notes: 'EAT (Eastern Africa Time)',
                special_status: 'Diplomatic capital of Africa (AU headquarters)'
            }
        },
        'Ghana': {
            'Accra': 'Africa/Accra',
            'Kumasi': 'Africa/Accra',
            'Tamale': 'Africa/Accra',
            'Sekondi-Takoradi': 'Africa/Accra',
            'Cape Coast': 'Africa/Accra',
            population_order: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Cape Coast'],
            metadata: {
                largest_city: 'Accra',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Major West African financial hub'
            }
        },
        'Tanzania': {
            'Dar es Salaam': 'Africa/Dar_es_Salaam',
            'Dodoma': 'Africa/Dar_es_Salaam',
            'Mwanza': 'Africa/Dar_es_Salaam',
            'Zanzibar City': 'Africa/Dar_es_Salaam',
            'Arusha': 'Africa/Dar_es_Salaam',
            population_order: ['Dar es Salaam', 'Mwanza', 'Dodoma', 'Zanzibar City', 'Arusha'],
            metadata: {
                largest_city: 'Dar es Salaam',
                timezone_notes: 'EAT (Eastern Africa Time)',
                special_status: 'Includes semi-autonomous Zanzibar'
            }
        },
        'Sudan': {
            'Khartoum': 'Africa/Khartoum',
            'Omdurman': 'Africa/Khartoum',
            'Port Sudan': 'Africa/Khartoum',
            'Kassala': 'Africa/Khartoum',
            population_order: ['Omdurman', 'Khartoum', 'Port Sudan'],
            metadata: {
                largest_city: 'Omdurman',
                timezone_notes: 'CAT (Central Africa Time)',
                special_status: 'Largest country in Africa'
            }
        },
        'Angola': {
            'Luanda': 'Africa/Luanda',
            'Huambo': 'Africa/Luanda',
            'Lobito': 'Africa/Luanda',
            'Benguela': 'Africa/Luanda',
            'Namibe': 'Africa/Luanda',
            population_order: ['Luanda', 'Huambo', 'Lobito'],
            metadata: {
                largest_city: 'Luanda',
                timezone_notes: 'WAT (West Africa Time)',
                special_status: 'Major oil producer'
            }
        },
        'Tunisia': {
            'Tunis': 'Africa/Tunis',
            'Sfax': 'Africa/Tunis',
            'Sousse': 'Africa/Tunis',
            'Kairouan': 'Africa/Tunis',
            population_order: ['Tunis', 'Sfax', 'Sousse'],
            metadata: {
                largest_city: 'Tunis',
                timezone_notes: 'CET/CEST',
                special_status: 'Northernmost point in Africa'
            }
        },
        'Libya': {
            'Tripoli': 'Africa/Tripoli',
            'Benghazi': 'Africa/Tripoli',
            'Misrata': 'Africa/Tripoli',
            'Sirte': 'Africa/Tripoli',
            population_order: ['Tripoli', 'Benghazi', 'Misrata'],
            metadata: {
                largest_city: 'Tripoli',
                timezone_notes: 'EET (Eastern European Time)',
                special_status: 'Largest oil reserves in Africa'
            }
        },
        'Senegal': {
            'Dakar': 'Africa/Dakar',
            'Touba': 'Africa/Dakar',
            'Thiès': 'Africa/Dakar',
            'Saint-Louis': 'Africa/Dakar',
            population_order: ['Dakar', 'Touba', 'Thiès'],
            metadata: {
                largest_city: 'Dakar',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Westernmost point of mainland Africa'
            }
        },
        'Côte d\'Ivoire': {
            'Abidjan': 'Africa/Abidjan',
            'Bouaké': 'Africa/Abidjan',
            'Yamoussoukro': 'Africa/Abidjan',
            'Korhogo': 'Africa/Abidjan',
            population_order: ['Abidjan', 'Bouaké', 'Yamoussoukro'],
            metadata: {
                largest_city: 'Abidjan',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Different economic and political capitals'
            }
        },
        'Mali': {
            'Bamako': 'Africa/Bamako',
            'Sikasso': 'Africa/Bamako',
            'Mopti': 'Africa/Bamako',
            'Gao': 'Africa/Bamako',
            population_order: ['Bamako', 'Sikasso', 'Mopti'],
            metadata: {
                largest_city: 'Bamako',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Home to ancient city of Timbuktu'
            }
        },
        'Burkina Faso': {
            'Ouagadougou': 'Africa/Ouagadougou',
            'Bobo-Dioulasso': 'Africa/Ouagadougou',
            'Koudougou': 'Africa/Ouagadougou',
            population_order: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou'],
            metadata: {
                largest_city: 'Ouagadougou',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Former Upper Volta'
            }
        },
        'Niger': {
            'Niamey': 'Africa/Niamey',
            'Zinder': 'Africa/Niamey',
            'Maradi': 'Africa/Niamey',
            'Agadez': 'Africa/Niamey',
            population_order: ['Niamey', 'Zinder', 'Maradi'],
            metadata: {
                largest_city: 'Niamey',
                timezone_notes: 'WAT (West Africa Time)',
                special_status: 'Largest country in West Africa'
            }
        },
        'Chad': {
            'N\'Djamena': 'Africa/Ndjamena',
            'Moundou': 'Africa/Ndjamena',
            'Sarh': 'Africa/Ndjamena',
            'Abéché': 'Africa/Ndjamena',
            population_order: ['N\'Djamena', 'Moundou', 'Sarh'],
            metadata: {
                largest_city: 'N\'Djamena',
                timezone_notes: 'WAT (West Africa Time)',
                special_status: 'Geographic center of Africa'
            }
        },
        'Cameroon': {
            'Douala': 'Africa/Douala',
            'Yaoundé': 'Africa/Douala',
            'Garoua': 'Africa/Douala',
            'Bamenda': 'Africa/Douala',
            population_order: ['Douala', 'Yaoundé', 'Garoua'],
            metadata: {
                largest_city: 'Douala',
                timezone_notes: 'WAT (West Africa Time)',
                special_status: 'Different economic and political capitals'
            }
        },
        'Central African Republic': {
            'Bangui': 'Africa/Bangui',
            'Bimbo': 'Africa/Bangui',
            'Berbérati': 'Africa/Bangui',
            'Carnot': 'Africa/Bangui',
            population_order: ['Bangui', 'Bimbo', 'Berbérati'],
            metadata: {
                largest_city: 'Bangui',
                timezone_notes: 'WAT (West Africa Time)',
                special_status: 'Geographic heart of Africa'
            }
        },
        'South Sudan': {
            'Juba': 'Africa/Juba',
            'Wau': 'Africa/Juba',
            'Malakal': 'Africa/Juba',
            population_order: ['Juba', 'Wau', 'Malakal'],
            metadata: {
                largest_city: 'Juba',
                timezone_notes: 'EAT (East Africa Time)',
                special_status: 'World\'s newest internationally recognized country (2011)'
            }
        },
        'Uganda': {
            'Kampala': 'Africa/Kampala',
            'Gulu': 'Africa/Kampala',
            'Mbarara': 'Africa/Kampala',
            'Jinja': 'Africa/Kampala',
            population_order: ['Kampala', 'Gulu', 'Mbarara'],
            metadata: {
                largest_city: 'Kampala',
                timezone_notes: 'EAT (East Africa Time)',
                special_status: 'Source of the Nile River'
            }
        },
        'Rwanda': {
            'Kigali': 'Africa/Kigali',
            'Butare': 'Africa/Kigali',
            'Gisenyi': 'Africa/Kigali',
            population_order: ['Kigali', 'Butare', 'Gisenyi'],
            metadata: {
                largest_city: 'Kigali',
                timezone_notes: 'CAT (Central Africa Time)',
                special_status: 'One of Africa\'s fastest-growing economies'
            }
        },
        'Burundi': {
            'Bujumbura': 'Africa/Bujumbura',
            'Gitega': 'Africa/Bujumbura',
            'Muyinga': 'Africa/Bujumbura',
            population_order: ['Bujumbura', 'Gitega', 'Muyinga'],
            metadata: {
                largest_city: 'Bujumbura',
                timezone_notes: 'CAT (Central Africa Time)',
                special_status: 'Capital moved from Bujumbura to Gitega in 2019'
            }
        },
        'DR Congo': {
            'Kinshasa': 'Africa/Kinshasa',
            'Lubumbashi': 'Africa/Lubumbashi',
            'Mbuji-Mayi': 'Africa/Kinshasa',
            'Goma': 'Africa/Kinshasa',
            'Kisangani': 'Africa/Kinshasa',
            population_order: ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi'],
            metadata: {
                largest_city: 'Kinshasa',
                timezone_notes: 'Multiple time zones (WAT and CAT)',
                special_status: 'Second-largest country in Africa'
            }
        },
        'Somalia': {
            'Mogadishu': 'Africa/Mogadishu',
            'Hargeisa': 'Africa/Mogadishu',
            'Kismayo': 'Africa/Mogadishu',
            'Bosaso': 'Africa/Mogadishu',
            population_order: ['Mogadishu', 'Hargeisa', 'Kismayo'],
            metadata: {
                largest_city: 'Mogadishu',
                timezone_notes: 'EAT (East Africa Time)',
                special_status: 'Includes autonomous region of Somaliland'
            }
        },
        'Djibouti': {
            'Djibouti City': 'Africa/Djibouti',
            'Ali Sabieh': 'Africa/Djibouti',
            'Tadjoura': 'Africa/Djibouti',
            population_order: ['Djibouti City', 'Ali Sabieh', 'Tadjoura'],
            metadata: {
                largest_city: 'Djibouti City',
                timezone_notes: 'EAT (East Africa Time)',
                special_status: 'Strategic location at Bab el-Mandeb strait'
            }
        },
        'Eritrea': {
            'Asmara': 'Africa/Asmara',
            'Massawa': 'Africa/Asmara',
            'Keren': 'Africa/Asmara',
            'Assab': 'Africa/Asmara',
            population_order: ['Asmara', 'Massawa', 'Keren'],
            metadata: {
                largest_city: 'Asmara',
                timezone_notes: 'EAT (East Africa Time)',
                special_status: 'UNESCO World Heritage capital city'
            }
        },
        'Republic of Congo': {
            'Brazzaville': 'Africa/Brazzaville',
            'Pointe-Noire': 'Africa/Brazzaville',
            'Dolisie': 'Africa/Brazzaville',
            population_order: ['Brazzaville', 'Pointe-Noire', 'Dolisie'],
            metadata: {
                largest_city: 'Brazzaville',
                timezone_notes: 'WAT (West Africa Time)',
                special_status: 'Capital faces Kinshasa across Congo River'
            }
        },
        'Gabon': {
            'Libreville': 'Africa/Libreville',
            'Port-Gentil': 'Africa/Libreville',
            'Franceville': 'Africa/Libreville',
            population_order: ['Libreville', 'Port-Gentil', 'Franceville'],
            metadata: {
                largest_city: 'Libreville',
                timezone_notes: 'WAT (West Africa Time)',
                special_status: 'Highest GDP per capita in Central Africa'
            }
        },
        'Zambia': {
            'Lusaka': 'Africa/Lusaka',
            'Kitwe': 'Africa/Lusaka',
            'Ndola': 'Africa/Lusaka',
            'Kabwe': 'Africa/Lusaka',
            population_order: ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe'],
            metadata: {
                largest_city: 'Lusaka',
                timezone_notes: 'CAT (Central Africa Time)',
                special_status: 'Major copper mining region'
            }
        },
        'Zimbabwe': {
            'Harare': 'Africa/Harare',
            'Bulawayo': 'Africa/Harare',
            'Chitungwiza': 'Africa/Harare',
            'Mutare': 'Africa/Harare',
            population_order: ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare'],
            metadata: {
                largest_city: 'Harare',
                timezone_notes: 'CAT (Central Africa Time)',
                special_status: 'Home to Victoria Falls'
            }
        },
        'Mozambique': {
            'Maputo': 'Africa/Maputo',
            'Matola': 'Africa/Maputo',
            'Beira': 'Africa/Maputo',
            'Nampula': 'Africa/Maputo',
            population_order: ['Maputo', 'Matola', 'Beira'],
            metadata: {
                largest_city: 'Maputo',
                timezone_notes: 'CAT (Central Africa Time)',
                special_status: 'Major port country in Southeast Africa'
            }
        },
        'Namibia': {
            'Windhoek': 'Africa/Windhoek',
            'Walvis Bay': 'Africa/Windhoek',
            'Swakopmund': 'Africa/Windhoek',
            population_order: ['Windhoek', 'Walvis Bay', 'Swakopmund'],
            metadata: {
                largest_city: 'Windhoek',
                timezone_notes: 'CAT/WAT (Changes between Central and West African Time)',
                special_status: 'Least densely populated country in Africa'
            }
        },
        'Botswana': {
            'Gaborone': 'Africa/Gaborone',
            'Francistown': 'Africa/Gaborone',
            'Molepolole': 'Africa/Gaborone',
            population_order: ['Gaborone', 'Francistown', 'Molepolole'],
            metadata: {
                largest_city: 'Gaborone',
                timezone_notes: 'CAT (Central Africa Time)',
                special_status: 'Largest diamond producer by value'
            }
        },
        'Guinea': {
            'Conakry': 'Africa/Conakry',
            'Nzérékoré': 'Africa/Conakry',
            'Kankan': 'Africa/Conakry',
            'Kindia': 'Africa/Conakry',
            population_order: ['Conakry', 'Nzérékoré', 'Kankan'],
            metadata: {
                largest_city: 'Conakry',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Major bauxite producer'
            }
        },
        'Sierra Leone': {
            'Freetown': 'Africa/Freetown',
            'Bo': 'Africa/Freetown',
            'Kenema': 'Africa/Freetown',
            'Makeni': 'Africa/Freetown',
            population_order: ['Freetown', 'Bo', 'Kenema'],
            metadata: {
                largest_city: 'Freetown',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Known for diamond resources'
            }
        },
        'Liberia': {
            'Monrovia': 'Africa/Monrovia',
            'Gbarnga': 'Africa/Monrovia',
            'Buchanan': 'Africa/Monrovia',
            'Harper': 'Africa/Monrovia',
            population_order: ['Monrovia', 'Gbarnga', 'Buchanan'],
            metadata: {
                largest_city: 'Monrovia',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Oldest African republic'
            }
        },
        'Gambia': {
            'Banjul': 'Africa/Banjul',
            'Serekunda': 'Africa/Banjul',
            'Brikama': 'Africa/Banjul',
            population_order: ['Serekunda', 'Banjul', 'Brikama'],
            metadata: {
                largest_city: 'Serekunda',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Smallest country in mainland Africa'
            }
        },
        'Guinea-Bissau': {
            'Bissau': 'Africa/Bissau',
            'Bafatá': 'Africa/Bissau',
            'Gabú': 'Africa/Bissau',
            population_order: ['Bissau', 'Bafatá', 'Gabú'],
            metadata: {
                largest_city: 'Bissau',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Former Portuguese colony'
            }
        },
        'Togo': {
            'Lomé': 'Africa/Lome',
            'Sokodé': 'Africa/Lome',
            'Kara': 'Africa/Lome',
            'Kpalimé': 'Africa/Lome',
            population_order: ['Lomé', 'Sokodé', 'Kara'],
            metadata: {
                largest_city: 'Lomé',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Major phosphate producer'
            }
        },
        'Benin': {
            'Porto-Novo': 'Africa/Porto-Novo',
            'Cotonou': 'Africa/Porto-Novo',
            'Parakou': 'Africa/Porto-Novo',
            'Djougou': 'Africa/Porto-Novo',
            population_order: ['Cotonou', 'Porto-Novo', 'Parakou'],
            metadata: {
                largest_city: 'Cotonou',
                timezone_notes: 'WAT (West Africa Time)',
                special_status: 'Economic capital differs from political capital'
            }
        },
        'Cape Verde': {
            'Praia': 'Atlantic/Cape_Verde',
            'Mindelo': 'Atlantic/Cape_Verde',
            'Santa Maria': 'Atlantic/Cape_Verde',
            population_order: ['Praia', 'Mindelo', 'Santa Maria'],
            metadata: {
                largest_city: 'Praia',
                timezone_notes: 'CVT (Cape Verde Time)',
                special_status: 'Island nation off West Africa'
            }
        },
        'São Tomé and Príncipe': {
            'São Tomé': 'Africa/Sao_Tome',
            'Santo António': 'Africa/Sao_Tome',
            'Neves': 'Africa/Sao_Tome',
            population_order: ['São Tomé', 'Santo António', 'Neves'],
            metadata: {
                largest_city: 'São Tomé',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Smallest African country by area'
            }
        },
        'Seychelles': {
            'Victoria': 'Indian/Mahe',
            'Anse Boileau': 'Indian/Mahe',
            'Beau Vallon': 'Indian/Mahe',
            population_order: ['Victoria', 'Anse Boileau', 'Beau Vallon'],
            metadata: {
                largest_city: 'Victoria',
                timezone_notes: 'SCT (Seychelles Time)',
                special_status: 'Smallest African sovereign state by population'
            }
        },
        'Comoros': {
            'Moroni': 'Indian/Comoro',
            'Mutsamudu': 'Indian/Comoro',
            'Fomboni': 'Indian/Comoro',
            population_order: ['Moroni', 'Mutsamudu', 'Fomboni'],
            metadata: {
                largest_city: 'Moroni',
                timezone_notes: 'EAT (East Africa Time)',
                special_status: 'Island nation in Indian Ocean'
            }
        },
        'Mauritius': {
            'Port Louis': 'Indian/Mauritius',
            'Beau Bassin-Rose Hill': 'Indian/Mauritius',
            'Vacoas-Phoenix': 'Indian/Mauritius',
            'Curepipe': 'Indian/Mauritius',
            population_order: ['Port Louis', 'Beau Bassin-Rose Hill', 'Vacoas-Phoenix'],
            metadata: {
                largest_city: 'Port Louis',
                timezone_notes: 'MUT (Mauritius Time)',
                special_status: 'Most developed country in Africa'
            }
        },
        'Mauritania': {
            'Nouakchott': 'Africa/Nouakchott',
            'Nouadhibou': 'Africa/Nouakchott',
            'Kiffa': 'Africa/Nouakchott',
            population_order: ['Nouakchott', 'Nouadhibou', 'Kiffa'],
            metadata: {
                largest_city: 'Nouakchott',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Bridge between North and West Africa'
            }
        },
        'Western Sahara': {
            'Laayoune': 'Africa/El_Aaiun',
            'Dakhla': 'Africa/El_Aaiun',
            'Boujdour': 'Africa/El_Aaiun',
            population_order: ['Laayoune', 'Dakhla', 'Boujdour'],
            metadata: {
                largest_city: 'Laayoune',
                timezone_notes: 'WEST (Western European Summer Time)',
                special_status: 'Non-self-governing territory'
            }
        }
    },

    'Asia': {
        'China': {
            'Shanghai': 'Asia/Shanghai',
            'Beijing': 'Asia/Shanghai',
            'Guangzhou': 'Asia/Shanghai',
            'Shenzhen': 'Asia/Shanghai',
            'Chongqing': 'Asia/Shanghai',
            'Tianjin': 'Asia/Shanghai',
            'Wuhan': 'Asia/Shanghai',
            'Chengdu': 'Asia/Shanghai',
            'Hong Kong': 'Asia/Hong_Kong',
            population_order: [
                'Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Chongqing',
                'Tianjin', 'Wuhan', 'Chengdu', 'Hong Kong'
            ],
            metadata: {
                largest_city: 'Shanghai',
                timezone_notes: 'Single timezone (Beijing Time) for entire country',
                special_status: 'Uses single timezone despite spanning 5 geographical zones'
            }
        },
        'Japan': {
            'Tokyo': 'Asia/Tokyo',
            'Yokohama': 'Asia/Tokyo',
            'Osaka': 'Asia/Tokyo',
            'Nagoya': 'Asia/Tokyo',
            'Sapporo': 'Asia/Tokyo',
            'Fukuoka': 'Asia/Tokyo',
            'Kobe': 'Asia/Tokyo',
            'Kyoto': 'Asia/Tokyo',
            population_order: [
                'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo',
                'Fukuoka', 'Kobe', 'Kyoto'
            ],
            metadata: {
                largest_city: 'Tokyo',
                timezone_notes: 'JST (Japan Standard Time)',
                population: {
                    'Tokyo': 37_400_000 // Metropolitan area
                }
            }
        },
        'South Korea': {
            'Seoul': 'Asia/Seoul',
            'Busan': 'Asia/Seoul',
            'Incheon': 'Asia/Seoul',
            'Daegu': 'Asia/Seoul',
            'Daejeon': 'Asia/Seoul',
            'Gwangju': 'Asia/Seoul',
            population_order: ['Seoul', 'Busan', 'Incheon', 'Daegu'],
            metadata: {
                largest_city: 'Seoul',
                timezone_notes: 'KST (Korea Standard Time)'
            }
        },
        'India': {
            'Mumbai': 'Asia/Kolkata',
            'Delhi': 'Asia/Kolkata',
            'Bangalore': 'Asia/Kolkata',
            'Hyderabad': 'Asia/Kolkata',
            'Chennai': 'Asia/Kolkata',
            'Kolkata': 'Asia/Kolkata',
            'Ahmedabad': 'Asia/Kolkata',
            'Pune': 'Asia/Kolkata',
            population_order: [
                'Delhi', 'Mumbai', 'Bangalore', 'Kolkata',
                'Chennai', 'Hyderabad', 'Ahmedabad', 'Pune'
            ],
            metadata: {
                largest_city: 'Delhi',
                timezone_notes: 'IST (Indian Standard Time)',
                special_status: 'Single timezone despite large geographical span'
            }
        },
        'Indonesia': {
            'Jakarta': 'Asia/Jakarta',
            'Surabaya': 'Asia/Jakarta',
            'Bandung': 'Asia/Jakarta',
            'Medan': 'Asia/Jakarta',
            'Semarang': 'Asia/Jakarta',
            'Makassar': 'Asia/Makassar',
            'Denpasar': 'Asia/Makassar',
            'Manado': 'Asia/Makassar',
            'Jayapura': 'Asia/Jayapura',
            'Ambon': 'Asia/Jayapura',
            population_order: [
                'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang',
                'Makassar', 'Denpasar', 'Manado', 'Jayapura', 'Ambon'
            ],
            metadata: {
                largest_city: 'Jakarta',
                timezone_notes: 'Spans three time zones (WIB, WITA, WIT)',
                multiple_zones: {
                    'WIB': 'Asia/Jakarta',
                    'WITA': 'Asia/Makassar',
                    'WIT': 'Asia/Jayapura'
                },
                timezone_populations: {
                    'Jakarta': '10.6M',
                    'Makassar': '1.5M',
                    'Jayapura': '256K'
                }
            }
        },
        'Pakistan': {
            'Karachi': 'Asia/Karachi',
            'Lahore': 'Asia/Karachi',
            'Islamabad': 'Asia/Karachi',
            'Faisalabad': 'Asia/Karachi',
            'Rawalpindi': 'Asia/Karachi',
            'Multan': 'Asia/Karachi',
            population_order: ['Karachi', 'Lahore', 'Faisalabad', 'Islamabad'],
            metadata: {
                largest_city: 'Karachi',
                timezone_notes: 'PKT (Pakistan Standard Time)'
            }
        },
        'Russia': {
            'Moscow': 'Europe/Moscow',
            'Saint Petersburg': 'Europe/Moscow',
            'Novosibirsk': 'Asia/Novosibirsk',
            'Yekaterinburg': 'Asia/Yekaterinburg',
            'Kazan': 'Europe/Moscow',
            'Vladivostok': 'Asia/Vladivostok',
            'Irkutsk': 'Asia/Irkutsk',
            'Krasnoyarsk': 'Asia/Krasnoyarsk',
            'Kaliningrad': 'Europe/Kaliningrad',
            population_order: [
                'Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg',
                'Kazan', 'Vladivostok', 'Irkutsk', 'Krasnoyarsk', 'Kaliningrad'
            ],
            metadata: {
                largest_city: 'Moscow',
                timezone_notes: 'Spans 11 time zones',
                special_status: 'Largest country by land area'
            }
        },
        'Saudi Arabia': {
            'Riyadh': 'Asia/Riyadh',
            'Jeddah': 'Asia/Riyadh',
            'Mecca': 'Asia/Riyadh',
            'Medina': 'Asia/Riyadh',
            'Dammam': 'Asia/Riyadh',
            population_order: ['Riyadh', 'Jeddah', 'Mecca'],
            metadata: {
                largest_city: 'Riyadh',
                timezone_notes: 'AST (Arabia Standard Time)'
            }
        },
        'United Arab Emirates': {
            'Dubai': 'Asia/Dubai',
            'Abu Dhabi': 'Asia/Dubai',
            'Sharjah': 'Asia/Dubai',
            'Ajman': 'Asia/Dubai',
            population_order: ['Dubai', 'Abu Dhabi', 'Sharjah'],
            metadata: {
                largest_city: 'Dubai',
                timezone_notes: 'GST (Gulf Standard Time)'
            }
        },
        'Thailand': {
            'Bangkok': 'Asia/Bangkok',
            'Nonthaburi': 'Asia/Bangkok',
            'Phuket': 'Asia/Bangkok',
            'Chiang Mai': 'Asia/Bangkok',
            population_order: ['Bangkok', 'Nonthaburi', 'Phuket'],
            metadata: {
                largest_city: 'Bangkok',
                timezone_notes: 'ICT (Indochina Time)'
            }
        },
        'Vietnam': {
            'Ho Chi Minh City': 'Asia/Ho_Chi_Minh',
            'Hanoi': 'Asia/Ho_Chi_Minh',
            'Da Nang': 'Asia/Ho_Chi_Minh',
            'Hai Phong': 'Asia/Ho_Chi_Minh',
            population_order: ['Ho Chi Minh City', 'Hanoi', 'Hai Phong'],
            metadata: {
                largest_city: 'Ho Chi Minh City',
                timezone_notes: 'ICT (Indochina Time)'
            }
        },
        'Malaysia': {
            'Kuala Lumpur': 'Asia/Kuala_Lumpur',
            'George Town': 'Asia/Kuala_Lumpur',
            'Ipoh': 'Asia/Kuala_Lumpur',
            'Johor Bahru': 'Asia/Kuala_Lumpur',
            'Malacca City': 'Asia/Kuala_Lumpur',
            population_order: ['Kuala Lumpur', 'George Town', 'Ipoh'],
            metadata: {
                largest_city: 'Kuala Lumpur',
                timezone_notes: 'MST (Malaysia Standard Time)',
                special_status: 'Includes territories in Borneo'
            }
        },
        'Singapore': {
            'Singapore': 'Asia/Singapore',
            population_order: ['Singapore'],
            metadata: {
                largest_city: 'Singapore',
                timezone_notes: 'SGT (Singapore Time)',
                special_status: 'City-state financial hub'
            }
        },
        'Philippines': {
            'Manila': 'Asia/Manila',
            'Quezon City': 'Asia/Manila',
            'Davao City': 'Asia/Manila',
            'Cebu City': 'Asia/Manila',
            'Makati': 'Asia/Manila',
            population_order: ['Quezon City', 'Manila', 'Davao City'],
            metadata: {
                largest_city: 'Quezon City',
                timezone_notes: 'PHT (Philippine Time)',
                special_status: 'Largest Christian nation in Asia'
            }
        },
        'Taiwan': {
            'Taipei': 'Asia/Taipei',
            'Kaohsiung': 'Asia/Taipei',
            'Taichung': 'Asia/Taipei',
            'Tainan': 'Asia/Taipei',
            'Hsinchu': 'Asia/Taipei',
            population_order: ['Taipei', 'Kaohsiung', 'Taichung'],
            metadata: {
                largest_city: 'Taipei',
                timezone_notes: 'CST (China Standard Time)',
                special_status: 'Major technology hub'
            }
        },
        'Bangladesh': {
            'Dhaka': 'Asia/Dhaka',
            'Chittagong': 'Asia/Dhaka',
            'Khulna': 'Asia/Dhaka',
            'Rajshahi': 'Asia/Dhaka',
            'Sylhet': 'Asia/Dhaka',
            population_order: ['Dhaka', 'Chittagong', 'Khulna'],
            metadata: {
                largest_city: 'Dhaka',
                timezone_notes: 'BST (Bangladesh Standard Time)',
                special_status: 'Most densely populated large country'
            }
        },
        'Iran': {
            'Tehran': 'Asia/Tehran',
            'Mashhad': 'Asia/Tehran',
            'Isfahan': 'Asia/Tehran',
            'Karaj': 'Asia/Tehran',
            'Tabriz': 'Asia/Tehran',
            population_order: ['Tehran', 'Mashhad', 'Isfahan'],
            metadata: {
                largest_city: 'Tehran',
                timezone_notes: 'IRST/IRDT',
                special_status: 'Unique timezone offset (UTC+3:30)'
            }
        },
        'Iraq': {
            'Baghdad': 'Asia/Baghdad',
            'Basra': 'Asia/Baghdad',
            'Mosul': 'Asia/Baghdad',
            'Erbil': 'Asia/Baghdad',
            'Najaf': 'Asia/Baghdad',
            population_order: ['Baghdad', 'Basra', 'Mosul'],
            metadata: {
                largest_city: 'Baghdad',
                timezone_notes: 'AST (Arabia Standard Time)',
                special_status: 'Historical center of Islamic Golden Age'
            }
        },
        'Syria': {
            'Damascus': 'Asia/Damascus',
            'Aleppo': 'Asia/Damascus',
            'Homs': 'Asia/Damascus',
            'Latakia': 'Asia/Damascus',
            population_order: ['Damascus', 'Aleppo', 'Homs'],
            metadata: {
                largest_city: 'Damascus',
                timezone_notes: 'EET/EEST',
                special_status: 'Oldest continuously inhabited city'
            }
        },
        'Lebanon': {
            'Beirut': 'Asia/Beirut',
            'Tripoli': 'Asia/Beirut',
            'Sidon': 'Asia/Beirut',
            'Tyre': 'Asia/Beirut',
            population_order: ['Beirut', 'Tripoli', 'Sidon'],
            metadata: {
                largest_city: 'Beirut',
                timezone_notes: 'EET/EEST',
                special_status: 'Cultural center of the Arab world'
            }
        },
        'Jordan': {
            'Amman': 'Asia/Amman',
            'Zarqa': 'Asia/Amman',
            'Irbid': 'Asia/Amman',
            'Aqaba': 'Asia/Amman',
            population_order: ['Amman', 'Zarqa', 'Irbid'],
            metadata: {
                largest_city: 'Amman',
                timezone_notes: 'EET/EEST',
                special_status: 'Home to ancient city of Petra'
            }
        },
        'Israel': {
            'Jerusalem': 'Asia/Jerusalem',
            'Tel Aviv': 'Asia/Jerusalem',
            'Haifa': 'Asia/Jerusalem',
            'Beer Sheva': 'Asia/Jerusalem',
            population_order: ['Jerusalem', 'Tel Aviv', 'Haifa'],
            metadata: {
                largest_city: 'Jerusalem',
                timezone_notes: 'IST (Israel Standard Time)',
                special_status: 'Contested capital city'
            }
        },
        'Kuwait': {
            'Kuwait City': 'Asia/Kuwait',
            'Jahrah': 'Asia/Kuwait',
            'Salmiya': 'Asia/Kuwait',
            population_order: ['Kuwait City', 'Jahrah', 'Salmiya'],
            metadata: {
                largest_city: 'Kuwait City',
                timezone_notes: 'AST (Arabia Standard Time)',
                special_status: 'Major oil producer'
            }
        },
        'Bahrain': {
            'Manama': 'Asia/Bahrain',
            'Riffa': 'Asia/Bahrain',
            'Muharraq': 'Asia/Bahrain',
            population_order: ['Manama', 'Riffa', 'Muharraq'],
            metadata: {
                largest_city: 'Manama',
                timezone_notes: 'AST (Arabia Standard Time)',
                special_status: 'Financial hub of the Gulf'
            }
        },
        'Qatar': {
            'Doha': 'Asia/Qatar',
            'Al Wakrah': 'Asia/Qatar',
            'Al Khor': 'Asia/Qatar',
            population_order: ['Doha', 'Al Wakrah', 'Al Khor'],
            metadata: {
                largest_city: 'Doha',
                timezone_notes: 'AST (Arabia Standard Time)',
                special_status: 'Highest GDP per capita in the world'
            }
        },
        'Oman': {
            'Muscat': 'Asia/Muscat',
            'Salalah': 'Asia/Muscat',
            'Sohar': 'Asia/Muscat',
            'Nizwa': 'Asia/Muscat',
            population_order: ['Muscat', 'Salalah', 'Sohar'],
            metadata: {
                largest_city: 'Muscat',
                timezone_notes: 'GST (Gulf Standard Time)',
                special_status: 'Oldest independent state in the Arab world'
            }
        },
        'Yemen': {
            'Sanaa': 'Asia/Aden',
            'Aden': 'Asia/Aden',
            'Taiz': 'Asia/Aden',
            'Hodeidah': 'Asia/Aden',
            population_order: ['Sanaa', 'Aden', 'Taiz'],
            metadata: {
                largest_city: 'Sanaa',
                timezone_notes: 'AST (Arabia Standard Time)',
                special_status: 'Highest capital city in the Arab world'
            }
        },
        'Kazakhstan': {
            'Almaty': 'Asia/Almaty',
            'Nur-Sultan': 'Asia/Almaty', // formerly Astana
            'Shymkent': 'Asia/Almaty',
            'Karaganda': 'Asia/Almaty',
            population_order: ['Almaty', 'Nur-Sultan', 'Shymkent'],
            metadata: {
                largest_city: 'Almaty',
                timezone_notes: 'Multiple time zones',
                special_status: 'Largest landlocked country in the world'
            }
        },
        'Uzbekistan': {
            'Tashkent': 'Asia/Tashkent',
            'Namangan': 'Asia/Tashkent',
            'Samarkand': 'Asia/Samarkand',
            'Andijan': 'Asia/Tashkent',
            population_order: ['Tashkent', 'Namangan', 'Samarkand'],
            metadata: {
                largest_city: 'Tashkent',
                timezone_notes: 'UZT (Uzbekistan Time)',
                special_status: 'Historical Silk Road crossroads'
            }
        },
        'Nepal': {
            'Kathmandu': 'Asia/Kathmandu',
            'Pokhara': 'Asia/Kathmandu',
            'Lalitpur': 'Asia/Kathmandu',
            'Bharatpur': 'Asia/Kathmandu',
            population_order: ['Kathmandu', 'Pokhara', 'Lalitpur'],
            metadata: {
                largest_city: 'Kathmandu',
                timezone_notes: 'NPT (Nepal Time)',
                special_status: 'Unique UTC+5:45 offset'
            }
        },
        'Sri Lanka': {
            'Colombo': 'Asia/Colombo',
            'Kandy': 'Asia/Colombo',
            'Galle': 'Asia/Colombo',
            'Jaffna': 'Asia/Colombo',
            population_order: ['Colombo', 'Kandy', 'Galle'],
            metadata: {
                largest_city: 'Colombo',
                timezone_notes: 'SLST (Sri Lanka Standard Time)',
                special_status: 'Commercial capital differs from administrative capital'
            }
        },
        'Mongolia': {
            'Ulaanbaatar': 'Asia/Ulaanbaatar',
            'Erdenet': 'Asia/Ulaanbaatar',
            'Darkhan': 'Asia/Ulaanbaatar',
            'Choibalsan': 'Asia/Choibalsan',
            population_order: ['Ulaanbaatar', 'Erdenet', 'Darkhan'],
            metadata: {
                largest_city: 'Ulaanbaatar',
                timezone_notes: 'ULAT (Ulaanbaatar Time)',
                special_status: 'Coldest capital city in the world'
            }
        },
        'North Korea': {
            'Pyongyang': 'Asia/Pyongyang',
            'Hamhung': 'Asia/Pyongyang',
            'Chongjin': 'Asia/Pyongyang',
            'Wonsan': 'Asia/Pyongyang',
            population_order: ['Pyongyang', 'Hamhung', 'Chongjin'],
            metadata: {
                largest_city: 'Pyongyang',
                timezone_notes: 'KST (Korea Standard Time)',
                special_status: 'Changed timezone to match South Korea in 2015'
            }
        },
        'Myanmar': {
            'Yangon': 'Asia/Yangon',
            'Mandalay': 'Asia/Yangon',
            'Naypyidaw': 'Asia/Yangon',
            'Mawlamyine': 'Asia/Yangon',
            population_order: ['Yangon', 'Mandalay', 'Naypyidaw'],
            metadata: {
                largest_city: 'Yangon',
                timezone_notes: 'MMT (Myanmar Time)',
                special_status: 'Capital moved from Yangon to Naypyidaw in 2006'
            }
        },
        'Laos': {
            'Vientiane': 'Asia/Vientiane',
            'Pakse': 'Asia/Vientiane',
            'Luang Prabang': 'Asia/Vientiane',
            'Savannakhet': 'Asia/Vientiane',
            population_order: ['Vientiane', 'Pakse', 'Savannakhet'],
            metadata: {
                largest_city: 'Vientiane',
                timezone_notes: 'ICT (Indochina Time)',
                special_status: 'Only landlocked country in Southeast Asia'
            }
        },
        'Cambodia': {
            'Phnom Penh': 'Asia/Phnom_Penh',
            'Siem Reap': 'Asia/Phnom_Penh',
            'Battambang': 'Asia/Phnom_Penh',
            'Sihanoukville': 'Asia/Phnom_Penh',
            population_order: ['Phnom Penh', 'Siem Reap', 'Battambang'],
            metadata: {
                largest_city: 'Phnom Penh',
                timezone_notes: 'ICT (Indochina Time)',
                special_status: 'Home to Angkor Wat'
            }
        },
        'Armenia': {
            'Yerevan': 'Asia/Yerevan',
            'Gyumri': 'Asia/Yerevan',
            'Vanadzor': 'Asia/Yerevan',
            population_order: ['Yerevan', 'Gyumri', 'Vanadzor'],
            metadata: {
                largest_city: 'Yerevan',
                timezone_notes: 'AMT (Armenia Time)',
                special_status: 'One of the oldest continuously inhabited cities'
            }
        },
        'Georgia': {
            'Tbilisi': 'Asia/Tbilisi',
            'Batumi': 'Asia/Tbilisi',
            'Kutaisi': 'Asia/Tbilisi',
            population_order: ['Tbilisi', 'Batumi', 'Kutaisi'],
            metadata: {
                largest_city: 'Tbilisi',
                timezone_notes: 'GET (Georgia Time)',
                special_status: 'Spans Europe and Asia'
            }
        },
        'Azerbaijan': {
            'Baku': 'Asia/Baku',
            'Ganja': 'Asia/Baku',
            'Sumqayit': 'Asia/Baku',
            population_order: ['Baku', 'Ganja', 'Sumqayit'],
            metadata: {
                largest_city: 'Baku',
                timezone_notes: 'AZT (Azerbaijan Time)',
                special_status: 'Lowest capital city in the world'
            }
        },
        'Kyrgyzstan': {
            'Bishkek': 'Asia/Bishkek',
            'Osh': 'Asia/Bishkek',
            'Jalal-Abad': 'Asia/Bishkek',
            population_order: ['Bishkek', 'Osh', 'Jalal-Abad'],
            metadata: {
                largest_city: 'Bishkek',
                timezone_notes: 'KGT (Kyrgyzstan Time)',
                special_status: 'Most mountainous country in Central Asia'
            }
        },
        'Tajikistan': {
            'Dushanbe': 'Asia/Dushanbe',
            'Khujand': 'Asia/Dushanbe',
            'Kulob': 'Asia/Dushanbe',
            population_order: ['Dushanbe', 'Khujand', 'Kulob'],
            metadata: {
                largest_city: 'Dushanbe',
                timezone_notes: 'TJT (Tajikistan Time)',
                special_status: '93% of territory is mountainous'
            }
        },
        'Turkmenistan': {
            'Ashgabat': 'Asia/Ashgabat',
            'Türkmenabat': 'Asia/Ashgabat',
            'Daşoguz': 'Asia/Ashgabat',
            population_order: ['Ashgabat', 'Türkmenabat', 'Daşoguz'],
            metadata: {
                largest_city: 'Ashgabat',
                timezone_notes: 'TMT (Turkmenistan Time)',
                special_status: 'Most marble buildings per capita'
            }
        },
        'Brunei': {
            'Bandar Seri Begawan': 'Asia/Brunei',
            'Kuala Belait': 'Asia/Brunei',
            'Tutong': 'Asia/Brunei',
            population_order: ['Bandar Seri Begawan', 'Kuala Belait', 'Tutong'],
            metadata: {
                largest_city: 'Bandar Seri Begawan',
                timezone_notes: 'BNT (Brunei Time)',
                special_status: 'Small but wealthy sultanate'
            }
        },
        'Timor-Leste': {
            'Dili': 'Asia/Dili',
            'Baucau': 'Asia/Dili',
            'Lospalos': 'Asia/Dili',
            population_order: ['Dili', 'Baucau', 'Lospalos'],
            metadata: {
                largest_city: 'Dili',
                timezone_notes: 'TLT (East Timor Time)',
                special_status: 'Newest nation in Asia (2002)'
            }
        },
        'Maldives': {
            'Male': 'Indian/Maldives',
            'Addu City': 'Indian/Maldives',
            'Fuvahmulah': 'Indian/Maldives',
            population_order: ['Male', 'Addu City', 'Fuvahmulah'],
            metadata: {
                largest_city: 'Male',
                timezone_notes: 'MVT (Maldives Time)',
                special_status: 'Lowest country in the world'
            }
        },
        'Bhutan': {
            'Thimphu': 'Asia/Thimphu',
            'Phuentsholing': 'Asia/Thimphu',
            'Paro': 'Asia/Thimphu',
            population_order: ['Thimphu', 'Phuentsholing', 'Paro'],
            metadata: {
                largest_city: 'Thimphu',
                timezone_notes: 'BTT (Bhutan Time)',
                special_status: 'Only carbon-negative country'
            }
        }
    },

    'Europe': {
        'Austria': {
            'Vienna': 'Europe/Vienna',
            'Graz': 'Europe/Vienna',
            'Linz': 'Europe/Vienna',
            population_order: ['Vienna', 'Graz', 'Linz'],
            metadata: {
                largest_city: 'Vienna',
                timezone_notes: 'CET/CEST (Central European Time)',
                special_status: 'Historical center of Habsburg Empire'
            }
        },
        'Belgium': {
            'Brussels': 'Europe/Brussels',
            'Antwerp': 'Europe/Brussels',
            'Ghent': 'Europe/Brussels',
            population_order: ['Brussels', 'Antwerp', 'Ghent'],
            metadata: {
                largest_city: 'Brussels',
                timezone_notes: 'CET/CEST',
                special_status: 'EU and NATO headquarters'
            }
        },
        'Bulgaria': {
            'Sofia': 'Europe/Sofia',
            'Plovdiv': 'Europe/Sofia',
            'Varna': 'Europe/Sofia',
            population_order: ['Sofia', 'Plovdiv', 'Varna'],
            metadata: {
                largest_city: 'Sofia',
                timezone_notes: 'EET/EEST (Eastern European Time)',
                special_status: 'EU member since 2007'
            }
        },
        'Croatia': {
            'Zagreb': 'Europe/Zagreb',
            'Split': 'Europe/Zagreb',
            'Rijeka': 'Europe/Zagreb',
            population_order: ['Zagreb', 'Split', 'Rijeka'],
            metadata: {
                largest_city: 'Zagreb',
                timezone_notes: 'CET/CEST',
                special_status: 'Newest EU member (2013)'
            }
        },
        'Czech Republic': {
            'Prague': 'Europe/Prague',
            'Brno': 'Europe/Prague',
            'Ostrava': 'Europe/Prague',
            population_order: ['Prague', 'Brno', 'Ostrava'],
            metadata: {
                largest_city: 'Prague',
                timezone_notes: 'CET/CEST',
                special_status: 'Historical capital of Bohemia'
            }
        },
        'Denmark': {
            'Copenhagen': 'Europe/Copenhagen',
            'Aarhus': 'Europe/Copenhagen',
            'Odense': 'Europe/Copenhagen',
            population_order: ['Copenhagen', 'Aarhus', 'Odense'],
            metadata: {
                largest_city: 'Copenhagen',
                timezone_notes: 'CET/CEST',
                special_status: 'Includes autonomous territories Greenland and Faroe Islands'
            }
        },
        'Finland': {
            'Helsinki': 'Europe/Helsinki',
            'Espoo': 'Europe/Helsinki',
            'Tampere': 'Europe/Helsinki',
            population_order: ['Helsinki', 'Espoo', 'Tampere'],
            metadata: {
                largest_city: 'Helsinki',
                timezone_notes: 'EET/EEST',
                special_status: 'Northernmost EU capital'
            }
        },
        'France': {
            'Paris': 'Europe/Paris',
            'Marseille': 'Europe/Paris',
            'Lyon': 'Europe/Paris',
            'Toulouse': 'Europe/Paris',
            'Nice': 'Europe/Paris',
            'Bordeaux': 'Europe/Paris',
            population_order: ['Paris', 'Marseille', 'Lyon'],
            metadata: {
                largest_city: 'Paris',
                timezone_notes: 'CET/CEST (Central European Time)',
                territories: {
                    'French Polynesia': 'Pacific/Tahiti',
                    'New Caledonia': 'Pacific/Noumea',
                    'Réunion': 'Indian/Reunion'
                }
            }
        },
        'Germany': {
            'Berlin': 'Europe/Berlin',
            'Hamburg': 'Europe/Berlin',
            'Munich': 'Europe/Berlin',
            'Cologne': 'Europe/Berlin',
            'Frankfurt': 'Europe/Berlin',
            'Stuttgart': 'Europe/Berlin',
            'Düsseldorf': 'Europe/Berlin',
            population_order: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf'],
            metadata: {
                largest_city: 'Berlin',
                timezone_notes: 'CET/CEST',
                special_status: 'Largest economy in EU'
            }
        },
        'Greece': {
            'Athens': 'Europe/Athens',
            'Thessaloniki': 'Europe/Athens',
            'Patras': 'Europe/Athens',
            'Heraklion': 'Europe/Athens',
            population_order: ['Athens', 'Thessaloniki', 'Patras'],
            metadata: {
                largest_city: 'Athens',
                timezone_notes: 'EET/EEST',
                special_status: 'Birthplace of democracy'
            }
        },
        'Hungary': {
            'Budapest': 'Europe/Budapest',
            'Debrecen': 'Europe/Budapest',
            'Szeged': 'Europe/Budapest',
            population_order: ['Budapest', 'Debrecen', 'Szeged'],
            metadata: {
                largest_city: 'Budapest',
                timezone_notes: 'CET/CEST',
                special_status: 'Largest city in the Carpathian Basin'
            }
        },
        'Ireland': {
            'Dublin': 'Europe/Dublin',
            'Cork': 'Europe/Dublin',
            'Galway': 'Europe/Dublin',
            'Limerick': 'Europe/Dublin',
            population_order: ['Dublin', 'Cork', 'Galway'],
            metadata: {
                largest_city: 'Dublin',
                timezone_notes: 'IST (Irish Standard Time)',
                special_status: 'Only English-speaking Eurozone country'
            }
        },
        'Italy': {
            'Rome': 'Europe/Rome',
            'Milan': 'Europe/Rome',
            'Naples': 'Europe/Rome',
            'Turin': 'Europe/Rome',
            'Florence': 'Europe/Rome',
            'Venice': 'Europe/Rome',
            'Bologna': 'Europe/Rome',
            population_order: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice', 'Bologna'],
            metadata: {
                largest_city: 'Rome',
                timezone_notes: 'CET/CEST',
                special_status: 'Vatican City is an independent state within Rome'
            }
        },
        'Netherlands': {
            'Amsterdam': 'Europe/Amsterdam',
            'Rotterdam': 'Europe/Amsterdam',
            'The Hague': 'Europe/Amsterdam',
            'Utrecht': 'Europe/Amsterdam',
            'Eindhoven': 'Europe/Amsterdam',
            population_order: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
            metadata: {
                largest_city: 'Amsterdam',
                timezone_notes: 'CET/CEST',
                special_status: 'The Hague hosts International Court of Justice'
            }
        },
        'Norway': {
            'Oslo': 'Europe/Oslo',
            'Bergen': 'Europe/Oslo',
            'Trondheim': 'Europe/Oslo',
            'Stavanger': 'Europe/Oslo',
            population_order: ['Oslo', 'Bergen', 'Trondheim'],
            metadata: {
                largest_city: 'Oslo',
                timezone_notes: 'CET/CEST',
                special_cases: {
                    'Svalbard': 'Same timezone despite being in Arctic'
                }
            }
        },
        'Poland': {
            'Warsaw': 'Europe/Warsaw',
            'Kraków': 'Europe/Warsaw',
            'Łódź': 'Europe/Warsaw',
            'Wrocław': 'Europe/Warsaw',
            'Poznań': 'Europe/Warsaw',
            population_order: ['Warsaw', 'Kraków', 'Łódź'],
            metadata: {
                largest_city: 'Warsaw',
                timezone_notes: 'CET/CEST',
                special_status: 'Largest economy in Central Europe'
            }
        },
        'Portugal': {
            'Lisbon': 'Europe/Lisbon',
            'Porto': 'Europe/Lisbon',
            'Braga': 'Europe/Lisbon',
            'Coimbra': 'Europe/Lisbon',
            'Ponta Delgada': 'Atlantic/Azores',
            'Angra do Heroísmo': 'Atlantic/Azores',
            population_order: ['Lisbon', 'Porto', 'Braga'],
            metadata: {
                largest_city: 'Lisbon',
                timezone_notes: 'WET/WEST and Azores (UTC-1)',
                special_cases: {
                    'Azores': 'UTC-1',
                    'Madeira': 'Same as mainland'
                }
            }
        },
        'Romania': {
            'Bucharest': 'Europe/Bucharest',
            'Cluj-Napoca': 'Europe/Bucharest',
            'Timișoara': 'Europe/Bucharest',
            'Iași': 'Europe/Bucharest',
            population_order: ['Bucharest', 'Cluj-Napoca', 'Timișoara'],
            metadata: {
                largest_city: 'Bucharest',
                timezone_notes: 'EET/EEST',
                special_status: 'Largest city in southeastern EU'
            }
        },
        'Spain': {
            'Madrid': 'Europe/Madrid',
            'Barcelona': 'Europe/Madrid',
            'Valencia': 'Europe/Madrid',
            'Seville': 'Europe/Madrid',
            'Bilbao': 'Europe/Madrid',
            'Málaga': 'Europe/Madrid',
            'Las Palmas': 'Atlantic/Canary',
            'Santa Cruz de Tenerife': 'Atlantic/Canary',
            population_order: [
                'Madrid', 'Barcelona', 'Valencia', 'Seville',
                'Bilbao', 'Málaga', 'Las Palmas', 'Santa Cruz de Tenerife'
            ],
            metadata: {
                largest_city: 'Madrid',
                timezone_notes: 'CET/CEST and WET/WEST (Canary Islands)',
                special_cases: {
                    'Canary Islands': 'WET/WEST (1 hour behind mainland)',
                    'Geographic location': 'Uses CET despite being geographically in WET'
                }
            }
        },
        'Sweden': {
            'Stockholm': 'Europe/Stockholm',
            'Gothenburg': 'Europe/Stockholm',
            'Malmö': 'Europe/Stockholm',
            'Uppsala': 'Europe/Stockholm',
            population_order: ['Stockholm', 'Gothenburg', 'Malmö'],
            metadata: {
                largest_city: 'Stockholm',
                timezone_notes: 'CET/CEST',
                special_status: 'Northernmost major European cities'
            }
        },
        'Switzerland': {
            'Zurich': 'Europe/Zurich',
            'Geneva': 'Europe/Zurich',
            'Basel': 'Europe/Zurich',
            'Bern': 'Europe/Zurich',
            'Lausanne': 'Europe/Zurich',
            population_order: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
            metadata: {
                largest_city: 'Zurich',
                timezone_notes: 'CET/CEST',
                special_status: 'Global financial center'
            }
        },
        'Ukraine': {
            'Kyiv': 'Europe/Kiev',
            'Kharkiv': 'Europe/Kiev',
            'Odesa': 'Europe/Kiev',
            'Dnipro': 'Europe/Kiev',
            'Lviv': 'Europe/Kiev',
            population_order: ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Lviv'],
            metadata: {
                largest_city: 'Kyiv',
                timezone_notes: 'EET/EEST',
                special_status: 'Largest country entirely within Europe'
            }
        },
        'United Kingdom': {
            'London': 'Europe/London',
            'Manchester': 'Europe/London',
            'Birmingham': 'Europe/London',
            'Glasgow': 'Europe/London',
            'Liverpool': 'Europe/London',
            'Edinburgh': 'Europe/London',
            'Bristol': 'Europe/London',
            'Leeds': 'Europe/London',
            population_order: ['London', 'Birmingham', 'Manchester'],
            metadata: {
                largest_city: 'London',
                timezone_notes: 'GMT/BST (observes DST)',
                special_status: 'Reference timezone (GMT)'
            }
        },
        'Estonia': {
            'Tallinn': 'Europe/Tallinn',
            'Tartu': 'Europe/Tallinn',
            'Narva': 'Europe/Tallinn',
            'Pärnu': 'Europe/Tallinn',
            population_order: ['Tallinn', 'Tartu', 'Narva'],
            metadata: {
                largest_city: 'Tallinn',
                timezone_notes: 'EET/EEST',
                special_status: 'Most digitally advanced society in Europe'
            }
        },
        'Latvia': {
            'Riga': 'Europe/Riga',
            'Daugavpils': 'Europe/Riga',
            'Liepāja': 'Europe/Riga',
            'Jelgava': 'Europe/Riga',
            population_order: ['Riga', 'Daugavpils', 'Liepāja'],
            metadata: {
                largest_city: 'Riga',
                timezone_notes: 'EET/EEST',
                special_status: 'Largest city in the Baltic states'
            }
        },
        'Lithuania': {
            'Vilnius': 'Europe/Vilnius',
            'Kaunas': 'Europe/Vilnius',
            'Klaipėda': 'Europe/Vilnius',
            'Šiauliai': 'Europe/Vilnius',
            population_order: ['Vilnius', 'Kaunas', 'Klaipėda'],
            metadata: {
                largest_city: 'Vilnius',
                timezone_notes: 'EET/EEST',
                special_status: 'Geographical center of Europe nearby'
            }
        },
        'Albania': {
            'Tirana': 'Europe/Tirane',
            'Durrës': 'Europe/Tirane',
            'Vlorë': 'Europe/Tirane',
            'Elbasan': 'Europe/Tirane',
            population_order: ['Tirana', 'Durrës', 'Vlorë'],
            metadata: {
                largest_city: 'Tirana',
                timezone_notes: 'CET/CEST',
                special_status: 'NATO member since 2009'
            }
        },
        'North Macedonia': {
            'Skopje': 'Europe/Skopje',
            'Bitola': 'Europe/Skopje',
            'Kumanovo': 'Europe/Skopje',
            'Tetovo': 'Europe/Skopje',
            population_order: ['Skopje', 'Bitola', 'Kumanovo'],
            metadata: {
                largest_city: 'Skopje',
                timezone_notes: 'CET/CEST',
                special_status: 'NATO member since 2020'
            }
        },
        'Montenegro': {
            'Podgorica': 'Europe/Podgorica',
            'Nikšić': 'Europe/Podgorica',
            'Budva': 'Europe/Podgorica',
            'Bar': 'Europe/Podgorica',
            population_order: ['Podgorica', 'Nikšić', 'Budva'],
            metadata: {
                largest_city: 'Podgorica',
                timezone_notes: 'CET/CEST',
                special_status: 'Uses Euro despite not being in EU'
            }
        },
        'Serbia': {
            'Belgrade': 'Europe/Belgrade',
            'Novi Sad': 'Europe/Belgrade',
            'Niš': 'Europe/Belgrade',
            'Kragujevac': 'Europe/Belgrade',
            population_order: ['Belgrade', 'Novi Sad', 'Niš'],
            metadata: {
                largest_city: 'Belgrade',
                timezone_notes: 'CET/CEST',
                special_status: 'Largest city in former Yugoslavia'
            }
        },
        'Slovenia': {
            'Ljubljana': 'Europe/Ljubljana',
            'Maribor': 'Europe/Ljubljana',
            'Celje': 'Europe/Ljubljana',
            'Koper': 'Europe/Ljubljana',
            population_order: ['Ljubljana', 'Maribor', 'Celje'],
            metadata: {
                largest_city: 'Ljubljana',
                timezone_notes: 'CET/CEST',
                special_status: 'Most developed former Yugoslav republic'
            }
        },
        'Bosnia and Herzegovina': {
            'Sarajevo': 'Europe/Sarajevo',
            'Banja Luka': 'Europe/Sarajevo',
            'Tuzla': 'Europe/Sarajevo',
            'Zenica': 'Europe/Sarajevo',
            population_order: ['Sarajevo', 'Banja Luka', 'Tuzla'],
            metadata: {
                largest_city: 'Sarajevo',
                timezone_notes: 'CET/CEST',
                special_status: 'Complex political structure with two entities'
            }
        },
        'Belarus': {
            'Minsk': 'Europe/Minsk',
            'Gomel': 'Europe/Minsk',
            'Mogilev': 'Europe/Minsk',
            'Vitebsk': 'Europe/Minsk',
            population_order: ['Minsk', 'Gomel', 'Mogilev'],
            metadata: {
                largest_city: 'Minsk',
                timezone_notes: 'MSK (Moscow Time)',
                special_status: 'Uses same timezone as Moscow'
            }
        },
        'Moldova': {
            'Chișinău': 'Europe/Chisinau',
            'Bălți': 'Europe/Chisinau',
            'Orhei': 'Europe/Chisinau',
            'Ungheni': 'Europe/Chisinau',
            population_order: ['Chișinău', 'Bălți', 'Orhei'],
            metadata: {
                largest_city: 'Chișinău',
                timezone_notes: 'EET/EEST',
                special_status: 'EU candidate since 2022'
            }
        },
        'Slovakia': {
            'Bratislava': 'Europe/Bratislava',
            'Košice': 'Europe/Bratislava',
            'Prešov': 'Europe/Bratislava',
            'Žilina': 'Europe/Bratislava',
            population_order: ['Bratislava', 'Košice', 'Prešov'],
            metadata: {
                largest_city: 'Bratislava',
                timezone_notes: 'CET/CEST',
                special_status: 'Youngest capital in EU'
            }
        },
        'Luxembourg': {
            'Luxembourg City': 'Europe/Luxembourg',
            'Esch-sur-Alzette': 'Europe/Luxembourg',
            'Dudelange': 'Europe/Luxembourg',
            population_order: ['Luxembourg City', 'Esch-sur-Alzette', 'Dudelange'],
            metadata: {
                largest_city: 'Luxembourg City',
                timezone_notes: 'CET/CEST',
                special_status: 'Highest GDP per capita in EU'
            }
        },
        'Iceland': {
            'Reykjavík': 'Atlantic/Reykjavik',
            'Kópavogur': 'Atlantic/Reykjavik',
            'Hafnarfjörður': 'Atlantic/Reykjavik',
            'Akureyri': 'Atlantic/Reykjavik',
            population_order: ['Reykjavík', 'Kópavogur', 'Hafnarfjörður'],
            metadata: {
                largest_city: 'Reykjavík',
                timezone_notes: 'GMT (No DST)',
                special_status: 'Northernmost capital city'
            }
        },
        'Malta': {
            'Valletta': 'Europe/Malta',
            'Birkirkara': 'Europe/Malta',
            'Qormi': 'Europe/Malta',
            'Mosta': 'Europe/Malta',
            population_order: ['Birkirkara', 'Qormi', 'Valletta'],
            metadata: {
                largest_city: 'Birkirkara',
                timezone_notes: 'CET/CEST',
                special_status: 'Smallest EU country'
            }
        },
        'Cyprus': {
            'Nicosia': 'Asia/Nicosia',
            'Limassol': 'Asia/Nicosia',
            'Larnaca': 'Asia/Nicosia',
            'Paphos': 'Asia/Nicosia',
            population_order: ['Nicosia', 'Limassol', 'Larnaca'],
            metadata: {
                largest_city: 'Nicosia',
                timezone_notes: 'EET/EEST',
                special_status: 'Last divided capital in Europe'
            }
        },
        'Monaco': {
            'Monaco': 'Europe/Monaco',
            population_order: ['Monaco'],
            metadata: {
                largest_city: 'Monaco',
                timezone_notes: 'CET/CEST',
                special_status: 'Second smallest sovereign state'
            }
        },
        'Liechtenstein': {
            'Vaduz': 'Europe/Vaduz',
            'Schaan': 'Europe/Vaduz',
            population_order: ['Vaduz', 'Schaan'],
            metadata: {
                largest_city: 'Vaduz',
                timezone_notes: 'CET/CEST',
                special_status: 'Uses Swiss franc as currency'
            }
        },
        'Andorra': {
            'Andorra la Vella': 'Europe/Andorra',
            'Escaldes-Engordany': 'Europe/Andorra',
            population_order: ['Andorra la Vella', 'Escaldes-Engordany'],
            metadata: {
                largest_city: 'Andorra la Vella',
                timezone_notes: 'CET/CEST',
                special_status: 'Highest capital city in Europe'
            }
        },
        'San Marino': {
            'San Marino': 'Europe/San_Marino',
            'Serravalle': 'Europe/San_Marino',
            population_order: ['Serravalle', 'San Marino'],
            metadata: {
                largest_city: 'Serravalle',
                timezone_notes: 'CET/CEST',
                special_status: 'Oldest sovereign state'
            }
        },
        'Vatican City': {
            'Vatican City': 'Europe/Vatican',
            population_order: ['Vatican City'],
            metadata: {
                largest_city: 'Vatican City',
                timezone_notes: 'CET/CEST',
                special_status: 'Smallest sovereign state'
            }
        },
        'Faroe Islands': {
            'Tórshavn': 'Atlantic/Faroe',
            'Klaksvík': 'Atlantic/Faroe',
            population_order: ['Tórshavn', 'Klaksvík'],
            metadata: {
                largest_city: 'Tórshavn',
                timezone_notes: 'WET/WEST',
                special_status: 'Danish autonomous territory'
            }
        },
        'Gibraltar': {
            'Gibraltar': 'Europe/Gibraltar',
            population_order: ['Gibraltar'],
            metadata: {
                largest_city: 'Gibraltar',
                timezone_notes: 'CET/CEST',
                special_status: 'British Overseas Territory'
            }
        },
        'Guernsey': {
            'Saint Peter Port': 'Europe/Guernsey',
            population_order: ['Saint Peter Port'],
            metadata: {
                largest_city: 'Saint Peter Port',
                timezone_notes: 'GMT/BST',
                special_status: 'British Crown Dependency'
            }
        },
        'Isle of Man': {
            'Douglas': 'Europe/Isle_of_Man',
            'Ramsey': 'Europe/Isle_of_Man',
            population_order: ['Douglas', 'Ramsey'],
            metadata: {
                largest_city: 'Douglas',
                timezone_notes: 'GMT/BST',
                special_status: 'British Crown Dependency'
            }
        },
        'Jersey': {
            'Saint Helier': 'Europe/Jersey',
            population_order: ['Saint Helier'],
            metadata: {
                largest_city: 'Saint Helier',
                timezone_notes: 'GMT/BST',
                special_status: 'British Crown Dependency'
            }
        },
        'Svalbard': {
            'Longyearbyen': 'Arctic/Longyearbyen',
            population_order: ['Longyearbyen'],
            metadata: {
                largest_city: 'Longyearbyen',
                timezone_notes: 'CET/CEST',
                special_status: 'Norwegian territory in the Arctic'
            }
        }
    },

    'North America': {
        'United States': {
            // Eastern (UTC-5)
            'New York': 'America/New_York',
            'Washington DC': 'America/New_York',
            'Miami': 'America/New_York',
            'Atlanta': 'America/New_York',

            // Central (UTC-6)
            'Chicago': 'America/Chicago',
            'Houston': 'America/Chicago',
            'Dallas': 'America/Chicago',
            'San Antonio': 'America/Chicago',

            // Mountain (UTC-7)
            'Phoenix': 'America/Phoenix',
            'Denver': 'America/Denver',
            'Salt Lake City': 'America/Denver',
            'Albuquerque': 'America/Denver',

            // Pacific (UTC-8)
            'Los Angeles': 'America/Los_Angeles',
            'San Francisco': 'America/Los_Angeles',
            'Seattle': 'America/Los_Angeles',
            'San Diego': 'America/Los_Angeles',

            // Alaska & Hawaii
            'Anchorage': 'America/Anchorage',
            'Honolulu': 'Pacific/Honolulu',

            population_order: [
                'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
                'San Antonio', 'San Diego', 'Dallas', 'San Francisco',
                'Seattle', 'Denver', 'Washington DC', 'Atlanta', 'Miami',
                'Salt Lake City', 'Albuquerque', 'Anchorage', 'Honolulu'
            ],
            metadata: {
                largest_city: 'New York',
                timezone_notes: 'Spans 6 main time zones',
                timezone_populations: {
                    'New York': '8.8M',
                    'Chicago': '2.7M',
                    'Phoenix': '1.6M',
                    'Los Angeles': '4.0M',
                    'Anchorage': '291K',
                    'Honolulu': '350K'
                },
                special_cases: {
                    'Arizona': 'Does not observe DST except Navajo Nation',
                    'Hawaii': 'Does not observe DST',
                    'Indiana': 'Some counties observe Central Time'
                }
            }
        },
        'Canada': {
            // Eastern (UTC-5)
            'Toronto': 'America/Toronto',
            'Montreal': 'America/Montreal',
            'Ottawa': 'America/Toronto',

            // Central (UTC-6)
            'Winnipeg': 'America/Winnipeg',
            'Regina': 'America/Regina',
            'Saskatoon': 'America/Saskatchewan',

            // Mountain (UTC-7)
            'Calgary': 'America/Edmonton',
            'Edmonton': 'America/Edmonton',

            // Pacific (UTC-8)
            'Vancouver': 'America/Vancouver',
            'Victoria': 'America/Vancouver',

            // Atlantic (UTC-4)
            'Halifax': 'America/Halifax',

            // Newfoundland (UTC-3:30)
            'St. John\'s': 'America/St_Johns',

            'Whitehorse': 'America/Whitehorse',
            'Yellowknife': 'America/Yellowknife',
            'Iqaluit': 'America/Iqaluit',

            population_order: ['Toronto', 'Montreal', 'Vancouver', 'Calgary'],
            metadata: {
                largest_city: 'Toronto',
                timezone_notes: 'Spans 6 time zones',
                timezone_populations: {
                    'Toronto': '2.7M',
                    'Winnipeg': '749K',
                    'Calgary': '1.3M',
                    'Vancouver': '675K',
                    'Halifax': '403K',
                    'St. John\'s': '109K'
                },
                special_cases: {
                    'Newfoundland': 'UTC-3:30, only half-hour timezone in North America',
                    'Saskatchewan': 'Does not observe DST'
                }
            }
        },
        'Mexico': {
            'Mexico City': 'America/Mexico_City',
            'Guadalajara': 'America/Mexico_City',
            'Monterrey': 'America/Monterrey',
            'Tijuana': 'America/Tijuana',
            'Ciudad Juárez': 'America/Ojinaga',
            'Cancún': 'America/Cancun',
            'Mérida': 'America/Merida',
            'Hermosillo': 'America/Hermosillo',
            population_order: [
                'Mexico City', 'Guadalajara', 'Monterrey', 'Tijuana',
                'Ciudad Juárez', 'Cancún', 'Mérida', 'Hermosillo'
            ],
            metadata: {
                largest_city: 'Mexico City',
                timezone_notes: 'Four time zones',
                timezone_populations: {
                    'Mexico City': '9.2M',
                    'Tijuana': '1.8M',
                    'Hermosillo': '855K',
                    'Cancún': '628K'
                },
                special_status: 'Border cities often align with US time zones'
            }
        }
    },

    'South America': {
        'Argentina': {
            'Buenos Aires': 'America/Argentina/Buenos_Aires',
            'Córdoba': 'America/Argentina/Cordoba',
            'Rosario': 'America/Argentina/Buenos_Aires',
            'Mendoza': 'America/Argentina/Mendoza',
            'La Plata': 'America/Argentina/Buenos_Aires',
            'Mar del Plata': 'America/Argentina/Buenos_Aires',
            population_order: [
                'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza',
                'La Plata', 'Mar del Plata'
            ],
            metadata: {
                largest_city: 'Buenos Aires',
                timezone_notes: 'Multiple timezone regions',
                special_cases: {
                    'San Luis': 'Different timezone than surrounding regions'
                }
            }
        },
        'Brazil': {
            'São Paulo': 'America/Sao_Paulo',
            'Rio de Janeiro': 'America/Sao_Paulo',
            'Brasília': 'America/Sao_Paulo',
            'Salvador': 'America/Bahia',
            'Fortaleza': 'America/Fortaleza',
            'Manaus': 'America/Manaus',
            'Belém': 'America/Belem',
            'Porto Velho': 'America/Porto_Velho',
            'Rio Branco': 'America/Rio_Branco',
            population_order: [
                'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador',
                'Fortaleza', 'Manaus', 'Belém', 'Porto Velho', 'Rio Branco'
            ],
            metadata: {
                largest_city: 'São Paulo',
                timezone_notes: 'Multiple time zones',
                timezone_populations: {
                    'São Paulo': '12.3M',
                    'Manaus': '2.2M',
                    'Rio Branco': '413K'
                }
            }
        },
        'Chile': {
            // Continental Chile
            'Santiago': 'America/Santiago',
            'Valparaíso': 'America/Santiago',
            'Concepción': 'America/Santiago',
            'Antofagasta': 'America/Santiago',
            'Viña del Mar': 'America/Santiago',
            
            // Easter Island
            'Hanga Roa': 'Pacific/Easter',
            
            population_order: ['Santiago', 'Valparaíso', 'Concepción'],
            metadata: {
                largest_city: 'Santiago',
                timezone_notes: 'Continental Chile and Easter Island have different times',
                timezone_populations: {
                    'Santiago': '6.8M',
                    'Hanga Roa': '3.7K'
                },
                special_cases: {
                    'Easter Island': 'Separate timezone (Pacific/Easter)',
                    'Chilean Antarctic Territory': 'Uses America/Santiago time'
                }
            }
        },
        'Colombia': {
            'Bogotá': 'America/Bogota',
            'Medellín': 'America/Bogota',
            'Cali': 'America/Bogota',
            'Barranquilla': 'America/Bogota',
            'Cartagena': 'America/Bogota',
            population_order: ['Bogotá', 'Medellín', 'Cali'],
            metadata: {
                largest_city: 'Bogotá',
                timezone_notes: 'Single timezone for entire country'
            }
        },
        'Peru': {
            'Lima': 'America/Lima',
            'Arequipa': 'America/Lima',
            'Trujillo': 'America/Lima',
            'Cusco': 'America/Lima',
            'Chiclayo': 'America/Lima',
            population_order: ['Lima', 'Arequipa', 'Trujillo'],
            metadata: {
                largest_city: 'Lima',
                timezone_notes: 'PET (Peru Time)',
                special_status: 'Includes high-altitude cities'
            }
        },
        'Venezuela': {
            'Caracas': 'America/Caracas',
            'Maracaibo': 'America/Caracas',
            'Valencia': 'America/Caracas',
            'Barquisimeto': 'America/Caracas',
            'Maracay': 'America/Caracas',
            population_order: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay'],
            metadata: {
                largest_city: 'Caracas',
                timezone_notes: 'VET (Venezuelan Time)',
                special_status: 'Changed timezone offset in 2016'
            }
        },
        'Ecuador': {
            'Quito': 'America/Guayaquil',
            'Guayaquil': 'America/Guayaquil',
            'Cuenca': 'America/Guayaquil',
            'Galápagos Islands': 'Pacific/Galapagos',
            population_order: [
                'Guayaquil', 'Quito', 'Cuenca', 'Galápagos Islands'
            ],
            metadata: {
                largest_city: 'Guayaquil',
                timezone_notes: 'Mainland and Galápagos have different times',
                special_cases: {
                    'Galápagos': 'Separate timezone (Pacific/Galapagos)'
                }
            }
        },
        'Uruguay': {
            'Montevideo': 'America/Montevideo',
            'Salto': 'America/Montevideo',
            'Ciudad de la Costa': 'America/Montevideo',
            population_order: ['Montevideo', 'Salto', 'Ciudad de la Costa'],
            metadata: {
                largest_city: 'Montevideo',
                timezone_notes: 'UYT (Uruguay Time)'
            }
        },
        'Bolivia': {
            'La Paz': 'America/La_Paz',
            'Santa Cruz': 'America/La_Paz',
            'Cochabamba': 'America/La_Paz',
            'Sucre': 'America/La_Paz',
            'El Alto': 'America/La_Paz',
            population_order: ['Santa Cruz', 'La Paz', 'Cochabamba', 'Sucre', 'El Alto'],
            metadata: {
                largest_city: 'Santa Cruz',
                timezone_notes: 'BOT (Bolivia Time)',
                special_status: 'Two capitals: La Paz (administrative) and Sucre (constitutional)'
            }
        },
        'Paraguay': {
            'Asunción': 'America/Asuncion',
            'Ciudad del Este': 'America/Asuncion',
            'San Lorenzo': 'America/Asuncion',
            'Luque': 'America/Asuncion',
            population_order: ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque'],
            metadata: {
                largest_city: 'Asunción',
                timezone_notes: 'PYT/PYST (Paraguay Time)',
                special_status: 'Only South American country that observes DST'
            }
        },
        'Guyana': {
            'Georgetown': 'America/Guyana',
            'Linden': 'America/Guyana',
            'New Amsterdam': 'America/Guyana',
            population_order: ['Georgetown', 'Linden', 'New Amsterdam'],
            metadata: {
                largest_city: 'Georgetown',
                timezone_notes: 'GYT (Guyana Time)',
                special_status: 'Only English-speaking country in South America'
            }
        },
        'Suriname': {
            'Paramaribo': 'America/Paramaribo',
            'Lelydorp': 'America/Paramaribo',
            'Nieuw Nickerie': 'America/Paramaribo',
            population_order: ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie'],
            metadata: {
                largest_city: 'Paramaribo',
                timezone_notes: 'SRT (Suriname Time)',
                special_status: 'Only Dutch-speaking country in South America'
            }
        }
    },

    'Oceania': {
        'Australia': {
            'Sydney': 'Australia/Sydney',
            'Melbourne': 'Australia/Melbourne',
            'Brisbane': 'Australia/Brisbane',
            'Perth': 'Australia/Perth',
            'Adelaide': 'Australia/Adelaide',
            'Gold Coast': 'Australia/Brisbane',
            'Darwin': 'Australia/Darwin',
            'Hobart': 'Australia/Hobart',
            population_order: [
                'Sydney', 'Melbourne', 'Brisbane', 'Perth',
                'Adelaide', 'Gold Coast', 'Darwin', 'Hobart'
            ],
            metadata: {
                largest_city: 'Sydney',
                timezone_notes: 'Multiple time zones',
                timezone_populations: {
                    'Sydney': '5.3M',
                    'Perth': '2.1M',
                    'Darwin': '147K'
                }
            }
        },
        'New Zealand': {
            'Auckland': 'Pacific/Auckland',
            'Wellington': 'Pacific/Auckland',
            'Christchurch': 'Pacific/Auckland',
            'Hamilton': 'Pacific/Auckland',
            population_order: ['Auckland', 'Wellington', 'Christchurch'],
            metadata: {
                largest_city: 'Auckland',
                timezone_notes: 'NZST/NZDT'
            }
        }
    },

    'Territories': {
        'French Territories': {
            'French Polynesia': {
                'Papeete': 'Pacific/Tahiti',
                'Faaa': 'Pacific/Tahiti',
                population_order: ['Papeete', 'Faaa'],
                metadata: {
                    largest_city: 'Papeete',
                    timezone_notes: 'TAHT (Tahiti Time)',
                    special_status: 'French overseas collectivity'
                }
            },
            'New Caledonia': {
                'Nouméa': 'Pacific/Noumea',
                'Mont-Dore': 'Pacific/Noumea',
                population_order: ['Nouméa', 'Mont-Dore'],
                metadata: {
                    largest_city: 'Nouméa',
                    timezone_notes: 'NCT (New Caledonia Time)',
                    special_status: 'Special status under French constitution'
                }
            },
            'French Guiana': {
                'Cayenne': 'America/Cayenne',
                'Kourou': 'America/Cayenne',
                population_order: ['Cayenne', 'Kourou'],
                metadata: {
                    largest_city: 'Cayenne',
                    timezone_notes: 'GFT (French Guiana Time)',
                    special_status: 'French overseas department'
                }
            },
            'Réunion': {
                'Saint-Denis': 'Indian/Reunion',
                'Saint-Paul': 'Indian/Reunion',
                population_order: ['Saint-Denis', 'Saint-Paul'],
                metadata: {
                    largest_city: 'Saint-Denis',
                    timezone_notes: 'RET (Réunion Time)',
                    special_status: 'French overseas department'
                }
            },
            'Martinique': {
                'Fort-de-France': 'America/Martinique',
                'Le Lamentin': 'America/Martinique',
                population_order: ['Fort-de-France', 'Le Lamentin'],
                metadata: {
                    largest_city: 'Fort-de-France',
                    timezone_notes: 'AST (Atlantic Standard Time)',
                    special_status: 'French overseas department'
                }
            },
            'Guadeloupe': {
                'Basse-Terre': 'America/Guadeloupe',
                'Pointe-à-Pitre': 'America/Guadeloupe',
                population_order: ['Pointe-à-Pitre', 'Basse-Terre'],
                metadata: {
                    largest_city: 'Pointe-à-Pitre',
                    timezone_notes: 'AST (Atlantic Standard Time)',
                    special_status: 'French overseas department'
                }
            }
        },
        'Dutch Caribbean': {
            'Curaçao': {
                'Willemstad': 'America/Curacao',
                population_order: ['Willemstad'],
                metadata: {
                    largest_city: 'Willemstad',
                    timezone_notes: 'AST (Atlantic Standard Time)',
                    special_status: 'Constituent country of the Kingdom of Netherlands'
                }
            },
            'Aruba': {
                'Oranjestad': 'America/Aruba',
                population_order: ['Oranjestad'],
                metadata: {
                    largest_city: 'Oranjestad',
                    timezone_notes: 'AST (Atlantic Standard Time)',
                    special_status: 'Constituent country of the Kingdom of Netherlands'
                }
            },
            'Sint Maarten': {
                'Philipsburg': 'America/Lower_Princes',
                population_order: ['Philipsburg'],
                metadata: {
                    largest_city: 'Philipsburg',
                    timezone_notes: 'AST (Atlantic Standard Time)',
                    special_status: 'Constituent country of the Kingdom of Netherlands'
                }
            }
        },
        'Autonomous Regions': {
            'Greenland': {
                'Nuuk': 'America/Godthab',
                'Sisimiut': 'America/Godthab',
                'Ilulissat': 'America/Godthab',
                'Thule': 'America/Thule',
                'Ittoqqortoormiit': 'America/Scoresbysund',
                'Danmarkshavn': 'America/Danmarkshavn',
                population_order: ['Nuuk', 'Sisimiut', 'Ilulissat', 'Thule', 'Ittoqqortoormiit', 'Danmarkshavn'],
                metadata: {
                    largest_city: 'Nuuk',
                    timezone_notes: 'Four time zones',
                    timezone_populations: {
                        'Nuuk': '18.5K',
                        'Thule': '626',
                        'Ittoqqortoormiit': '345',
                        'Danmarkshavn': '8'
                    },
                    special_status: 'Autonomous territory of Denmark'
                }
            },
            'Hong Kong SAR': {
                'Hong Kong': 'Asia/Hong_Kong',
                'Kowloon': 'Asia/Hong_Kong',
                'Tsuen Wan': 'Asia/Hong_Kong',
                population_order: ['Hong Kong', 'Kowloon', 'Tsuen Wan'],
                metadata: {
                    largest_city: 'Hong Kong',
                    timezone_notes: 'HKT (Hong Kong Time)',
                    special_status: 'Special Administrative Region of China'
                }
            },
            'Macau SAR': {
                'Macau': 'Asia/Macau',
                'Taipa': 'Asia/Macau',
                population_order: ['Macau', 'Taipa'],
                metadata: {
                    largest_city: 'Macau',
                    timezone_notes: 'CST (China Standard Time)',
                    special_status: 'Special Administrative Region of China'
                }
            },
            'Åland Islands': {
                'Mariehamn': 'Europe/Mariehamn',
                population_order: ['Mariehamn'],
                metadata: {
                    largest_city: 'Mariehamn',
                    timezone_notes: 'EET/EEST',
                    special_status: 'Autonomous region of Finland'
                }
            }
        },
        'British Territories': {
            'Falkland Islands': {
                'Stanley': 'Atlantic/Stanley',
                population_order: ['Stanley'],
                metadata: {
                    largest_city: 'Stanley',
                    timezone_notes: 'FKST (Falkland Islands Standard Time)',
                    special_status: 'British Overseas Territory in South Atlantic'
                }
            },
            'South Georgia': {
                'King Edward Point': 'Atlantic/South_Georgia',
                population_order: ['King Edward Point'],
                metadata: {
                    largest_city: 'King Edward Point',
                    timezone_notes: 'GST (South Georgia Time, UTC-2)',
                    special_status: 'British Overseas Territory, research station'
                }
            }
        }
    }
};

// Metadata for regions and timezones
const regionMetadata = {
    'Caribbean': {
        parent_continent: 'North America',
        description: 'Island countries in the Caribbean Sea'
    },
    'Russia': {
        spans_continents: ['Europe', 'Asia'],
        timezone_count: 11,
        description: 'Largest country by land mass, spanning 11 time zones'
    },
    'China': {
        geographical_zones: 5,
        actual_zones: 1,
        description: 'Uses single timezone despite spanning 5 geographical zones'
    },

    'European Union': {
        timezone_groups: {
            'CET': ['Germany', 'France', 'Italy', 'Spain'],
            'EET': ['Romania', 'Bulgaria', 'Greece'],
            'WET': ['Portugal']
        },
        dst_practice: 'Coordinated DST changes across all member states',
        special_notes: 'Proposal to end DST changes under discussion'
    },

    'United States': {
        timezone_zones: {
            'Eastern': {
                standard: 'EST',
                daylight: 'EDT',
                offset: -5,
                major_cities: ['New York', 'Miami', 'Boston']
            },
            'Central': {
                standard: 'CST',
                daylight: 'CDT',
                offset: -6,
                major_cities: ['Chicago', 'Houston', 'Dallas']
            },
            'Mountain': {
                standard: 'MST',
                daylight: 'MDT',
                offset: -7,
                major_cities: ['Denver', 'Phoenix', 'Salt Lake City'],
                special_cases: {
                    'Arizona': 'Does not observe DST (except Navajo Nation)'
                }
            },
            'Pacific': {
                standard: 'PST',
                daylight: 'PDT',
                offset: -8,
                major_cities: ['Los Angeles', 'San Francisco', 'Seattle']
            }
        }
    }
};

// Add state/province information for larger countries
const administrativeRegions = {
    'United States': {
        'New York': { 
            state: 'New York',
            region: 'Northeast',
            type: 'city',
            metro_population: 18_823_000,
            timezone_details: {
                zone: 'Eastern',
                dst: true,
                utc_offset: -5
            }
        },
        'Los Angeles': { state: 'California', region: 'West Coast' },
        'Chicago': { state: 'Illinois', region: 'Midwest' }
        // ... more cities
    },
    'Canada': {
        'Toronto': { province: 'Ontario', region: 'Eastern Canada' },
        'Vancouver': { province: 'British Columbia', region: 'Western Canada' }
        // ... more cities
    },
    'China': {
        'Shanghai': {
            province: 'Municipality',
            region: 'Eastern China',
            type: 'municipality',
            metro_population: 27_796_000,
            timezone_details: {
                zone: 'Beijing Time',
                geographical_offset: +8,
                notes: 'Uses unified time despite geographical location'
            }
        }
        // ... other Chinese cities
    }
};

// Timezone anomalies and special cases
const timeZoneAnomalies = {
    'China': 'Single timezone despite spanning 5 geographical zones',
    'Russia': 'Uses 11 timezones, most of any country',
    'Nepal': 'UTC+5:45, one of the few zones offset by 45 minutes',
    'Australia': 'Some regions observe 30-minute offsets',
    'Antarctica': 'Stations can choose their timezone, often matching supply bases'
};

// Add this after timeZoneAnomalies
const countryToCode = {
    // Africa
    'Algeria': 'dz',
    'Egypt': 'eg',
    'Morocco': 'ma',
    'Nigeria': 'ng',
    'South Africa': 'za',
    'Kenya': 'ke',
    'Ethiopia': 'et',
    'Ghana': 'gh',
    'Tanzania': 'tz',
    'Sudan': 'sd',
    'Angola': 'ao',
    'Tunisia': 'tn',
    'Libya': 'ly',
    'Senegal': 'sn',
    'Côte d\'Ivoire': 'ci',
    'Mali': 'ml',
    'Burkina Faso': 'bf',
    'Niger': 'ne',
    'Chad': 'td',
    'Cameroon': 'cm',
    'Central African Republic': 'cf',
    'South Sudan': 'ss',
    'Uganda': 'ug',
    'Rwanda': 'rw',
    'Burundi': 'bi',
    'DR Congo': 'cd',
    'Somalia': 'so',
    'Djibouti': 'dj',
    'Eritrea': 'er',
    'Republic of Congo': 'cg',
    'Gabon': 'ga',
    'Zambia': 'zm',
    'Zimbabwe': 'zw',
    'Mozambique': 'mz',
    'Namibia': 'na',
    'Botswana': 'bw',
    'Guinea': 'gn',
    'Sierra Leone': 'sl',
    'Liberia': 'lr',
    'Gambia': 'gm',
    'Guinea-Bissau': 'gw',
    'Togo': 'tg',
    'Benin': 'bj',
    'Cape Verde': 'cv',
    'São Tomé and Príncipe': 'st',
    'Seychelles': 'sc',
    'Comoros': 'km',
    'Mauritius': 'mu',
    'Mauritania': 'mr',
    'Western Sahara': 'eh',

    // Asia
    'China': 'cn',
    'Japan': 'jp',
    'South Korea': 'kr',
    'India': 'in',
    'Indonesia': 'id',
    'Pakistan': 'pk',
    'Russia': 'ru',
    'Saudi Arabia': 'sa',
    'United Arab Emirates': 'ae',
    'Thailand': 'th',
    'Vietnam': 'vn',
    'Malaysia': 'my',
    'Singapore': 'sg',
    'Philippines': 'ph',
    'Taiwan': 'tw',
    'Bangladesh': 'bd',
    'Iran': 'ir',
    'Iraq': 'iq',
    'Syria': 'sy',
    'Lebanon': 'lb',
    'Jordan': 'jo',
    'Israel': 'il',
    'Kuwait': 'kw',
    'Bahrain': 'bh',
    'Qatar': 'qa',
    'Oman': 'om',
    'Yemen': 'ye',
    'Kazakhstan': 'kz',
    'Uzbekistan': 'uz',
    'Nepal': 'np',
    'Sri Lanka': 'lk',
    'Mongolia': 'mn',
    'North Korea': 'kp',
    'Myanmar': 'mm',
    'Laos': 'la',
    'Cambodia': 'kh',
    'Armenia': 'am',
    'Georgia': 'ge',
    'Azerbaijan': 'az',
    'Kyrgyzstan': 'kg',
    'Tajikistan': 'tj',
    'Turkmenistan': 'tm',
    'Brunei': 'bn',
    'Timor-Leste': 'tl',
    'Maldives': 'mv',
    'Bhutan': 'bt',

    // Europe
    'Austria': 'at',
    'Belgium': 'be',
    'Bulgaria': 'bg',
    'Croatia': 'hr',
    'Czech Republic': 'cz',
    'Denmark': 'dk',
    'Finland': 'fi',
    'France': 'fr',
    'Germany': 'de',
    'Greece': 'gr',
    'Hungary': 'hu',
    'Ireland': 'ie',
    'Italy': 'it',
    'Netherlands': 'nl',
    'Norway': 'no',
    'Poland': 'pl',
    'Portugal': 'pt',
    'Romania': 'ro',
    'Spain': 'es',
    'Sweden': 'se',
    'Switzerland': 'ch',
    'Ukraine': 'ua',
    'United Kingdom': 'gb',
    'Estonia': 'ee',
    'Latvia': 'lv',
    'Lithuania': 'lt',
    'Albania': 'al',
    'North Macedonia': 'mk',
    'Montenegro': 'me',
    'Serbia': 'rs',
    'Slovenia': 'si',
    'Bosnia and Herzegovina': 'ba',
    'Belarus': 'by',
    'Moldova': 'md',
    'Slovakia': 'sk',
    'Luxembourg': 'lu',
    'Iceland': 'is',
    'Malta': 'mt',
    'Cyprus': 'cy',
    'Monaco': 'mc',
    'Liechtenstein': 'li',
    'Andorra': 'ad',
    'San Marino': 'sm',
    'Vatican City': 'va',
    'Faroe Islands': 'fo',
    'Gibraltar': 'gi',
    'Guernsey': 'gg',
    'Isle of Man': 'im',
    'Jersey': 'je',
    'Svalbard': 'sj',

    // North America
    'United States': 'us',
    'Canada': 'ca',
    'Mexico': 'mx',

    // South America
    'Argentina': 'ar',
    'Brazil': 'br',
    'Chile': 'cl',
    'Colombia': 'co',
    'Ecuador': 'ec',
    'Peru': 'pe',
    'Uruguay': 'uy',
    'Venezuela': 've',
    'Bolivia': 'bo',
    'Paraguay': 'py',
    'Guyana': 'gy',
    'Suriname': 'sr',

    // Oceania
    'Australia': 'au',
    'New Zealand': 'nz',

    // Territories and Special Regions
    'French Polynesia': 'pf',
    'New Caledonia': 'nc',
    'French Guiana': 'gf',
    'Réunion': 're',
    'Martinique': 'mq',
    'Guadeloupe': 'gp',
    'Curaçao': 'cw',
    'Aruba': 'aw',
    'Sint Maarten': 'sx',
    'Greenland': 'gl',
    'Hong Kong SAR': 'hk',
    'Macau SAR': 'mo',
    'Åland Islands': 'ax',
    'Falkland Islands': 'fk',
    'South Georgia': 'gs'
}; 

// Add after timeZoneAnomalies and before countryToCode
const territorialRelationships = {
    'territory_types': {
        'sovereign_state': {
            description: 'Fully independent country with UN recognition',
            attributes: ['UN_member', 'self_governing', 'international_recognition']
        },
        'autonomous_region': {
            description: 'Region with significant self-governance within a sovereign state',
            attributes: ['partial_self_governing', 'special_status', 'parent_country']
        },
        'overseas_territory': {
            description: 'Non-contiguous territory under sovereignty of another state',
            attributes: ['administered_by', 'separate_governance', 'geographic_separation']
        },
        'special_administrative_region': {
            description: 'Region with separate political/economic system under sovereignty',
            attributes: ['high_autonomy', 'separate_system', 'time_limited']
        },
        'disputed_territory': {
            description: 'Area with contested sovereignty or administration',
            attributes: ['multiple_claims', 'uncertain_status', 'international_dispute']
        }
    },

    'cross_continental': {
        'Russia': {
            type: 'sovereign_state',
            continents: ['Europe', 'Asia'],
            primary_continent: 'Europe',
            division_line: 'Ural Mountains',
            regions: {
                'European': {
                    names: ['Northwestern', 'Central', 'Southern', 'Volga', 'North Caucasian'],
                    timezone_base: 'Europe/Moscow',
                    population_percentage: 77
                },
                'Asian': {
                    names: ['Ural', 'Siberian', 'Far Eastern'],
                    timezone_ranges: ['Asia/Yekaterinburg', 'Asia/Vladivostok'],
                    population_percentage: 23
                }
            },
            capital: {
                name: 'Moscow',
                location: 'Europe',
                timezone: 'Europe/Moscow'
            },
            special_notes: 'Largest country spanning two continents'
        },
        'Turkey': {
            type: 'sovereign_state',
            continents: ['Europe', 'Asia'],
            primary_continent: 'Asia',
            division_line: 'Bosphorus Strait',
            regions: {
                'European': {
                    names: ['East Thrace'],
                    timezone: 'Europe/Istanbul',
                    population_percentage: 10
                },
                'Asian': {
                    names: ['Anatolia'],
                    timezone: 'Europe/Istanbul',
                    population_percentage: 90
                }
            },
            capital: {
                name: 'Ankara',
                location: 'Asia',
                timezone: 'Europe/Istanbul'
            },
            special_notes: 'Transcontinental city of Istanbul spans both continents'
        }
    },

    'autonomous_regions': {
        'China': {
            'Hong Kong SAR': {
                type: 'special_administrative_region',
                status: {
                    current: 'Special Administrative Region',
                    valid_until: 2047,
                    future_status: 'Full integration with mainland China'
                },
                sovereignty: {
                    state: 'China',
                    agreement: 'Sino-British Joint Declaration',
                    year_established: 1997
                },
                governance: {
                    autonomy_level: 'High',
                    system: 'One country, two systems',
                    areas: ['except defense and foreign affairs']
                },
                separate_systems: {
                    timezone: {
                        status: true,
                        zone: 'Asia/Hong_Kong',
                        differs_from_mainland: true
                    },
                    currency: {
                        status: true,
                        name: 'Hong Kong Dollar',
                        code: 'HKD'
                    },
                    legal: {
                        status: true,
                        system: 'Common law',
                        differs_from_mainland: true
                    }
                },
                population: {
                    total: 7_500_000,
                    density: 7_140,
                    year: 2021
                }
            },
            'Macau SAR': {
                type: 'special_administrative_region',
                status: {
                    current: 'Special Administrative Region',
                    valid_until: 2049,
                    future_status: 'Full integration with mainland China'
                },
                sovereignty: {
                    state: 'China',
                    agreement: 'Sino-Portuguese Joint Declaration',
                    year_established: 1999
                },
                governance: {
                    autonomy_level: 'High',
                    system: 'One country, two systems',
                    areas: ['except defense and foreign affairs']
                },
                separate_systems: {
                    timezone: {
                        status: false,
                        zone: 'Asia/Macau',
                        differs_from_mainland: false
                    },
                    currency: {
                        status: true,
                        name: 'Macanese Pataca',
                        code: 'MOP'
                    },
                    legal: {
                        status: true,
                        system: 'Civil law',
                        differs_from_mainland: true
                    }
                },
                population: {
                    total: 680_000,
                    density: 21_340,
                    year: 2021
                }
            }
        },
        'Denmark': {
            'Greenland': {
                type: 'autonomous_territory',
                status: {
                    current: 'Autonomous Territory',
                    year_established: 1979,
                    recent_changes: '2009 Self Rule Act'
                },
                sovereignty: {
                    state: 'Denmark',
                    representation: 'Two seats in Danish Parliament'
                },
                governance: {
                    autonomy_level: 'High',
                    self_governing_areas: ['domestic affairs', 'economic management'],
                    denmark_controlled: ['foreign policy', 'defense', 'monetary policy']
                },
                separate_systems: {
                    timezone: {
                        status: true,
                        zones: ['America/Godthab', 'America/Thule'],
                        note: 'Multiple zones due to size'
                    },
                    currency: {
                        status: false,
                        uses: 'Danish Krone'
                    }
                },
                population: {
                    total: 56_000,
                    density: 0.026,
                    year: 2021
                },
                special_characteristics: {
                    geography: 'World\'s largest island',
                    climate: 'Arctic to subarctic',
                    resources: 'Significant mineral deposits'
                }
            }
        }
    },

    'overseas_territories': {
        'France': {
            classification: {
                'departments': {
                    type: 'integral_part',
                    status: 'Same as metropolitan France',
                    eu_membership: true
                },
                'collectivities': {
                    type: 'autonomous',
                    status: 'Special legislative status',
                    eu_membership: 'Associate'
                }
            },
            territories: {
                'French Polynesia': {
                    type: 'overseas_collectivity',
                    category: 'collectivities',
                    location: {
                        continent: 'Oceania',
                        region: 'South Pacific',
                        capital: 'Papeete'
                    },
                    governance: {
                        autonomy_level: 'Medium',
                        local_government: true,
                        representation_in_france: true,
                        timezone: {
                            primary: 'Pacific/Tahiti',
                            offset: -10,
                            dst: false
                        }
                    },
                    population: {
                        total: 280_000,
                        year: 2021
                    }
                },
                'New Caledonia': {
                    type: 'special_status_collectivity',
                    category: 'special_status',
                    location: {
                        continent: 'Oceania',
                        region: 'South Pacific',
                        capital: 'Nouméa'
                    },
                    governance: {
                        autonomy_level: 'High',
                        status: 'Sui generis collectivity',
                        independence_referendums: [2018, 2020, 2021]
                    },
                    timezone: {
                        primary: 'Pacific/Noumea',
                        offset: 11,
                        dst: false
                    },
                    population: {
                        total: 271_000,
                        year: 2021
                    }
                }
            }
        },
        'United Kingdom': {
            classification: {
                'overseas_territories': {
                    type: 'dependent_territory',
                    status: 'Under British sovereignty',
                    relationship: 'Not part of UK'
                },
                'crown_dependencies': {
                    type: 'possession_of_crown',
                    status: 'Not part of UK',
                    relationship: 'British Crown responsibility'
                }
            },
            territories: {
                'Bermuda': {
                    type: 'overseas_territory',
                    location: {
                        continent: 'North America',
                        region: 'North Atlantic',
                        capital: 'Hamilton'
                    },
                    governance: {
                        autonomy_level: 'High',
                        government_type: 'Parliamentary democracy',
                        uk_responsibility: ['defense', 'international relations']
                    },
                    timezone: {
                        primary: 'Atlantic/Bermuda',
                        offset: -4,
                        dst: true
                    },
                    population: {
                        total: 64_000,
                        year: 2021
                    }
                }
            },
            crown_dependencies: {
                'Isle of Man': {
                    type: 'crown_dependency',
                    location: {
                        region: 'British Isles',
                        capital: 'Douglas'
                    },
                    governance: {
                        autonomy_level: 'High',
                        government_type: 'Parliamentary democracy',
                        special_status: 'Not part of UK but British Crown responsibility'
                    },
                    timezone: {
                        primary: 'Europe/Isle_of_Man',
                        offset: 0,
                        dst: true,
                        follows: 'UK time'
                    },
                    population: {
                        total: 85_000,
                        year: 2021
                    }
                }
            }
        }
    },

    'disputed_territories': {
        'Western Sahara': {
            type: 'disputed_territory',
            status: {
                current: 'Non-self-governing territory',
                un_classification: 'Non-self-governing territory',
                year_dispute_started: 1975
            },
            claims: {
                parties: ['Morocco', 'Sahrawi Arab Democratic Republic'],
                control: {
                    morocco: 'Approximately 80% (west)',
                    polisario: 'Approximately 20% (east)'
                }
            },
            administration: {
                primary: 'Morocco',
                actual_control: 'Split between Morocco and SADR',
                un_presence: 'MINURSO peacekeeping mission'
            },
            international_recognition: {
                sadr: {
                    recognized_by: 'African Union and 40+ UN members',
                    status: 'Partially recognized state'
                },
                morocco: {
                    position: 'Claims territorial integrity',
                    autonomy_offer: 'Proposed autonomy under Moroccan sovereignty'
                }
            },
            practical_arrangements: {
                timezone: {
                    zone: 'Africa/El_Aaiun',
                    controlled_by: 'Morocco'
                },
                population: {
                    total: 597_000,
                    year: 2021,
                    note: 'Includes Moroccan settlers'
                }
            }
        }
    }
};