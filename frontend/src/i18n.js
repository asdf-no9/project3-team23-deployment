import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

/**
 * This file is used to configure the i18next library for internationalization (i18n).
 * @returns i18n instance
 * @author Antony Quach
 */

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', 
    },
    lng: 'en', 
    fallbackLng: 'en', //Default language if unable to translate
    interpolation: {
      escapeValue: false, 
    },
  });

//Export i18n instance 
export default i18n;