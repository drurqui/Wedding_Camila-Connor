import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationES from '../locales/es.json';
import translationEN from '../locales/en.json';
import translationFR from '../locales/fr.json'; // 1. Importamos el francés

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  fr: { translation: translationFR } // 2. Lo agregamos a los recursos
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'fr'], // 3. Indicamos que soportamos 'fr'
    interpolation: {
      escapeValue: false 
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;