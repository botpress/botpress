import { langExtend, langInit } from 'botpress/i18n'

import en from './en.json'
import fr from './fr.json'
const translations = { en, fr }

const initializeTranslations = () => {
  langExtend(translations)
  langInit()
}

export { initializeTranslations }
