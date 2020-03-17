import { langExtend, langInit } from 'botpress/shared'

import en from './en.json'
import fr from './fr.json'
const translations = { en, fr }

const initializeTranslations = () => {
  langExtend(translations)
  langInit()
}

export { initializeTranslations }
