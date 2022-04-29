import { addLocaleData } from 'react-intl'
import localeAr from 'react-intl/locale-data/ar'
import localeDe from 'react-intl/locale-data/de'
import localeEn from 'react-intl/locale-data/en'
import localeEs from 'react-intl/locale-data/es'
import localeFr from 'react-intl/locale-data/fr'
import localeIt from 'react-intl/locale-data/it'
import localeNl from 'react-intl/locale-data/nl'
import localePt from 'react-intl/locale-data/pt'
import localeRu from 'react-intl/locale-data/ru'
import localeUk from 'react-intl/locale-data/uk'

import ar from './ar.json'
import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import it from './it.json'
import nl from './nl.json'
import pt from './pt.json'
import ru from './ru.json'
import uk from './uk.json'

type Locale = 'browser' | string

const DEFAULT_LOCALE = 'en'
const STORAGE_KEY = 'bp/channel-web/user-lang'
const translations = { en, fr, pt, es, ar, ru, uk, de, it, nl }

const cleanLanguageCode = (str: string) => str.split('-')[0]
const getNavigatorLanguage = () => cleanLanguageCode(navigator.language || navigator['userLanguage'] || '')
const getStorageLanguage = () => cleanLanguageCode(window.BP_STORAGE?.get(STORAGE_KEY) || '')

// Desired precedence
// 1- manual locale = 'browser' : browser lang
// 2- manual locale is supported : manual lang
// 3- storage lang is supported : storage lang
// 4- browser lang is supported : browser lang
// 5- default lang
const getUserLocale = (manualLocale: Locale = 'browser') => {
  const browserLocale = getNavigatorLanguage()
  if (manualLocale === 'browser' && translations[browserLocale]) {
    return browserLocale
  }

  manualLocale = cleanLanguageCode(manualLocale)
  if (translations[manualLocale]) {
    return manualLocale
  }

  const storageLocale = getStorageLanguage()
  if (translations[storageLocale]) {
    return storageLocale
  }

  return translations[browserLocale] ? browserLocale : DEFAULT_LOCALE
}

const initializeLocale = () => {
  addLocaleData([
    ...localeEn,
    ...localeFr,
    ...localePt,
    ...localeEs,
    ...localeAr,
    ...localeRu,
    ...localeUk,
    ...localeDe,
    ...localeIt,
    ...localeNl
  ])
}

export { initializeLocale, translations, DEFAULT_LOCALE as defaultLocale, getUserLocale }
