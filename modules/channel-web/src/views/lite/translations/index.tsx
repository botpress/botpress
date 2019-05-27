import { addLocaleData } from 'react-intl'

import localeEn from 'react-intl/locale-data/en'
import localeFr from 'react-intl/locale-data/fr'
import localePt from 'react-intl/locale-data/pt'

import en from './en.json'
import fr from './fr.json'
import pt from './pt.json'

const availableLocale = ['en', 'pt', 'fr']
const defaultLocale = 'en'
const translations = { pt, fr, en, 'en-US': en }

const getUserLocale = (available?: any, defaultFallback?: string) => {
  const locale = navigator.language || navigator['userLanguage'] || ''
  const langCode = locale.split('-')[0]

  return available && !available.includes(langCode) ? defaultFallback : langCode
}

const initializeLocale = () => {
  addLocaleData([...localePt, ...localeEn, ...localeFr])
}

export { initializeLocale, translations, availableLocale, defaultLocale, getUserLocale }
