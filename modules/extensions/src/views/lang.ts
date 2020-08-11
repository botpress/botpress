import { MultiLangText } from 'botpress/sdk'
import { get } from 'lodash'
import { createIntl, createIntlCache, IntlShape } from 'react-intl'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

const defaultLocale = 'en'
const translations = { fr, en }

let store: any
let intl: IntlShape
const cache = createIntlCache()
let currentLocale = ''

const langInit = () => {
  const messages = squash(translations[currentLocale])
  const defaultLang = squash(translations[defaultLocale])
  for (const key in defaultLang) {
    if (!messages[key]) {
      messages[key] = defaultLang[key]
    }
  }

  intl = createIntl(
    {
      locale: currentLocale,
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

export const lang = {
  tr: (id: string | MultiLangText, values?: { [variable: string]: any }): string => {
    if (currentLocale != store.botUILanguage) {
      currentLocale = store.botUILanguage
      langInit()
    }

    if (!id) {
      return ''
    }

    if (typeof id === 'object') {
      return id[currentLocale] || id[defaultLocale] || ''
    }

    return intl.formatMessage({ id }, values)
  },
  set: (thestore: any) => {
    store = thestore
  }
}
