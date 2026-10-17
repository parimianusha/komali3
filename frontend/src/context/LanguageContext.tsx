// ==============================================================================
// AgriSage AI: Multilingual Context (English, Telugu, Hindi)
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage } from '../shared/agriculture';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const LANGUAGE_STORAGE_KEY = 'agrisage_preferred_language';

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation
    nav_dashboard: 'Dashboard',
    nav_farms: 'My Farms & Crops',
    nav_advisory: 'AI Crop Advisory',
    nav_diagnosis: 'Pest & Disease Doctor',
    nav_suitability: 'Crop Suitability',
    nav_documents: 'Soil & Ag Documents',
    nav_history: 'Advisory History',
    nav_settings: 'Settings & Profile',
    nav_sign_out: 'Sign Out',

    // Header & Demo
    demo_badge: 'College Hackathon Edition',
    load_demo_btn: 'Load Demo Records',
    clear_demo_btn: 'Clear Demo Records',
    loading: 'Loading...',

    // Dashboard
    dash_welcome: 'Welcome back',
    dash_tagline: 'Intelligent, localized agricultural advisory and document processing',
    metric_farms: 'Registered Farms',
    metric_crops: 'Active Crops',
    metric_advisories: 'AI Advisory Reports',
    metric_documents: 'Processed Ag Documents',
    quick_action_advisory: 'Get Crop Advisory',
    quick_action_diagnose: 'Diagnose Symptoms / Photo',
    quick_action_suitability: 'Plan Next Crop',
    quick_action_upload: 'Upload Soil Card',
    recent_advisories_title: 'Recent Advisory Reports',
    recent_documents_title: 'Recent Agricultural Documents',
    live_weather_title: 'Live Weather Observation',
    no_farms_yet: 'No farms added yet. Register your first farm or load demo records to get started!',

    // Risk levels
    risk_low: 'Low Risk',
    risk_moderate: 'Moderate Risk',
    risk_high: 'High Risk',
    risk_critical: 'Critical Alert',

    // Forms
    field_farm_name: 'Farm Name',
    field_state: 'State',
    field_district: 'District',
    field_area: 'Farm Area',
    field_soil_type: 'Soil Type',
    field_soil_ph: 'Soil pH (if tested)',
    field_irrigation: 'Irrigation Method',
    field_water: 'Water Availability',
    field_crop_name: 'Crop Name',
    field_variety: 'Variety (optional)',
    field_sowing_date: 'Sowing / Planting Date',
    field_growth_stage: 'Current Growth Stage',
    field_save: 'Save Record',
    field_cancel: 'Cancel',
    field_delete: 'Delete',
    field_upload: 'Upload File',
  },

  te: {
    // Navigation
    nav_dashboard: 'డాష్‌బోర్డ్',
    nav_farms: 'నా పొలాలు & పంటలు',
    nav_advisory: 'AI పంట సలహా',
    nav_diagnosis: 'తెగుళ్లు & పురుగుల వైద్యుడు',
    nav_suitability: 'పంట అనుకూలత',
    nav_documents: 'నేల & వ్యవసాయ పత్రాలు',
    nav_history: 'సలహాల చరిత్ర',
    nav_settings: 'సెట్టింగ్‌లు & ప్రొఫైల్',
    nav_sign_out: 'లాగ్ అవుట్',

    // Header & Demo
    demo_badge: 'కళాశాల హ్యాకథాన్ ఎడిషన్',
    load_demo_btn: 'డెమో రికార్డులను లోడ్ చేయండి',
    clear_demo_btn: 'డెమో డేటాను తొలగించండి',
    loading: 'లోడ్ అవుతోంది...',

    // Dashboard
    dash_welcome: 'స్వాగతం',
    dash_tagline: 'తెలివైన స్థానిక వ్యవసాయ సలహాలు & పత్రాల విశ్లేషణ',
    metric_farms: 'నమోదిత పొలాలు',
    metric_crops: 'సాగులో ఉన్న పంటలు',
    metric_advisories: 'AI సలహా నివేదికలు',
    metric_documents: 'విశ్లేషించిన వ్యవసాయ పత్రాలు',
    quick_action_advisory: 'పంట సలహా పొందండి',
    quick_action_diagnose: 'లక్షణాలు / ఫోటోతో తెగుళ్ల నిర్ధారణ',
    quick_action_suitability: 'తదుపరి పంట ప్రణాళిక',
    quick_action_upload: 'నేల ఆరోగ్య కార్డు అప్‌లోడ్',
    recent_advisories_title: 'ఇటీవలి సలహా నివేదికలు',
    recent_documents_title: 'ఇటీవలి వ్యవసాయ పత్రాలు',
    live_weather_title: 'ప్రత్యక్ష వాతావరణ సమాచారం',
    no_farms_yet: 'ఇంకా పొలాలు జోడించబడలేదు. మొదటి పొలాన్ని నమోదు చేయండి లేదా డెమో రికార్డులను లోడ్ చేయండి!',

    // Risk levels
    risk_low: 'తక్కువ ప్రమాదం',
    risk_moderate: 'మధ్యస్థ ప్రమాదం',
    risk_high: 'అధిక ప్రమాదం',
    risk_critical: 'తీవ్ర హెచ్చరిక',

    // Forms
    field_farm_name: 'పొలం పేరు',
    field_state: 'రాష్ట్రం',
    field_district: 'జిల్లా',
    field_area: 'విస్తీర్ణం',
    field_soil_type: 'నేల రకం',
    field_soil_ph: 'నేల pH (తెలిస్తే)',
    field_irrigation: 'నీటిపారుదల పద్ధతి',
    field_water: 'నీటి లభ్యత',
    field_crop_name: 'పంట పేరు',
    field_variety: 'రకం (ఐచ్ఛికం)',
    field_sowing_date: 'విత్తిన తేది',
    field_growth_stage: 'ప్రస్తుత పంట దశ',
    field_save: 'భద్రపరచు',
    field_cancel: 'రద్దు చేయి',
    field_delete: 'తొలగించు',
    field_upload: 'ఫైల్ అప్‌లోడ్',
  },

  hi: {
    // Navigation
    nav_dashboard: 'डैशबोर्ड',
    nav_farms: 'मेरे खेत और फसलें',
    nav_advisory: 'एआई फसल सलाह',
    nav_diagnosis: 'कीट एवं रोग डॉक्टर',
    nav_suitability: 'फसल उपयुक्तता',
    nav_documents: 'मृदा एवं कृषि दस्तावेज',
    nav_history: 'सलाह इतिहास',
    nav_settings: 'सेटिंग्स एवं प्रोफाइल',
    nav_sign_out: 'लॉग आउट',

    // Header & Demo
    demo_badge: 'कॉलेज हैकथॉन संस्करण',
    load_demo_btn: 'डेमो रिकॉर्ड लोड करें',
    clear_demo_btn: 'डेमो रिकॉर्ड हटाएं',
    loading: 'लोड हो रहा है...',

    // Dashboard
    dash_welcome: 'स्वागत है',
    dash_tagline: 'बुद्धिमान, स्थानीयकृत कृषि सलाह एवं दस्तावेज प्रसंस्करण',
    metric_farms: 'पंजीकृत खेत',
    metric_crops: 'सक्रिय फसलें',
    metric_advisories: 'एआई सलाह रिपोर्ट',
    metric_documents: 'प्रसंस्कृत कृषि दस्तावेज',
    quick_action_advisory: 'फसल सलाह प्राप्त करें',
    quick_action_diagnose: 'लक्षण या फोटो से रोग निदान',
    quick_action_suitability: 'अगली फसल की योजना',
    quick_action_upload: 'मृदा कार्ड अपलोड करें',
    recent_advisories_title: 'हालिया सलाह रिपोर्ट',
    recent_documents_title: 'हालिया कृषि दस्तावेज',
    live_weather_title: 'प्रत्यक्ष मौसम स्थिति',
    no_farms_yet: 'अभी तक कोई खेत नहीं जोड़ा गया। अपना पहला खेत जोड़ें या डेमो रिकॉर्ड लोड करें!',

    // Risk levels
    risk_low: 'कम जोखिम',
    risk_moderate: 'मध्यम जोखिम',
    risk_high: 'उच्च जोखिम',
    risk_critical: 'गंभीर चेतावनी',

    // Forms
    field_farm_name: 'खेत का नाम',
    field_state: 'राज्य',
    field_district: 'जिला',
    field_area: 'क्षेत्रफल',
    field_soil_type: 'मिट्टी का प्रकार',
    field_soil_ph: 'मिट्टी का पीएच (यदि ज्ञात हो)',
    field_irrigation: 'सिंचाई विधि',
    field_water: 'पानी की उपलब्धता',
    field_crop_name: 'फसल का नाम',
    field_variety: 'किस्म (वैकल्पिक)',
    field_sowing_date: 'बुआई की तारीख',
    field_growth_stage: 'वर्तमान फसल चरण',
    field_save: 'सुरक्षित करें',
    field_cancel: 'रद्द करें',
    field_delete: 'हटाएं',
    field_upload: 'फ़ाइल अपलोड करें',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
    return saved && ['en', 'te', 'hi'].includes(saved) ? saved : 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (currentDict[key]) return currentDict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
