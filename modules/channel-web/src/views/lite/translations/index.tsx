import { addLocaleData } from 'react-intl'
import localeAr from 'react-intl/locale-data/ar'
import localeDe from 'react-intl/locale-data/de'
import localeEn from 'react-intl/locale-data/en'
import localeEs from 'react-intl/locale-data/es'
import localeFr from 'react-intl/locale-data/fr'
import localeIt from 'react-intl/locale-data/it'
import localePt from 'react-intl/locale-data/pt'
import localeRu from 'react-intl/locale-data/ru'
import localeUk from 'react-intl/locale-data/uk'

import ar from './ar.json'
import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import it from './it.json'
import pt from './pt.json'
import ru from './ru.json'
import uk from './uk.json'

const DEFAULT_LOCALE = 'en'
const translations = { en, fr, pt, es, ar, ru, uk, de, it }

type Locale = 'browser' | string

const getCleanLanguageCode = str => str.split('-')[0]

// Desired precedence
// 1 - manual locale = 'browser' : browser
// 2- manual locale = supported lang : manual locale
// 3- storage lang = supported lang : storage lang
// 3- browser lang = supported lang : browser lang
// 4 - default lang
const getUserLocale = (manualLocale: Locale = 'browser') => {
  const browserLocale = getCleanLanguageCode(navigator.language || navigator['userLanguage'] || '')
  const storageLocale = getCleanLanguageCode(window.BP_STORAGE?.get('bp/channel-web/user-lang') || '')

  if (manualLocale === 'browser' && translations[browserLocale]) {
    return browserLocale
  }

  manualLocale = getCleanLanguageCode(manualLocale)
  if (translations[manualLocale]) {
    return manualLocale
  }

  if (translations[storageLocale]) {
    return storageLocale
  }

  return translations[browserLocale] ? browserLocale : DEFAULT_LOCALE
}

const initializeLocale = () => {
  addLocaleData([
    ...localeEn,
    ...localeFr,
    ...localePt,
    ...localeEs,
    ...localeAr,
    ...localeRu,
    ...localeUk,
    ...localeDe,
    ...localeIt
  ])
}

export { initializeLocale, translations, DEFAULT_LOCALE as defaultLocale, getUserLocale }
