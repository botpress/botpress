import { PrimitiveType } from 'intl-messageFormat'
import { createIntl, createIntlCache, IntlShape } from 'react-intl'

import ar from './ar.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import pt from './pt.json'
import ru from './ru.json'
import uk from './uk.json'

const defaultLocale = 'en'
const translations = { en, fr, pt, es, ar, ru, uk }

let locale: string
let intl: IntlShape
const cache = createIntlCache()

const getUserLocale = (manualLocale?: 'browser' | string) => {
  const code = str => str.split('-')[0]
  const browserLocale = code(navigator.language || navigator['userLanguage'] || '')
  const storageLocale = code(localStorage.getItem('bp/channel-web/user-lang') || '')
  const locale = code(manualLocale === 'browser' ? browserLocale : manualLocale || '')

  return translations[locale] ? locale : translations[storageLocale] ? storageLocale : defaultLocale
}

const initializeTranslations = () => {
  locale = getUserLocale()

  const messages = translations[locale]
  for (const key in en) {
    if (!messages[key]) {
      messages[key] = en[key]
    }
  }

  intl = createIntl(
    {
      locale,
      messages,
      defaultLocale
    },
    cache
  )
}

const lang = (id: string, values?: Record<string, string | PrimitiveType>): string => {
  return intl.formatMessage({ id }, values)
}

export default lang
export { initializeTranslations }
