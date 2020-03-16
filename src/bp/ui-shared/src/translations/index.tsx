import { PrimitiveType } from 'intl-messageFormat'
import { merge } from 'lodash'
import { createIntl, createIntlCache, IntlShape } from 'react-intl'

const defaultLocale = 'en'
const translations = {}

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

const langExtend = langs => {
  for (const [key, value] of Object.entries(langs)) {
    if (translations[key]) {
      merge(translations[key], value)
    } else {
      translations[key] = value
    }
  }
}

const langInit = () => {
  locale = getUserLocale()

  const messages = squash(translations[locale])
  const defaultLang = squash(translations[defaultLocale])
  for (const key in defaultLang) {
    if (!messages[key]) {
      messages[key] = defaultLang[key]
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

const squash = (space, root = {}, path = '') => {
  for (const [key, value] of Object.entries(space)) {
    if (typeof value === 'object' && value !== null) {
      squash(value, root, path + key + '.')
    } else {
      root[path + key] = value
    }
  }
  return root
}

const lang = (id: string, values?: Record<string, string | PrimitiveType>): string => {
  return intl.formatMessage({ id }, values)
}

export default lang
export { langInit, langExtend }
