import { PrimitiveType } from 'intl-messageFormat'
import { merge } from 'lodash'
import { createIntl, createIntlCache, IntlShape } from 'react-intl'

const defaultLocale = 'en'
const translations = {}

let locale: string
let intl: IntlShape
const cache = createIntlCache()
let isDev = false

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'q') {
    isDev = !isDev
    localStorage.setItem('langdebug', isDev ? 'true' : 'false')
    window.location.reload()
  }
})

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
  isDev = localStorage.getItem('langdebug') === 'true'

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

const langLocale = (): string => {
  return locale
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

const getUserLocale = () => {
  const code = str => str.split('-')[0]
  const browserLocale = code(navigator.language || navigator['userLanguage'] || '')
  const locale = code(browserLocale || '')

  return translations[locale] ? locale : defaultLocale
}

const lang = (id: string, values?: { [variable: string]: any }): string => {
  if (isDev) {
    return id
  } else {
    return intl.formatMessage({ id }, values)
  }
}

export { lang, langInit, langExtend, langLocale }
