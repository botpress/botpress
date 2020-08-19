import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

import PromptComplex from './prompts/complex'
import PromptConfirm from './prompts/confirm'
import PromptDate from './prompts/date'
import PromptEnum from './prompts/enum'
import PromptNumber from './prompts/number'
import PromptPattern from './prompts/pattern'
import PromptString from './prompts/string'
import { setupMiddleware } from './promptHandler'
import BoxedBoolean from './variables/boolean'
import BoxedComplex from './variables/complex'
import BoxedDate from './variables/date'
import BoxedEnum from './variables/enum'
import BoxedNumber from './variables/number'
import BoxedPattern from './variables/pattern'
import BoxedString from './variables/string'

const botTemplates: sdk.BotTemplate[] = [
  { id: 'welcome-bot', name: 'Welcome Bot', desc: `Basic bot that showcases some of the bot's functionality` },
  { id: 'small-talk', name: 'Small Talk', desc: `Includes basic smalltalk examples` }
]

const prompts = [PromptConfirm, PromptDate, PromptNumber, PromptString, PromptEnum, PromptPattern, PromptComplex]

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, prompts)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  variables: [BoxedDate, BoxedBoolean, BoxedNumber, BoxedString, BoxedEnum, BoxedPattern, BoxedComplex],
  botTemplates,
  translations: { en, fr },
  prompts,
  definition: {
    name: 'builtin',
    menuIcon: 'fiber_smart_record',
    fullName: 'Botpress Builtins',
    homepage: 'https://botpress.com',
    noInterface: true
  }
}

export default entryPoint
