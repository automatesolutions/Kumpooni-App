import { initReactI18next } from 'react-i18next'

import i18next from 'i18next'
import en from './en.json'

const resources = {
  en: {
    translation: en,
  },
}

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export const i18n = i18next
