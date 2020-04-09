import { lang } from 'botpress/shared'

import en from './en.json'
import fr from './fr.json'
const translations = { en, fr }

const initializeTranslations = () => {
  lang.extend(translations)
  lang.init()
}

export { initializeTranslations }
