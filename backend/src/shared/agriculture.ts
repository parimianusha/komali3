// ==============================================================================
// AgriSage AI: Agricultural Constants, Indian Regional Data & Crop Catalog
// ==============================================================================

export const SUPPORTED_LANGUAGES = ['en', 'te', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; nativeName: string }> = {
  en: { label: 'English', nativeName: 'English' },
  te: { label: 'Telugu', nativeName: 'తెలుగు' },
  hi: { label: 'Hindi', nativeName: 'हिन्दी' },
};

// ------------------------------------------------------------------------------
// Document Categories (with Agricultural Document Types)
// ------------------------------------------------------------------------------
export const AGRI_DOCUMENT_CATEGORIES = [
  'soil_test_report',
  'fertilizer_recommendation',
  'lab_report',
  'crop_insurance',
  'agricultural_scheme',
  'seed_input_bill',
  'cultivation_note',
  'invoice',
  'receipt',
  'contract',
  'report',
  'other',
] as const;

export type AgriDocumentCategory = (typeof AGRI_DOCUMENT_CATEGORIES)[number];

export const AGRI_DOCUMENT_LABELS: Record<AgriDocumentCategory, { en: string; te: string; hi: string }> = {
  soil_test_report: {
    en: 'Soil Health Card / Test Report',
    te: 'నేల ఆరోగ్య కార్డు / పరీక్ష నివేదిక',
    hi: 'मृदा स्वास्थ्य कार्ड / परीक्षण रिपोर्ट',
  },
  fertilizer_recommendation: {
    en: 'Fertilizer & Nutrient Guide',
    te: 'ఎరువుల & పోషకాల సిఫార్సు',
    hi: 'उर्वरक एवं पोषक तत्व अनुशंसा',
  },
  lab_report: {
    en: 'Agricultural Lab / Water Test Report',
    te: 'వ్యవసాయ ల్యాబ్ / నీటి పరీక్ష నివేదిక',
    hi: 'कृषि प्रयोगशाला / जल परीक्षण रिपोर्ट',
  },
  crop_insurance: {
    en: 'Crop Insurance Document (PMFBY)',
    te: 'పంట బీమా పత్రం (PMFBY)',
    hi: 'फसल बीमा दस्तावेज (PMFBY)',
  },
  agricultural_scheme: {
    en: 'Government Agricultural Scheme / Subsidy',
    te: 'ప్రభుత్వ వ్యవసాయ పథకం / రాయితీ',
    hi: 'सरकारी कृषि योजना / सब्सिडी',
  },
  seed_input_bill: {
    en: 'Seed & Agri-Input Purchase Bill',
    te: 'విత్తనాలు & ఇన్‌పుట్ కొనుగోలు రశీదు',
    hi: 'बीज एवं कृषि इनपुट खरीद बिल',
  },
  cultivation_note: {
    en: 'Farm Log / Cultivation Field Note',
    te: 'వ్యవసాయ లాగ్ / క్షేత్ర గమనిక',
    hi: 'फार्म लॉग / खेती नोट',
  },
  invoice: {
    en: 'Invoice / Commercial Bill',
    te: 'ఇన్వాయిస్ / బిల్లు',
    hi: 'चालान / बिल',
  },
  receipt: {
    en: 'Payment Receipt',
    te: 'చెల్లింపు రసీదు',
    hi: 'भुगतान रसीद',
  },
  contract: {
    en: 'Farming Agreement / Contract',
    te: 'వ్యవసాయ ఒప్పందం',
    hi: 'कृषि अनुबंध',
  },
  report: {
    en: 'General Agricultural Report',
    te: 'సాధారణ వ్యవసాయ నివేదిక',
    hi: 'सामान्य कृषि रिपोर्ट',
  },
  other: {
    en: 'Other Agricultural Document',
    te: 'ఇతర వ్యవసాయ పత్రం',
    hi: 'अन्य कृषि दस्तावेज',
  },
};

// ------------------------------------------------------------------------------
// Soil Types & Characteristics
// ------------------------------------------------------------------------------
export const SOIL_TYPES = [
  'alluvial',
  'black',
  'red',
  'laterite',
  'arid',
  'clayey',
  'loamy',
  'sandy',
  'silt',
  'other',
] as const;

export type SoilType = (typeof SOIL_TYPES)[number];

export const SOIL_TYPE_LABELS: Record<SoilType, { en: string; te: string; hi: string }> = {
  alluvial: { en: 'Alluvial Soil (Polam / Loam)', te: 'ఒండ్రు నేల (అల్లూవియల్)', hi: 'जलोढ़ मिट्टी' },
  black: { en: 'Black Soil / Regur (Nalla Regada)', te: 'నల్లరేగడి నేల (రెగూర్)', hi: 'काली मिट्टी / रेगुर' },
  red: { en: 'Red & Yellow Soil (Erra Nelalu)', te: 'ఎర్ర నేలలు', hi: 'लाल एवं पीली मिट्टी' },
  laterite: { en: 'Laterite Soil', te: 'లాటరైట్ నేల', hi: 'लेटराइट मिट्टी' },
  arid: { en: 'Arid / Desert Sandy Soil', te: 'ఎడారి / ఇసుక నేల', hi: 'शुष्क / रेतीली मिट्टी' },
  clayey: { en: 'Clayey Heavy Soil', te: 'బంకమట్టి నేల', hi: 'चिकनी मिट्टी' },
  loamy: { en: 'Loamy Rich Soil', te: 'గోధుమ రంగు లోమీ నేల', hi: 'दोमट मिट्टी' },
  sandy: { en: 'Sandy Soil', te: 'ఇసుక నేల', hi: 'बलुई मिट्टी' },
  silt: { en: 'Silt Soil', te: 'సిల్ట్ నేల', hi: 'गाद मिट्टी' },
  other: { en: 'Other / Mixed Soil', te: 'ఇతర నేల రకం', hi: 'अन्य मिट्टी' },
};

// ------------------------------------------------------------------------------
// Irrigation Methods & Water Availability
// ------------------------------------------------------------------------------
export const IRRIGATION_METHODS = [
  'drip',
  'sprinkler',
  'canal_flood',
  'borewell',
  'rainfed',
  'furrow',
  'other',
] as const;

export type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];

export const IRRIGATION_LABELS: Record<IrrigationMethod, { en: string; te: string; hi: string }> = {
  drip: { en: 'Drip Irrigation (Micro)', te: 'బిందు సేద్యం (డ్రిప్)', hi: 'ड्रिप सिंचाई (टपक)' },
  sprinkler: { en: 'Sprinkler Irrigation', te: 'తుంపర సేద్యం (స్ప్రింక్లర్)', hi: 'फव्वारा सिंचाई' },
  canal_flood: { en: 'Canal / Flood Basin', te: 'కాలువ / వరద పద్ధతి', hi: 'नहर / बाढ़ विधि' },
  borewell: { en: 'Borewell / Tube Well', te: 'బోరు బావి / ట్యూబ్‌వెల్', hi: 'बोरवेल / नलकूप' },
  rainfed: { en: 'Rainfed (Muggu / Dryland)', te: 'వర్షాధార సాగు', hi: 'वर्षा आधारित (बारानी)' },
  furrow: { en: 'Furrow / Ridge Irrigation', te: 'కాలువలు & గట్లు పద్ధతి', hi: 'कूड़ / क्यारी सिंचाई' },
  other: { en: 'Other Method', te: 'ఇతర నీటిపారుదల పద్ధతి', hi: 'अन्य सिंचाई विधि' },
};

export const WATER_AVAILABILITY = ['abundant', 'moderate', 'seasonal', 'scarce'] as const;
export type WaterAvailability = (typeof WATER_AVAILABILITY)[number];

// ------------------------------------------------------------------------------
// Growth Stages & Seasons
// ------------------------------------------------------------------------------
export const GROWTH_STAGES = [
  'germination',
  'vegetative',
  'tillering_flowering',
  'fruit_grain_development',
  'maturity_harvest',
  'post_harvest',
] as const;

export type GrowthStage = (typeof GROWTH_STAGES)[number];

export const GROWTH_STAGE_LABELS: Record<GrowthStage, { en: string; te: string; hi: string }> = {
  germination: { en: 'Germination & Seedling', te: 'మొలక & నారు దశ', hi: 'अंकुरण एवं पौध अवस्था' },
  vegetative: { en: 'Vegetative Growth', te: 'శాకీయ ఎదుగుదల దశ', hi: 'वानस्पतिक वृद्धि' },
  tillering_flowering: { en: 'Tillering / Flowering', te: 'పిలకలు / పూత దశ', hi: 'कल्ले फूटना / फूल आना' },
  fruit_grain_development: { en: 'Fruit / Grain Filling', te: 'కాయ / గింజ నిండే దశ', hi: 'फल / दाना भराव' },
  maturity_harvest: { en: 'Maturity & Harvesting', te: 'పక్వత & కోత దశ', hi: 'परिपक्वता एवं कटाई' },
  post_harvest: { en: 'Post-Harvest & Storage', te: 'కోతానంతర & నిల్వ దశ', hi: 'कटाई उपरांत एवं भंडारण' },
};

export const SEASONS = ['kharif', 'rabi', 'zaid', 'whole_year'] as const;
export type CropSeason = (typeof SEASONS)[number];

export const SEASON_LABELS: Record<CropSeason, { en: string; te: string; hi: string }> = {
  kharif: { en: 'Kharif (Monsoon / June - Oct)', te: 'ఖరీఫ్ (వర్షాకాలం)', hi: 'खरीफ (मानसून)' },
  rabi: { en: 'Rabi (Winter / Nov - April)', te: 'రబీ (శీతాకాలం)', hi: 'रबी (सर्दियों की फसल)' },
  zaid: { en: 'Zaid (Summer / March - June)', te: 'జైద్ (వేసవి కాలం)', hi: 'जायद (गर्मी की फसल)' },
  whole_year: { en: 'Perennial / Whole Year', te: 'సంవత్సరం పొడవునా', hi: 'वार्षिक / बारहमासी' },
};

// ------------------------------------------------------------------------------
// Advisory Categories
// ------------------------------------------------------------------------------
export const ADVISORY_CATEGORIES = [
  'disease_pest',
  'crop_selection',
  'nutrient_management',
  'soil_health',
  'irrigation_water',
  'weed_management',
  'harvest_post_harvest',
  'climate_weather',
  'general_management',
  'document_interpretation',
] as const;

export type AdvisoryCategory = (typeof ADVISORY_CATEGORIES)[number];

export const ADVISORY_CATEGORY_INFO: Record<
  AdvisoryCategory,
  { title: { en: string; te: string; hi: string }; icon: string; description: { en: string; te: string; hi: string } }
> = {
  disease_pest: {
    title: { en: 'Pest & Disease Diagnosis', te: 'చీడపీడలు & తెగుళ్ల నిర్ధారణ', hi: 'कीट एवं रोग निदान' },
    icon: 'Bug',
    description: {
      en: 'Diagnose leaf yellowing, wilting, spots, insect attack with photo analysis.',
      te: 'ఆకులు పసుపుబారడం, మచ్చలు, పురుగుల దాడిని ఫోటోతో నిర్ధారించండి.',
      hi: 'पत्तियों का पीलापन, धब्बे, कीट प्रकोप का फोटो द्वारा विश्लेषण।',
    },
  },
  crop_selection: {
    title: { en: 'Crop Selection & Suitability', te: 'పంట ఎంపిక & అనుకూలత', hi: 'फसल चयन एवं उपयुक्तता' },
    icon: 'Sparkles',
    description: {
      en: 'Evaluate best crop options based on soil, district, water, and season.',
      te: 'మీ నేల, జిల్లా, నీటి లభ్యత ఆధారంగా ఉత్తమ పంటను ఎంచుకోండి.',
      hi: 'मिट्टी, जिले, पानी और मौसम के अनुसार सर्वोत्तम फसल का चयन।',
    },
  },
  nutrient_management: {
    title: { en: 'Nutrient & Fertilizer Advisory', te: 'పోషకాలు & ఎరువుల సలహా', hi: 'पोषक तत्व एवं उर्वरक सलाह' },
    icon: 'FlaskConical',
    description: {
      en: 'Tailored NPK dosages, organic biofertilizers, and deficiency cures.',
      te: 'సరైన NPK మోతాదు, సేంద్రీయ ఎరువులు, సూక్ష్మపోషకాల నివారణ.',
      hi: 'सटीक एनपीके मात्रा, जैविक खाद और सूक्ष्म पोषक तत्व सुधार।',
    },
  },
  soil_health: {
    title: { en: 'Soil Health & Conditioning', te: 'నేల ఆరోగ్యం & సారం', hi: 'मृदा स्वास्थ्य एवं सुधार' },
    icon: 'Layers',
    description: {
      en: 'Soil pH correction (lime/gypsum), organic carbon enhancement.',
      te: 'నేల pH సవరణ, సేంద్రీయ కర్బనం పెంపుదల మార్గాలు.',
      hi: 'मिट्टी का पीएच सुधार, जैविक कार्बन वृद्धि के उपाय।',
    },
  },
  irrigation_water: {
    title: { en: 'Irrigation & Water Scheduling', te: 'నీటిపారుదల & తడుల నిర్వహణ', hi: 'सिंचाई एवं जल प्रबंधन' },
    icon: 'Droplets',
    description: {
      en: 'Water budgeting, drip scheduling, critical growth stage watering.',
      te: 'కీలక దశల్లో నీటి తడులు, డ్రిప్ నీటి యాజమాన్యం.',
      hi: 'महत्वपूर्ण चरणों में पानी, ड्रिप शेड्यूलिंग और जल संरक्षण।',
    },
  },
  weed_management: {
    title: { en: 'Weed Control & Inter-cultivation', te: 'కలుపు యాజమాన్యం', hi: 'खरपतवार नियंत्रण' },
    icon: 'Scissors',
    description: {
      en: 'Safe integrated weed management, mulching, manual weeding schedules.',
      te: 'సమగ్ర కలుపు నివారణ, మల్చింగ్, కలుపు తీసే సమయాలు.',
      hi: 'एकीकृत खरपतवार प्रबंधन, मल्चिंग और निराई-गुड़ाई समय सारणी।',
    },
  },
  harvest_post_harvest: {
    title: { en: 'Harvesting & Storage', te: 'కోత & నిల్వ సలహాలు', hi: 'कटाई एवं भंडारण सलाह' },
    icon: 'Warehouse',
    description: {
      en: 'Optimal maturity indices, moisture levels, safe grain storage.',
      te: 'సరైన కోత సమయం, తేమ శాతం, ధాన్యం భద్రపరచడం.',
      hi: 'कटाई का सही समय, नमी का स्तर और सुरक्षित भंडारण।',
    },
  },
  climate_weather: {
    title: { en: 'Weather-Informed Advisory', te: 'వాతావరణ ఆధారిత సలహా', hi: 'मौसम आधारित सलाह' },
    icon: 'CloudSun',
    description: {
      en: 'Actionable farming decisions based on local rainfall & temperature forecasts.',
      te: 'వర్షం, ఉష్ణోగ్రత సూచనల ప్రకారం వ్యవసాయ నిర్ణయాలు.',
      hi: 'वर्षा और तापमान पूर्वानुमान के आधार पर कृषि निर्णय।',
    },
  },
  general_management: {
    title: { en: 'General Crop Care', te: 'సాధారణ పంట సంరక్షణ', hi: 'सामान्य फसल प्रबंधन' },
    icon: 'Sprout',
    description: {
      en: 'Holistic good agricultural practices (GAP) for maximum yield.',
      te: 'మంచి దిగుబడి కోసం సమగ్ర వ్యవసాయ పద్ధతులు.',
      hi: 'अधिकतम उपज के लिए उत्तम कृषि पद्धतियां (GAP)।',
    },
  },
  document_interpretation: {
    title: { en: 'Agricultural Document Analysis', te: 'వ్యవసాయ పత్రాల విశ్లేషణ', hi: 'कृषि दस्तावेज विश्लेषण' },
    icon: 'FileText',
    description: {
      en: 'Interpret Soil Health Cards, lab reports, and fertilizer guidelines.',
      te: 'నేల ఆరోగ్య కార్డులు, ల్యాబ్ రిపోర్టుల అర్థం మరియు ఆచరణ.',
      hi: 'मृदा स्वास्थ्य कार्ड एवं लैब रिपोर्ट की सरल व्याख्या।',
    },
  },
};

// ------------------------------------------------------------------------------
// Indian Crop Catalog
// ------------------------------------------------------------------------------
export interface CatalogCrop {
  name: string;
  category: 'Cereal' | 'Pulse' | 'Oilseed' | 'Cash Crop' | 'Vegetable' | 'Spices' | 'Fruit';
  popularVarieties: string[];
  idealSeasons: CropSeason[];
  idealSoil: SoilType[];
  waterRequirement: WaterAvailability;
  typicalDurationDays: number;
}

export const INDIAN_CROP_CATALOG: CatalogCrop[] = [
  {
    name: 'Rice (Paddy)',
    category: 'Cereal',
    popularVarieties: ['BPT 5204 (Samba Mahsuri)', 'MTU 1010', 'Swarna (MTU 7029)', 'IR 64', 'Basmati Pusa 1121'],
    idealSeasons: ['kharif', 'rabi'],
    idealSoil: ['clayey', 'alluvial', 'black'],
    waterRequirement: 'abundant',
    typicalDurationDays: 135,
  },
  {
    name: 'Wheat',
    category: 'Cereal',
    popularVarieties: ['HD 2967', 'HD 3086', 'PBW 343', 'DBW 187 (Karan Vandana)', 'Sharbati'],
    idealSeasons: ['rabi'],
    idealSoil: ['loamy', 'alluvial', 'clayey'],
    waterRequirement: 'moderate',
    typicalDurationDays: 120,
  },
  {
    name: 'Cotton',
    category: 'Cash Crop',
    popularVarieties: ['Bt Cotton RCH 659', 'Bollgard II', 'Suraj', 'MCU 5', 'DCH 32'],
    idealSeasons: ['kharif'],
    idealSoil: ['black', 'alluvial', 'red'],
    waterRequirement: 'moderate',
    typicalDurationDays: 160,
  },
  {
    name: 'Chilli',
    category: 'Spices',
    popularVarieties: ['Guntur Sannam (S4)', 'Teja', 'Byadagi', 'LCA 334', 'Kashi Anmol'],
    idealSeasons: ['kharif', 'rabi'],
    idealSoil: ['black', 'red', 'loamy'],
    waterRequirement: 'moderate',
    typicalDurationDays: 150,
  },
  {
    name: 'Tomato',
    category: 'Vegetable',
    popularVarieties: ['Arka Rakshak', 'Pusa Ruby', 'Abhinav', 'US 440', 'Sivam'],
    idealSeasons: ['kharif', 'rabi', 'zaid'],
    idealSoil: ['loamy', 'red', 'alluvial'],
    waterRequirement: 'moderate',
    typicalDurationDays: 105,
  },
  {
    name: 'Maize (Corn)',
    category: 'Cereal',
    popularVarieties: ['Pioneer 3396', 'DeKalb 9108', 'DHM 117', 'Ganga 11', 'Sankul'],
    idealSeasons: ['kharif', 'rabi'],
    idealSoil: ['alluvial', 'red', 'loamy'],
    waterRequirement: 'moderate',
    typicalDurationDays: 100,
  },
  {
    name: 'Soybean',
    category: 'Oilseed',
    popularVarieties: ['JS 335', 'JS 95-60', 'NRC 37', 'MACS 1407', 'RVS 2001-4'],
    idealSeasons: ['kharif'],
    idealSoil: ['black', 'loamy', 'alluvial'],
    waterRequirement: 'moderate',
    typicalDurationDays: 95,
  },
  {
    name: 'Groundnut (Peanut)',
    category: 'Oilseed',
    popularVarieties: ['Kadiri 6 (K6)', 'Kadiri Lepakshi (K1812)', 'TAG 24', 'TMV 2', 'Greeshma'],
    idealSeasons: ['kharif', 'rabi', 'zaid'],
    idealSoil: ['sandy', 'red', 'loamy'],
    waterRequirement: 'seasonal',
    typicalDurationDays: 110,
  },
  {
    name: 'Sugarcane',
    category: 'Cash Crop',
    popularVarieties: ['Co 0238', 'Co 86032 (Nayana)', 'CoM 0265', 'CoLk 94184'],
    idealSeasons: ['whole_year'],
    idealSoil: ['alluvial', 'black', 'loamy'],
    waterRequirement: 'abundant',
    typicalDurationDays: 360,
  },
  {
    name: 'Onion',
    category: 'Vegetable',
    popularVarieties: ['Bhima Super', 'Agrifound Dark Red', 'Nasik Red', 'Pusa Red', 'Arka Kalyan'],
    idealSeasons: ['kharif', 'rabi'],
    idealSoil: ['loamy', 'alluvial', 'black'],
    waterRequirement: 'moderate',
    typicalDurationDays: 120,
  },
  {
    name: 'Chickpea (Bengal Gram / Chana)',
    category: 'Pulse',
    popularVarieties: ['JG 11', 'JAKIE 9218', 'Pusa 362', 'KAK 2 (Kabuli)', 'Digvijay'],
    idealSeasons: ['rabi'],
    idealSoil: ['black', 'loamy', 'clayey'],
    waterRequirement: 'scarce',
    typicalDurationDays: 100,
  },
  {
    name: 'Pigeon Pea (Red Gram / Toor / Arhar)',
    category: 'Pulse',
    popularVarieties: ['ICPL 87119 (Asha)', 'BDN 711', 'Maruti (ICP 8863)', 'Pusa 992'],
    idealSeasons: ['kharif'],
    idealSoil: ['black', 'red', 'alluvial'],
    waterRequirement: 'seasonal',
    typicalDurationDays: 160,
  },
  {
    name: 'Potato',
    category: 'Vegetable',
    popularVarieties: ['Kufri Jyoti', 'Kufri Pukhraj', 'Kufri Bahar', 'Kufri Chipsona'],
    idealSeasons: ['rabi'],
    idealSoil: ['loamy', 'alluvial', 'sandy'],
    waterRequirement: 'moderate',
    typicalDurationDays: 90,
  },
  {
    name: 'Millets (Pearl Millet / Bajra, Jowar, Ragi)',
    category: 'Cereal',
    popularVarieties: ['HHB 67 Improved (Bajra)', 'CSV 20 (Jowar)', 'GPU 28 (Ragi)', 'ML 365'],
    idealSeasons: ['kharif', 'zaid'],
    idealSoil: ['arid', 'sandy', 'red', 'loamy'],
    waterRequirement: 'scarce',
    typicalDurationDays: 85,
  },
];

// ------------------------------------------------------------------------------
// Indian States & Representative District Coordinates for Weather Lookups
// ------------------------------------------------------------------------------
export interface IndianLocationInfo {
  state: string;
  district: string;
  lat: number;
  lon: number;
}

export const INDIAN_LOCATIONS: IndianLocationInfo[] = [
  // Andhra Pradesh
  { state: 'Andhra Pradesh', district: 'Guntur', lat: 16.3067, lon: 80.4365 },
  { state: 'Andhra Pradesh', district: 'Vijayawada (NTR)', lat: 16.5062, lon: 80.648 },
  { state: 'Andhra Pradesh', district: 'Kurnool', lat: 15.8281, lon: 78.0373 },
  { state: 'Andhra Pradesh', district: 'Ananthapuramu', lat: 14.6819, lon: 77.6006 },
  { state: 'Andhra Pradesh', district: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { state: 'Andhra Pradesh', district: 'East Godavari (Rajahmundry)', lat: 17.0005, lon: 81.804 },
  { state: 'Andhra Pradesh', district: 'West Godavari (Eluru)', lat: 16.7107, lon: 81.0952 },
  { state: 'Andhra Pradesh', district: 'Tirupati (Chittoor)', lat: 13.6288, lon: 79.4192 },
  { state: 'Andhra Pradesh', district: 'Kadapa (YSR)', lat: 14.4673, lon: 78.8242 },
  { state: 'Andhra Pradesh', district: 'Nellore (SPSR)', lat: 14.4426, lon: 79.9865 },

  // Telangana
  { state: 'Telangana', district: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { state: 'Telangana', district: 'Warangal', lat: 17.9689, lon: 79.5941 },
  { state: 'Telangana', district: 'Karimnagar', lat: 18.4386, lon: 79.1288 },
  { state: 'Telangana', district: 'Nizamabad', lat: 18.6725, lon: 78.0941 },
  { state: 'Telangana', district: 'Khammam', lat: 17.2473, lon: 80.1514 },
  { state: 'Telangana', district: 'Nalgonda', lat: 17.0575, lon: 79.2684 },
  { state: 'Telangana', district: 'Mahabubnagar', lat: 16.7488, lon: 77.9856 },
  { state: 'Telangana', district: 'Adilabad', lat: 19.6641, lon: 78.532 },

  // Maharashtra
  { state: 'Maharashtra', district: 'Pune', lat: 18.5204, lon: 73.8567 },
  { state: 'Maharashtra', district: 'Nagpur', lat: 21.1458, lon: 79.0882 },
  { state: 'Maharashtra', district: 'Nashik', lat: 19.9975, lon: 73.7898 },
  { state: 'Maharashtra', district: 'Aurangabad (Chhatrapati Sambhajinagar)', lat: 19.8762, lon: 75.3433 },
  { state: 'Maharashtra', district: 'Kolhapur', lat: 16.705, lon: 74.2433 },
  { state: 'Maharashtra', district: 'Solapur', lat: 17.6599, lon: 75.9064 },
  { state: 'Maharashtra', district: 'Amravati', lat: 20.9374, lon: 77.7796 },

  // Karnataka
  { state: 'Karnataka', district: 'Bengaluru Urban', lat: 12.9716, lon: 77.5946 },
  { state: 'Karnataka', district: 'Mysuru', lat: 12.2958, lon: 76.6394 },
  { state: 'Karnataka', district: 'Belagavi', lat: 15.8497, lon: 74.4977 },
  { state: 'Karnataka', district: 'Dharwad (Hubballi)', lat: 15.4589, lon: 75.0078 },
  { state: 'Karnataka', district: 'Kalaburagi (Gulbarga)', lat: 17.3297, lon: 76.8343 },
  { state: 'Karnataka', district: 'Shivamogga', lat: 13.9299, lon: 75.5681 },

  // Punjab & Haryana
  { state: 'Punjab', district: 'Ludhiana', lat: 30.901, lon: 75.8573 },
  { state: 'Punjab', district: 'Amritsar', lat: 31.634, lon: 74.8723 },
  { state: 'Punjab', district: 'Bhatinda', lat: 30.211, lon: 74.9455 },
  { state: 'Punjab', district: 'Jalandhar', lat: 31.326, lon: 75.5762 },
  { state: 'Haryana', district: 'Karnal', lat: 29.6857, lon: 76.9905 },
  { state: 'Haryana', district: 'Hisar', lat: 29.1492, lon: 75.7217 },
  { state: 'Haryana', district: 'Sirsa', lat: 29.5349, lon: 75.0288 },

  // Uttar Pradesh & Madhya Pradesh
  { state: 'Uttar Pradesh', district: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3176, lon: 82.9739 },
  { state: 'Uttar Pradesh', district: 'Kanpur', lat: 26.4499, lon: 80.3319 },
  { state: 'Uttar Pradesh', district: 'Meerut', lat: 28.9845, lon: 77.7064 },
  { state: 'Madhya Pradesh', district: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  { state: 'Madhya Pradesh', district: 'Indore', lat: 22.7196, lon: 75.8577 },
  { state: 'Madhya Pradesh', district: 'Jabalpur', lat: 23.1815, lon: 79.9864 },
  { state: 'Madhya Pradesh', district: 'Ujjain', lat: 23.1765, lon: 75.7885 },

  // Tamil Nadu & Kerala
  { state: 'Tamil Nadu', district: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
  { state: 'Tamil Nadu', district: 'Madurai', lat: 9.9252, lon: 78.1198 },
  { state: 'Tamil Nadu', district: 'Thanjavur', lat: 10.787, lon: 79.1378 },
  { state: 'Tamil Nadu', district: 'Tiruchirappalli', lat: 10.7905, lon: 78.7047 },
  { state: 'Kerala', district: 'Palakkad', lat: 10.7867, lon: 76.6548 },
  { state: 'Kerala', district: 'Wayanad', lat: 11.6854, lon: 76.132 },

  // Rajasthan & Gujarat
  { state: 'Rajasthan', district: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { state: 'Rajasthan', district: 'Jodhpur', lat: 26.2389, lon: 73.0243 },
  { state: 'Rajasthan', district: 'Kota', lat: 25.2138, lon: 75.8648 },
  { state: 'Rajasthan', district: 'Sri Ganganagar', lat: 29.9038, lon: 73.8772 },
  { state: 'Gujarat', district: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { state: 'Gujarat', district: 'Rajkot', lat: 22.3039, lon: 70.8022 },
  { state: 'Gujarat', district: 'Surat', lat: 21.1702, lon: 72.8311 },
  { state: 'Gujarat', district: 'Vadodara', lat: 22.3072, lon: 73.1812 },

  // Bihar & West Bengal & Odisha
  { state: 'Bihar', district: 'Patna', lat: 25.5941, lon: 85.1376 },
  { state: 'Bihar', district: 'Muzaffarpur', lat: 26.1209, lon: 85.3647 },
  { state: 'West Bengal', district: 'Burdwan (Purba Bardhaman)', lat: 23.2324, lon: 87.8615 },
  { state: 'West Bengal', district: 'Hooghly', lat: 22.9034, lon: 88.3881 },
  { state: 'Odisha', district: 'Bhubaneswar (Khurda)', lat: 20.2961, lon: 85.8245 },
  { state: 'Odisha', district: 'Cuttack', lat: 20.4625, lon: 85.883 },
  { state: 'Odisha', district: 'Sambalpur', lat: 21.4669, lon: 83.9812 },
];

export function findLocationCoords(state?: string | null, district?: string | null): { lat: number; lon: number; locationName: string } {
  if (district) {
    const match = INDIAN_LOCATIONS.find(
      (l) => l.district.toLowerCase().includes(district.toLowerCase()) || district.toLowerCase().includes(l.district.toLowerCase())
    );
    if (match) {
      return { lat: match.lat, lon: match.lon, locationName: `${match.district}, ${match.state}` };
    }
  }

  if (state) {
    const match = INDIAN_LOCATIONS.find(
      (l) => l.state.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(l.state.toLowerCase())
    );
    if (match) {
      return { lat: match.lat, lon: match.lon, locationName: `${match.district}, ${match.state}` };
    }
  }

  // Default coordinate: Guntur, Andhra Pradesh (Agricultural capital hub)
  return { lat: 16.3067, lon: 80.4365, locationName: 'Guntur, Andhra Pradesh' };
}
