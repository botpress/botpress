import lang from 'common/lang'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

const defaultLocale = 'en'
const translations = { fr, en }
let isDev: boolean
let store: any

const track = (target: any) => {
  store = target
  lang.init(translations, 'module.extensions.')
  isDev = localStorage.getItem('langdebug') === 'true'
}

const tr = (key: string, values?: { [variable: string]: any }) => {
  if (isDev) {
    return key
  }

  return lang.tr(key, values, store?.botUILanguage || defaultLocale)
}

export default { tr, track }
