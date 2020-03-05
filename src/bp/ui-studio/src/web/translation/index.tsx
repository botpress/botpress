import axios from 'axios'
import { PrimitiveType } from 'intl-messageFormat'
import { createIntl, createIntlCache, IntlShape } from 'react-intl'

const defaultLocale = 'en'
let locale: string
let intl: IntlShape
const cache = createIntlCache()

const getUserLocale = () => {
  const code = str => str.split('-')[0]
  const browserLocale = code(navigator.language || navigator['userLanguage'] || '')
  return browserLocale
}

const initializeTranslations = async () => {
  locale = getUserLocale()
  const { data } = await axios.get(`/assets/ui-studio/public/translations/${locale}.json`)
  intl = createIntl(
    {
      locale,
      messages: data,
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
