import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './utils/translations';

const savedLanguage = localStorage.getItem('language') || 'es';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        translation: translations.es
      },
      en: {
        translation: translations.en
      }
    },
    lng: savedLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
