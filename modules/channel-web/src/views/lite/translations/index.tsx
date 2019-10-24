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

const defaultLocale = 'en'
const baseTranslations = { en, fr, pt, es, ar, ru, uk }
const availableLocale = Object.keys(baseTranslations)

// Handle region language subtags like 'en-US' and 'ar-IQ'
const isTranslationMatching = prop => key => String(prop).split('-')[0] === key
const translations = new Proxy(baseTranslations, {
  get: (target, prop) => target[Object.keys(target).find(isTranslationMatching(prop))]
})

const getUserLocale = (available?: any, defaultFallback?: string) => {
  const locale = navigator.language || navigator['userLanguage'] || ''
  const langCode = locale.split('-')[0]

  return available && !available.includes(langCode) ? defaultFallback : langCode
}

const initializeLocale = () => {
  addLocaleData([...localeEn, ...localeFr, ...localePt, ...localeEs, ...localeAr, ...localeRu, ...localeUk])
}

export { initializeLocale, translations, availableLocale, defaultLocale, getUserLocale }
