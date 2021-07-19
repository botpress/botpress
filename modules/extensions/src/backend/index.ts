import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

const entryPoint: sdk.ModuleEntryPoint = {
  translations: { en, fr, es },
  definition: {
    name: 'extensions',
    menuText: 'Extensions',
    noInterface: true,
    fullName: 'Extensions',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
