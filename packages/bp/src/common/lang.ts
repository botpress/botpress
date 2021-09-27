import IntlMessageFormat from 'intl-messageformat'
import get from 'lodash/get'
import merge from 'lodash/merge'

const defaultLocale = 'en'
const translations = {}

// TODO: Merge logic with the ui-shared translations

const init = (langs: { [lang: string]: any }, prefix?: string) => {
  const defaultLang = squash(langs[defaultLocale], {}, prefix ?? '')

  Object.keys(langs).map(lang => {
    const messages = squash(langs[lang], {}, prefix ?? '')

    for (const key in defaultLang) {
      if (!messages[key]) {
        messages[key] = defaultLang[key]
      }
    }

    translations[lang] = messages
  })
}

/**
 * When lang is omitted, it will return an object with all known language as keys so it can be used by the CMS renderer
 */
const tr = (key: string, values?: { [variable: string]: any }, lang?: string) => {
  const getFormattedText = (lang: string) => {
    const text = get(translations?.[lang], key) || ''
    return values ? new IntlMessageFormat(text, []).format(values) : text
  }

  if (!lang) {
    return Object.keys(translations).reduce((acc, lang) => ({ ...acc, [lang]: getFormattedText(lang) }), {})
  } else {
    return getFormattedText(lang)
  }
}

const extend = langs => {
  for (const [key, value] of Object.entries(langs)) {
    if (translations[key]) {
      merge(translations[key], value)
    } else {
      translations[key] = value
    }
  }
}

const squash = (space, root = {}, path = ''): { [key: string]: string } => {
  if (!space) {
    return {}
  }

  for (const [key, value] of Object.entries(space)) {
    if (typeof value === 'object' && value !== null) {
      squash(value, root, `${path}${key}.`)
    } else {
      root[path + key] = value
    }
  }
  return root
}

const available = () => Object.keys(translations)

export default { init, tr, extend, available }
