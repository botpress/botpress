import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

const botTemplates: sdk.BotTemplate[] = [
  { id: 'welcome-bot', name: 'Welcome Bot', desc: "Basic bot that showcases some of the bot's functionality" },
  { id: 'small-talk', name: 'Small Talk', desc: 'Includes basic smalltalk examples' },
  { id: 'empty-bot', name: 'Empty Bot', desc: 'Start fresh with a clean flow' },
  { id: 'learn-botpress', name: 'Learn Botpress Basics', desc: 'Learn Botpress basic features' }
]

const entryPoint: sdk.ModuleEntryPoint = {
  botTemplates,
  translations: { en, fr, es },
  definition: {
    name: 'builtin',
    menuIcon: 'fiber_smart_record',
    fullName: 'Botpress Builtins',
    homepage: 'https://botpress.com',
    noInterface: true
  }
}

export default entryPoint
