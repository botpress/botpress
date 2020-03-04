import axios from 'axios'
import { addLocaleData, InjectedIntl, IntlProvider, MessageValue } from 'react-intl'

const defaultLocale = 'en'
let locale: string
let intl: InjectedIntl

const getUserLocale = () => {
  return 'en'
  const code = str => str.split('-')[0]
  const browserLocale = code(navigator.language || navigator['userLanguage'] || '')
  return browserLocale
}

const initializeTranslations = async () => {
  locale = getUserLocale()
  const { data } = await axios.get(`/assets/ui-studio/public/translations/${locale}.json`)
  intl = new IntlProvider({ locale, defaultLocale, messages: data }, {}).getChildContext().intl
}

const lang = (id: string, values?: { [key: string]: MessageValue }): string => {
  return intl.formatMessage({ id }, values)
}

export { initializeTranslations, lang }
