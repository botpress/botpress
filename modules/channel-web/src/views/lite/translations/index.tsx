import { addLocaleData } from 'react-intl'

import localeEn from 'react-intl/locale-data/en'
import localeFr from 'react-intl/locale-data/fr'
import localePt from 'react-intl/locale-data/pt'
import localeEs from 'react-intl/locale-data/es'

import en from './en.json'
import fr from './fr.json'
import pt from './pt.json'
import es from './es.json'

const availableLocale = ['en', 'fr', 'pt', 'es']
const defaultLocale = 'en'
const translations = { 'en-US': en, en, fr, pt, es }

const getUserLocale = (available?: any, defaultFallback?: string) => {
  const locale = navigator.language || navigator['userLanguage'] || ''
  const langCode = locale.split('-')[0]

  return available && !available.includes(langCode) ? defaultFallback : langCode
}

const initializeLocale = () => {
  addLocaleData([...localeEn, ...localeFr, ...localePt, ...localeEs])
}

export { initializeLocale, translations, availableLocale, defaultLocale, getUserLocale }
