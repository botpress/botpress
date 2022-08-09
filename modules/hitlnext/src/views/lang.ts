import lang from 'common/lang'

import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

const defaultLocale = 'en'
const translations = { fr, en, es }
let locale = ''
let isDev: boolean

const init = () => {
  lang.init(translations, 'module.hitlnext.')
  locale = getUserLocale()
  isDev = localStorage.getItem('langdebug') === 'true'
}

const getUserLocale = () => {
  const code = str => str.split('-')[0]
  const browserLocale = code(navigator.language || navigator['userLanguage'] || '')
  const storageLocale = code(localStorage.getItem('uiLanguage') || '')

  return translations[storageLocale] ? storageLocale : translations[browserLocale] ? browserLocale : defaultLocale
}

const tr = (key: string, values?: { [variable: string]: any }) => {
  if (isDev) {
    return key
  }

  return lang.tr(key, values, locale || defaultLocale)
}

export default { tr, init }
