import { MultiLangText } from 'botpress/sdk'
import { isEmpty, merge } from 'lodash'
import { createIntl, createIntlCache, IntlShape } from 'react-intl'

import en from './en.json'
import es from './es.json'
import fr from './fr.json'

const defaultLocale = 'en'
let translations = {}

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
  if (isEmpty(translations)) {
    translations = { en, fr, es }
  }

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
      defaultLocale,
      onError: err => {
        if (isDev) {
          console.error(err)
        }
      }
    },
    cache
  )
}

const langLocale = (): string => {
  return locale
}

const langAvaibale = (): string[] => {
  return Object.keys(translations)
}

const squash = (space, root = {}, path = '') => {
  for (const [key, value] of Object.entries(space)) {
    if (typeof value === 'object' && value !== null) {
      squash(value, root, `${path}${key}.`)
    } else {
      root[path + key] = value
    }
  }
  return root
}

const getUserLocale = () => {
  const code = str => str.split('-')[0]
  const browserLocale = code(navigator.language || navigator['userLanguage'] || '')
  const storageLocale = code(localStorage.getItem('uiLanguage') || '')

  return translations[storageLocale] ? storageLocale : translations[browserLocale] ? browserLocale : defaultLocale
}

/**
 * Can either receive an ID, or an object with keys of supported languages
 */
const lang = (id: string | MultiLangText, values?: { [variable: string]: any }): string => {
  if (!id) {
    return ''
  }

  if (typeof id === 'object') {
    return id[locale] || id[defaultLocale] || ''
  }

  if (isDev) {
    return id
  } else {
    return intl.formatMessage({ id }, values)
  }
}

export { lang, langInit, langExtend, langLocale, langAvaibale, defaultLocale }
