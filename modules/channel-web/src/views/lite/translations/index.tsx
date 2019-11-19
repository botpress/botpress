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
const translations = { en, fr, pt, es, ar, ru, uk }

const getUserLocale = () => {
  const locale = navigator.language || navigator['userLanguage'] || ''
  const langCode = locale.split('-')[0]

  return translations[langCode] ? langCode : defaultLocale
}

const initializeLocale = () => {
  addLocaleData([...localeEn, ...localeFr, ...localePt, ...localeEs, ...localeAr, ...localeRu, ...localeUk])
}

export { initializeLocale, translations, defaultLocale, getUserLocale }
