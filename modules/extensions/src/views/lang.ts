import IntlMessageFormat from 'intl-messageformat'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

const defaultLocale = 'en'
const translations = { fr, en }
let isDev: boolean
let store: any

const track = (target: any) => {
  store = target
  init(translations, 'module.extensions.')
  isDev = localStorage.getItem('langdebug') === 'true'
}

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

const tr = (key: string, values?: { [variable: string]: any }) => {
  if (isDev) {
    return key
  }

  const text = translations[store.botUILanguage]?.[key] || translations[defaultLocale][key]
  return values ? new IntlMessageFormat(text, []).format(values) : text
}

const squash = (space, root = {}, path = ''): { [key: string]: string } => {
  for (const [key, value] of Object.entries(space)) {
    if (typeof value === 'object' && value !== null) {
      squash(value, root, path + key + '.')
    } else {
      root[path + key] = value
    }
  }
  return root
}

export default { init, tr, track }
