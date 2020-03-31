import { lang } from 'botpress/shared'

import en from './en.json'
import fr from './fr.json'
const translations = { en, fr }
let initialized = false

const initializeTranslations = () => {
  if (!initialized) {
    initialized = true
    lang.extend(translations)
    lang.init()
  }
}

export { initializeTranslations }
