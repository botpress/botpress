import { addLocaleData } from 'react-intl'
import localeAr from 'react-intl/locale-data/ar'
import localeDe from 'react-intl/locale-data/de'
import localeEn from 'react-intl/locale-data/en'
import localeEs from 'react-intl/locale-data/es'
import localeFr from 'react-intl/locale-data/fr'
import localePt from 'react-intl/locale-data/pt'
import localeRu from 'react-intl/locale-data/ru'
import localeUk from 'react-intl/locale-data/uk'

import ar from './ar.json'
import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import pt from './pt.json'
import ru from './ru.json'
import uk from './uk.json'

const defaultLocale = 'en'
const translations = { en, fr, pt, es, ar, ru, uk, de }

const getUserLocale = (manualLocale?: 'browser' | string) => {
  const code = str => str.split('-')[0]
  const browserLocale = code(navigator.language || navigator['userLanguage'] || '')
  const storageLocale = code(localStorage.getItem('bp/channel-web/user-lang') || '')
  manualLocale = code(manualLocale === 'browser' ? browserLocale : manualLocale || '')

  return translations[manualLocale] ? manualLocale : translations[storageLocale] ? storageLocale : defaultLocale
}

const initializeLocale = () => {
  addLocaleData([...localeEn, ...localeFr, ...localePt, ...localeEs, ...localeAr, ...localeRu, ...localeUk, ...localeDe])
}

export { initializeLocale, translations, defaultLocale, getUserLocale }
