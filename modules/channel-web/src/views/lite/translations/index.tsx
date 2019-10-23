import fromPairs from 'lodash/fromPairs'
import { addLocaleData } from 'react-intl'

import localeAr from 'react-intl/locale-data/ar'
import localeEn from 'react-intl/locale-data/en'
import localeEs from 'react-intl/locale-data/es'
import localeFr from 'react-intl/locale-data/fr'
import localePt from 'react-intl/locale-data/pt'
import localeRu from 'react-intl/locale-data/ru'
import localeUk from 'react-intl/locale-data/uk'

import ar from './ar.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import pt from './pt.json'
import ru from './ru.json'
import uk from './uk.json'

const availableLocale = ['en', 'fr', 'pt', 'es', 'ar', 'ru', 'uk']
const defaultLocale = 'en'

const arLocales = ['ar', 'ar-SA', 'ar-IQ', 'ar-EG', 'ar-LY', 'ar-DZ', 'ar-MA', 'ar-TN', 'ar-OM', 'ar-YE',
  'ar-SY', 'ar-JO', 'ar-LB', 'ar-KW', 'ar-AE', 'ar-BH', 'ar-QA' ]
const ruLocales = ['ru', 'ru-BY', 'ru-KG', 'ru-KZ', 'ru-MD', 'ru-MO', 'ru-RU', 'ru-UA']

const translations = {
  ...fromPairs(['en', 'en-US'].map(locale => [locale, en])),
  fr,
  pt,
  es,
  ...fromPairs(arLocales.map(locale => [locale, ar])),
  ...fromPairs(ruLocales.map(locale => [locale, ru])),
  ...fromPairs(['uk', 'uk-UA'].map(locale => [locale, uk])),
}

const getUserLocale = (available?: any, defaultFallback?: string) => {
  const locale = navigator.language || navigator['userLanguage'] || ''
  const langCode = locale.split('-')[0]

  return available && !available.includes(langCode) ? defaultFallback : langCode
}

const initializeLocale = () => {
  addLocaleData([...localeEn, ...localeFr, ...localePt, ...localeEs])
}

export { initializeLocale, translations, availableLocale, defaultLocale, getUserLocale }
