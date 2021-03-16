import { lang } from 'botpress/shared'

import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import pt from './pt.json'

const translations = { en, es, fr, pt }

const initializeTranslations = () => {
  lang.extend(translations)
  lang.init()
}

export { initializeTranslations }
